import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { MainAppModule } from './main-app.module';
import * as fileUpload from 'express-fileupload';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'; // ✅ เปลี่ยนเป็น AllExceptionsFilter

async function bootstrap(): Promise<void> {
  try {
    const httpsOptions = {
      key: fs.readFileSync('./cert/localhost+2-key.pem'),
      cert: fs.readFileSync('./cert/localhost+2.pem'),
    };

    const app = await NestFactory.create<NestExpressApplication>(
      MainAppModule,
      {
        httpsOptions,
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      },
    );

    app.useGlobalFilters(new AllExceptionsFilter());
    app.setGlobalPrefix('api');

    app.enableCors({
      origin: [
        'http://localhost:3000',
        'https://localhost:3000',
        'https://203.150.63.138:33002',
      ],
      credentials: true,
    });
    app.useStaticAssets(join(__dirname, '..', 'public'));
    app.useStaticAssets('D:\\files\\smartBill', {
      prefix: '/smartbill/', // URL prefix
    });

    app.setBaseViewsDir(join(__dirname, '..', 'views'));
    app.setViewEngine('hbs');

    app.use(
      fileUpload({
        useTempFiles: true,
        tempFileDir: '/tmp/',
        limits: { fileSize: 50 * 1024 * 1024 },
      }),
    );

    app.use(cookieParser());

    const port = process.env.PORT ?? 7777;
    await app.listen(port);

    console.log(`🚀 HTTPS Server is running on: https://localhost:${port}`);
    console.log(`📁 SmartBill files: https://localhost:${port}/smartbill/`);
    console.log(`📋 API documentation: https://localhost:${port}/api`);
  } catch (error) {
    console.error('❌ Error starting HTTPS server:', error);

    // Fallback to HTTP
    console.log('🔄 Falling back to HTTP server...');
    const app = await NestFactory.create<NestExpressApplication>(
      MainAppModule,
      {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      },
    );

    app.useGlobalFilters(new AllExceptionsFilter());
    app.setGlobalPrefix('api');
    app.enableCors({
      origin: 'http://localhost:3000',
      credentials: true,
    });

    app.useStaticAssets(join(__dirname, '..', 'public'));
    // ✅ เพิ่ม: Serve uploaded files
    app.useStaticAssets('D:\\files\\smartBill', {
      prefix: '/smartbill/',
    });

    app.setBaseViewsDir(join(__dirname, '..', 'views'));
    app.setViewEngine('hbs');

    app.use(
      fileUpload({
        useTempFiles: true,
        tempFileDir: 'C:/temp/',
        limits: { fileSize: 50 * 1024 * 1024 },
      }),
    );

    app.use(cookieParser());

    const port = process.env.PORT ?? 3000;
    await app.listen(port);

    console.log(`🚀 HTTP Server is running on: http://localhost:${port}`);
    console.log(`📁 SmartBill files: http://localhost:${port}/smartbill/`);
    console.log(`📋 API documentation: http://localhost:${port}/api`);
  }
}
void bootstrap();
