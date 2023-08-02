import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const initSwagger = (app: INestApplication) => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  const config = new DocumentBuilder()
    .setTitle('Dashboard API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {});
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { defaultModelExpandDepth: 3 },
  });
};
