import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initSwagger } from './initializers/swagger';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { setCacheControlHeader } from './middleware/setCacheControlHeader';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useLogger(app.get(Logger));
  app.enableCors();
  app.use(setCacheControlHeader);
  initSwagger(app);
  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
