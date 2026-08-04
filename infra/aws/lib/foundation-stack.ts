// ============================================
// WHAT THIS FILE DOES (plain English):
// The "stateful" half of our AWS setup - the pieces that hold data or secrets and
// that we want to create FIRST and rarely touch:
//
//   1) A dedicated encryption key (KMS) for our secret.
//   2) The locked vault (Secrets Manager) holding the server-only keys. It starts
//      EMPTY (no secrets live in this code); we fill the real values in a separate
//      write-only step BEFORE the API server is deployed.
//   3) The website hosting: a private S3 bucket for the built web files + a
//      CloudFront CDN that serves them fast and over HTTPS.
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

export class BridgerFoundationStack extends cdk.Stack {
  // Exposed so the service stack can reference the same secret.
  public readonly serverSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
      secretName: 'bridger/api/server',
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
          EMAIL_HMAC_KEY: '',
          EMAIL_ENCRYPTION_KEY: ''
        }),
        generateStringKey: '_unused'
      }
    });

    // --- Private storage for the built web files (no direct public access). ---
    const webBucket = new s3.Bucket(this, 'WebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      // The web build is reproducible, so it's safe to empty + delete on teardown.
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // --- The CDN that serves the site fast + over HTTPS worldwide. ---
    const distribution = new cloudfront.Distribution(this, 'WebCdn', {
      defaultRootObject: 'index.html',
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

    // --- Handy values printed after deploy ---
    new cdk.CfnOutput(this, 'WebBucketName', {
      description: 'Upload the built web files here (from expo export)',
      value: webBucket.bucketName
    });
    new cdk.CfnOutput(this, 'WebUrl', {
      description: 'Public HTTPS address of the web app',
      value: `https://${distribution.distributionDomainName}`
    });
    new cdk.CfnOutput(this, 'ServerSecretName', {
      description: 'Name of the server secret to fill with real values',
      value: this.serverSecret.secretName
    });
    new cdk.CfnOutput(this, 'ServerSecretArn', {
      description: 'ARN of the server secret',
      value: this.serverSecret.secretArn
    });
  }
}
