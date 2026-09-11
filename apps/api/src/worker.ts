// ============================================
// WHAT THIS FILE DOES (plain English):
// A small background process that wakes up, locks this Monday's Friend Pod
// week if needed, runs a batch of AI jobs, then sleeps. App Runner cron (or
// a long-running worker service) can call this entrypoint so user taps never
// wait on a model.
// ============================================
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AiWorkerService } from './ai/ai-worker.service';
import { RecapService } from './recap/recap.service';
import { loadServerSecretIntoEnv } from './load-server-secret';

async function main() {
  // THIS SECTION DOES: same vault load as the API, so worker jobs see the keys.
  await loadServerSecretIntoEnv();

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log']
  });
  const worker = app.get(AiWorkerService);
  const recap = app.get(RecapService);

  const once = process.argv.includes('--once');
  const intervalMs = Number(process.env.AI_WORKER_INTERVAL_MS ?? 5_000);

  // THIS SECTION DOES: process one batch, then either exit or keep looping.
  do {
    // Lock this Monday's Friend Pod week (AI fill-ins allowed here).
    await recap.ensureCurrentWeek({ allowAi: true });
    const n = await worker.processBatch(20);
    if (n > 0) {
      // eslint-disable-next-line no-console
      console.log(`[ai-worker] processed ${n} job(s)`);
    }
    if (once) break;
    await sleep(intervalMs);
  } while (true);

  await app.close();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
