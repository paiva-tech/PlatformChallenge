import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

// Importação das funcionalidades de observabilidade
import { logToCloudWatch } from '../observability/cloudwatch-logger';
import { PrometheusService } from '../observability/prometheus/prometheus.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Inicializa o PrometheusService para métricas
  const prometheusService = new PrometheusService();
  prometheusService.onModuleInit(); // Chama a inicialização manualmente

  // Servindo arquivos estáticos
  app.useStaticAssets(path.join(__dirname, '..', 'public'));

  await app.listen(8080);  // A aplicação vai subir na porta 8080
}
bootstrap();
