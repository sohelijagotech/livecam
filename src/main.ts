import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Stripe requires the raw, unparsed body to verify webhook signatures — must be
  // registered BEFORE the global JSON body parser below.
  app.use('/payments/stripe/webhook', express.raw({ type: 'application/json' }));

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`LiveConnect backend running on http://localhost:${port}`);
}
bootstrap();
