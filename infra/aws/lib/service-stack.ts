// ============================================
// WHAT THIS FILE DOES (plain English):
// The "service" half of our AWS setup - the actual API server. We deploy this
// AFTER the foundation stack exists and its secret has been filled in, so the
// server starts up healthy.
//
// It builds our Dockerfile into an image, runs it on App Runner (autoscaling,
// public HTTPS, health-checked at /health), and injects the server-only keys
// from the vault as environment variables. The server is granted permission to
// read ONLY that one secret.
// ============================================
import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ecrAssets from 'aws-cdk-lib/aws-ecr-assets';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';

// The foundation stack creates the secret; we look it up by the shared name so
// CloudFormation does not wire a cross-stack construct reference (that caused
// a dependency cycle with the App Runner instance role).
export interface BridgerServiceStackProps extends cdk.StackProps {
  serverSecretName: string;
}

export class BridgerServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BridgerServiceStackProps) {
    super(scope, id, props);

    // Import by name — no CFN dependency on the foundation stack's Secret.
    const serverSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'ServerSecret',
      props.serverSecretName
    );

    // --- Build our Dockerfile into an image CDK pushes to AWS automatically. ---
    // Build context is the repo root (so the monorepo prune works); the Dockerfile
    // lives with the API. We force linux/amd64 because App Runner runs on x86.
    const apiImage = new ecrAssets.DockerImageAsset(this, 'ApiImage', {
      directory: path.join(__dirname, '..', '..', '..'),
      file: 'apps/api/Dockerfile',
      platform: ecrAssets.Platform.LINUX_AMD64
    });

    // --- The server's identity: it may read ONLY our one secret (least privilege) ---
    const instanceRole = new iam.Role(this, 'ApiInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      description: 'Runtime identity for the Bridger API; can read only its own secret'
    });
    // Identity-based grant only (on this role). Do NOT call serverSecret.grantRead()
    // against a secret owned by another stack — that writes a resource policy there
    // and creates a cross-stack dependency cycle.
    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ReadBridgerServerSecret',
        actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
        // fromSecretNameV2 yields a partial ARN; append /* so stage/version works.
        resources: [`${serverSecret.secretArn}-??????`, serverSecret.secretArn]
      })
    );
    // Decrypt with the secret's KMS key when Secrets Manager asks for it.
    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'DecryptViaSecretsManager',
        actions: ['kms:Decrypt', 'kms:DescribeKey'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:ViaService': `secretsmanager.${this.region}.amazonaws.com`
          }
        }
      })
    );

    // --- The App Runner service: our public, autoscaling API. ---
    const service = new apprunner.Service(this, 'ApiService', {
      serviceName: 'bridger-api',
      source: apprunner.Source.fromAsset({
        asset: apiImage,
        imageConfiguration: {
          port: 3000,
          // Inject each secret field as an environment variable at runtime.
          environmentSecrets: {
            SUPABASE_URL: apprunner.Secret.fromSecretsManager(serverSecret, 'SUPABASE_URL'),
            SUPABASE_SECRET_KEY: apprunner.Secret.fromSecretsManager(serverSecret, 'SUPABASE_SECRET_KEY'),
            DATABASE_URL: apprunner.Secret.fromSecretsManager(serverSecret, 'DATABASE_URL'),
            ANTHROPIC_API_KEY: apprunner.Secret.fromSecretsManager(serverSecret, 'ANTHROPIC_API_KEY'),
            OPENAI_API_KEY: apprunner.Secret.fromSecretsManager(serverSecret, 'OPENAI_API_KEY'),
            RESEND_API_KEY: apprunner.Secret.fromSecretsManager(serverSecret, 'RESEND_API_KEY'),
            COOP_IDEA_REVIEW_EMAIL: apprunner.Secret.fromSecretsManager(serverSecret, 'COOP_IDEA_REVIEW_EMAIL'),
            COOP_ADMIN_USERNAMES: apprunner.Secret.fromSecretsManager(serverSecret, 'COOP_ADMIN_USERNAMES'),
            COOP_ADMIN_EMAILS: apprunner.Secret.fromSecretsManager(serverSecret, 'COOP_ADMIN_EMAILS'),
            ADMIN_API_KEY: apprunner.Secret.fromSecretsManager(serverSecret, 'ADMIN_API_KEY'),
            ADMIN_PASSWORD: apprunner.Secret.fromSecretsManager(serverSecret, 'ADMIN_PASSWORD'),
            ADMIN_JWT_SECRET: apprunner.Secret.fromSecretsManager(serverSecret, 'ADMIN_JWT_SECRET'),
            EMAIL_HMAC_KEY: apprunner.Secret.fromSecretsManager(serverSecret, 'EMAIL_HMAC_KEY'),
            EMAIL_ENCRYPTION_KEY: apprunner.Secret.fromSecretsManager(serverSecret, 'EMAIL_ENCRYPTION_KEY')
          }
        }
      }),
      instanceRole,
      // Smallest (cheapest) size; App Runner scales it up under load.
      cpu: apprunner.Cpu.QUARTER_VCPU,
      memory: apprunner.Memory.HALF_GB,
      // We deploy on purpose, not automatically on every image push.
      autoDeploymentsEnabled: false,
      // App Runner keeps the service healthy by pinging /health.
      healthCheck: apprunner.HealthCheck.http({
        path: '/health',
        interval: cdk.Duration.seconds(10),
        timeout: cdk.Duration.seconds(5),
        healthyThreshold: 1,
        unhealthyThreshold: 5
      })
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      description: 'Public HTTPS address of the Bridger API',
      value: `https://${service.serviceUrl}`
    });
  }
}
