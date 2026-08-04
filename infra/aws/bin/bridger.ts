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

const foundation = new BridgerFoundationStack(app, 'BridgerFoundationStack', {
  env,
  description: 'Bridger secret vault + S3/CloudFront web hosting'
});

new BridgerServiceStack(app, 'BridgerServiceStack', {
  env,
  description: 'Bridger API on App Runner',
  serverSecret: foundation.serverSecret
});
