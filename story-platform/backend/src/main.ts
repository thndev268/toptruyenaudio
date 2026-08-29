import 'dotenv/config'; // PHẢI là dòng đầu tiên — load .env trước mọi module khác
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import helmet from 'helmet';
import * as mongoSanitize from 'express-mongo-sanitize';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Disable default body parser to configure custom limits
    bodyParser: false,
  });

  // Strict global JSON and URL-encoded request limits
  // defense-in-depth: Reject payload too large (DoS protection)
  app.use(express.json({ limit: '50kb' })); // 50KB should be plenty for regular APIs
  app.use(express.urlencoded({ limit: '50kb', extended: true }));

  // MongoDB Input Sanitization Layer
  // Rejects keys starting with $ (operators like $ne, $gt, $where)
  // Preserves dots in ordinary values (emails, URLs) as dots in values are NOT sanitized
  app.use(
    mongoSanitize({
      replaceWith: '_',
      allowDots: true, // Allow dots in keys (e.g. nested objects), but $ is still rejected
    }),
  );

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000', 'https://toptruyenaudio-l298.vercel.app', 'https://toptruyenaudio-pi.vercel.app', 'https://toptruyenaudio.site', 'https://www.toptruyenaudio.site'];
  
  console.log('CORS Origins configured:', corsOrigins);
  console.log('CORS_ORIGINS env var:', process.env.CORS_ORIGINS);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  });

  const config = new DocumentBuilder()
    .setTitle('Top Truyện Audio - REST API Specification')
    .setDescription('Tài liệu OpenAPI / Swagger cho Nền tảng Đọc & Nghe Truyện Số TOP TRUYỆN AUDIO (Giai đoạn 1 - User, OWNER_ADMIN & Premium)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'Idempotency-Key', in: 'header' }, 'Idempotency-Key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.PORT || 3001;
  console.log(`Environment PORT: ${process.env.PORT}`);
  console.log(`Using port: ${port}`);
  await app.listen(port);
  console.log(`Backend REST API server listening on http://localhost:${port}/api/v1`);
  console.log(`OpenAPI / Swagger documentation available at http://localhost:${port}/api/v1/docs`);
}

bootstrap();
