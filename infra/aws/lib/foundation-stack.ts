// ============================================
// WHAT THIS FILE DOES (plain English):
// The "stateful" half of our AWS setup - the pieces that hold data or secrets and
// that we want to create FIRST and rarely touch:
//
//   1) A dedicated encryption key (KMS) for our secret.
//   2) The locked vault (Secrets Manager) holding the server-only keys. It starts
//      EMPTY (no secrets live in this code); we fill the real values in a separate
//      write-only step BEFORE the API server is deployed.
//   3) Consumer web hosting: private S3 + CloudFront.
//   4) Admin console hosting: its own private S3 + CloudFront (separate blast radius).
//
// We deploy this stack first, fill the secret, then deploy the service stack.
// ============================================
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

export interface BridgerFoundationStackProps extends cdk.StackProps {
  /** Shared Secrets Manager name (must match the service stack). */
  serverSecretName?: string;
  /**
   * Custom domain names for the consumer web CDN (e.g. bridger.social + www).
   * Leave empty to serve only on the default *.cloudfront.net address.
   */
  webDomainNames?: string[];
  /**
   * ARN of an already-issued ACM certificate (must be in us-east-1) that
   * covers every name in webDomainNames. Required if webDomainNames is set.
   */
  webCertificateArn?: string;
}

export class BridgerFoundationStack extends cdk.Stack {
  // Kept for outputs / seed scripts that look up the secret from this stack.
  public readonly serverSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props?: BridgerFoundationStackProps) {
    super(scope, id, props);

    const secretName = props?.serverSecretName ?? 'bridger/api/server';

    // --- SECURITY: our own key that encrypts the secret (auto-rotates yearly) ---
    const secretKey = new kms.Key(this, 'SecretKmsKey', {
      description: 'Encrypts the Bridger API server secret',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // --- The server-only secret: JSON with one field per env var, all EMPTY. ---
    // Real values are written afterwards with a write-only step (see README), so
    // nothing sensitive ever lives in this code or the CloudFormation template.
    this.serverSecret = new secretsmanager.Secret(this, 'ServerSecret', {
      secretName,
      description: 'Server-only environment for the Bridger API (never shipped to the app)',
      encryptionKey: secretKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          SUPABASE_URL: '',
          SUPABASE_SECRET_KEY: '',
          DATABASE_URL: '',
          ANTHROPIC_API_KEY: '',
          OPENAI_API_KEY: '',
          RESEND_API_KEY: '',
          COOP_IDEA_REVIEW_EMAIL: '',
          COOP_ADMIN_USERNAMES: '',
          COOP_ADMIN_EMAILS: '',
          ADMIN_API_KEY: '',
          // Admin console password gate (never ship to any client).
          ADMIN_PASSWORD: '',
          ADMIN_JWT_SECRET: '',
          EMAIL_HMAC_KEY: '',
          EMAIL_ENCRYPTION_KEY: '',
          SPOTIFY_CLIENT_ID: '',
          SPOTIFY_CLIENT_SECRET: '',
          SPOTIFY_REDIRECT_URI: '',
          MUSIC_TOKEN_ENCRYPTION_KEY: '',
          APPLE_MUSIC_TEAM_ID: '',
          APPLE_MUSIC_KEY_ID: '',
          APPLE_MUSIC_MEDIA_ID: '',
          APPLE_MUSIC_PRIVATE_KEY: '',
          APPLE_MUSIC_ORIGIN: '',
          API_PUBLIC_URL: '',
          APP_WEB_URL: '',
          STRIPE_SECRET_KEY: '',
          STRIPE_PRICE_MONTHLY: '',
          STRIPE_PRICE_YEARLY: '',
          STRIPE_WEBHOOK_SECRET: '',
          REVENUECAT_WEBHOOK_SECRET: '',
          POSTHOG_HOST: '',
          POSTHOG_PROJECT_ID: '',
          POSTHOG_PERSONAL_API_KEY: '',
          POSTHOG_PROJECT_API_KEY: '',
          TWILIO_ACCOUNT_SID: '',
          TWILIO_AUTH_TOKEN: '',
          TWILIO_MESSAGE_SERVICE_SID: '',
          TWILIO_FROM_NUMBER: ''
        }),
        generateStringKey: '_unused'
      }
    });

    // --- Private storage for the built consumer web files ---
    const webBucket = new s3.Bucket(this, 'WebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // --- Our own domain on the consumer CDN (only if we passed one in) ---
    // If webDomainNames is set, we attach the domain(s) plus the matching HTTPS
    // certificate so CloudFront answers for bridger.social over HTTPS. The cert
    // must already exist in us-east-1 (we created it with `aws acm request-certificate`).
    const webCertificate =
      props?.webCertificateArn && props.webDomainNames?.length
        ? acm.Certificate.fromCertificateArn(this, 'WebCert', props.webCertificateArn)
        : undefined;

    // --- CDN for the consumer web app ---
    const distribution = new cloudfront.Distribution(this, 'WebCdn', {
      defaultRootObject: 'index.html',
      // Our custom domain names, when provided (otherwise only *.cloudfront.net).
      domainNames: props?.webDomainNames?.length ? props.webDomainNames : undefined,
      certificate: webCertificate,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(webBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      // Expo Router routes in the browser, so send unknown paths to the app shell.
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' }
      ]
    });

    // --- Admin console: its own bucket + CDN (separate from the consumer app) ---
    const adminWebBucket = new s3.Bucket(this, 'AdminWebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const adminDistribution = new cloudfront.Distribution(this, 'AdminWebCdn', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(adminWebBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      },
      // Vite SPA: unknown paths fall back to the shell.
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' }
      ]
    });

    // --- Handy values printed after deploy ---
    new cdk.CfnOutput(this, 'WebBucketName', {
      description: 'Upload the built web files here (from expo export)',
      value: webBucket.bucketName
    });
    new cdk.CfnOutput(this, 'WebUrl', {
      description: 'Public HTTPS address of the web app',
      value: `https://${distribution.distributionDomainName}`
    });
    new cdk.CfnOutput(this, 'AdminWebBucketName', {
      description: 'Upload the built admin console here (from apps/admin vite build)',
      value: adminWebBucket.bucketName
    });
    new cdk.CfnOutput(this, 'AdminWebUrl', {
      description: 'Public HTTPS address of the admin console',
      value: `https://${adminDistribution.distributionDomainName}`
    });
    new cdk.CfnOutput(this, 'ServerSecretName', {
      description: 'Name of the server secret to fill with real values',
      value: this.serverSecret.secretName
    });
    new cdk.CfnOutput(this, 'ServerSecretArn', {
      description: 'ARN of the server secret',
      value: this.serverSecret.secretArn,
      // Keep this export name matching what is already deployed so a plain
      // web-domain deploy stays surgical (no output churn / no import breakage).
      exportName: 'BridgerServerSecretArn'
    });
  }
}
