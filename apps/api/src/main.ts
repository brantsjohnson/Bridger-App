// ============================================
// WHAT THIS FILE DOES (plain English):
// The starting point of the Bridger backend. It boots the NestJS server and
// starts listening for requests. AWS App Runner runs this file and checks the
// "/health" route to know the server is alive. The port comes from the
// environment (App Runner sets it) and falls back to 3000 for local dev.
// ============================================
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true so Stripe webhook signature verification can read the bytes.
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // --- Allow the mobile/web app to call this API during development ---
  app.enableCors();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Bridger API listening on port ${port}`);
}

bootstrap();
