# Bridger AWS infrastructure (CDK)

Plain-English guide to what this deploys and how to deploy it. Non-technical
readers: follow the numbered steps in order.

## What this creates (in AWS)

- **Secret vault** (Secrets Manager, encrypted with our own KMS key): holds the
  server-only keys (Supabase, AI, email). The phone app never sees these.
- **API server** (App Runner): runs our NestJS API from a container, autoscales,
  gets a public HTTPS address, and is health-checked at `/health`.
- **Web hosting** (S3 + CloudFront): stores the built web files and serves them
  fast and over HTTPS worldwide.

It is split into two stacks on purpose:

- `BridgerFoundationStack` - the secret vault + web hosting (deploy FIRST).
- `BridgerServiceStack` - the API server (deploy AFTER the secret is filled, so
  the server boots healthy).

Region: **us-east-1** (App Runner is not available in Canada; this is the closest
region to our Supabase database in `ca-central-1`).

## One-time prerequisites

1. **Docker Desktop** installed and running. CDK builds the API into a container,
   which needs Docker. Get it: https://www.docker.com/products/docker-desktop/
2. **AWS credentials** active on your machine (already set up). Verify with:
   `aws sts get-caller-identity`

## Deploy steps

Run these from the repo root.

1. **One-time CDK bootstrap** (prepares your AWS account for CDK):

   ```bash
   pnpm --filter @bridger/infra bootstrap
   ```

2. **Deploy the foundation** (secret vault + web hosting):

   ```bash
   pnpm --filter @bridger/infra deploy BridgerFoundationStack
   ```

3. **Fill the secret** with the real values from `apps/api/.env` (write-only; no
   values are printed):

   ```bash
   node infra/aws/scripts/seed-secret.mjs
   ```

4. **Deploy the API** (builds the Docker image, pushes it, starts App Runner):

   ```bash
   pnpm --filter @bridger/infra deploy BridgerServiceStack
   ```

   When it finishes, it prints `ApiUrl` - the public address of the API. Visit
   `<ApiUrl>/health` to confirm it's alive.

## Updating later

- **New API code** -> re-run step 4. It rebuilds the image and rolls out.
- **Changed a secret value** -> edit `apps/api/.env`, re-run step 3, then trigger
  a new API deployment (step 4) so the server picks it up.
- **New web build** -> `expo export` the web app, upload to the S3 bucket named in
  the foundation outputs, then invalidate the CloudFront cache. (We'll script this
  when we wire CI/CD.)

## Notes

- Deleting the service stack removes the API; the secret + KMS key are set to
  RETAIN so they are never destroyed by accident.
- The web bucket empties + deletes on teardown (the web build is reproducible).
