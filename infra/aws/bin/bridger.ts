// ============================================
// WHAT THIS FILE DOES (plain English):
// The entry point for our AWS infrastructure. It defines two stacks (named groups
// of resources) in US East (N. Virginia) - the closest App Runner region to our
// Canadian Supabase database:
//
//   * BridgerFoundationStack - the secret vault + web hosting (deploy FIRST).
//   * BridgerServiceStack    - the API server (deploy AFTER the secret is filled).
//
// The AWS account comes from whatever credentials are active.
//
// IMPORTANT: we do NOT pass the Secret construct object from foundation into
// the service stack. That creates a CloudFormation dependency cycle (the
// secret's resource policy would need the App Runner role ARN, and the role
// would need the secret). The service stack looks the secret up by name instead.
// ============================================
import * as cdk from 'aws-cdk-lib';
import { BridgerFoundationStack } from '../lib/foundation-stack';
import { BridgerServiceStack } from '../lib/service-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  // App Runner isn't offered in Canada; us-east-1 is nearest to Supabase (ca-central-1).
  region: 'us-east-1'
};

// Shared secret name — both stacks agree on this string. Foundation creates it;
// the service stack imports it by name (no cross-stack construct reference).
const SERVER_SECRET_NAME = 'bridger/api/server';

// Optional custom domain for the consumer website, supplied at deploy time via
// environment variables so we don't hardcode it:
//   WEB_DOMAIN_NAMES="bridger.social,www.bridger.social"
//   WEB_CERT_ARN="arn:aws:acm:us-east-1:...:certificate/..."
// Leave both unset to keep serving only on the default *.cloudfront.net address.
const webDomainNames = (process.env.WEB_DOMAIN_NAMES ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const webCertificateArn = process.env.WEB_CERT_ARN?.trim() || undefined;

new BridgerFoundationStack(app, 'BridgerFoundationStack', {
  env,
  description: 'Bridger secret vault + S3/CloudFront web hosting',
  serverSecretName: SERVER_SECRET_NAME,
  webDomainNames: webDomainNames.length ? webDomainNames : undefined,
  webCertificateArn
});

new BridgerServiceStack(app, 'BridgerServiceStack', {
  env,
  description: 'Bridger API on App Runner',
  serverSecretName: SERVER_SECRET_NAME
});
