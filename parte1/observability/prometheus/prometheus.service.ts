import { Injectable, OnModuleInit } from '@nestjs/common';
import express, { Request, Response, NextFunction } from 'express';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics, register } from 'prom-client';
import os from 'os';
import { logToCloudWatch } from '../cloudwatch-logger'; // CloudWatch

@Injectable()
export class PrometheusService implements OnModuleInit {
  private app = express();

  private httpRequestCounter: Counter<string> | undefined;
  private memoryUsageGauge: Gauge<string> | undefined;
  private cpuUsageGauge: Gauge<string> | undefined;
  private requestDurationHistogram: Histogram<string> | undefined;
  private activeConnectionsGauge: Gauge<string> | undefined;

  onModuleInit() {
    this.setupPrometheusMetrics();
  }

  private setupPrometheusMetrics() {
    // Limpar todas as métricas registradas anteriormente
    register.clear();

    // Inicializar as métricas
    this.httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Número total de requisições HTTP',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.memoryUsageGauge = new Gauge({
      name: 'memory_usage_bytes',
      help: 'Uso de memória do processo em bytes',
    });

    this.cpuUsageGauge = new Gauge({
      name: 'cpu_usage_percentage',
      help: 'Uso da CPU em porcentagem',
    });

    this.requestDurationHistogram = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duração das requisições HTTP em segundos',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.activeConnectionsGauge = new Gauge({
      name: 'active_connections',
      help: 'Número de conexões ativas no servidor',
    });

    // Registrar as métricas
    register.registerMetric(this.httpRequestCounter);
    register.registerMetric(this.memoryUsageGauge);
    register.registerMetric(this.cpuUsageGauge);
    register.registerMetric(this.requestDurationHistogram);
    register.registerMetric(this.activeConnectionsGauge);

    // Coletar métricas padrão
    collectDefaultMetrics({ register });

    // Atualiza a métrica de CPU periodicamente
    setInterval(() => {
      const cpuUsage = os.loadavg()[0] / os.cpus().length;
      this.cpuUsageGauge?.set(cpuUsage * 100);
    }, 5000);

    // Middleware para coletar métricas de requisições
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const end = this.requestDurationHistogram!.startTimer({
        method: req.method,
        route: req.path,
        status_code: res.statusCode.toString(),
      });
      this.activeConnectionsGauge!.inc();
      res.on('finish', () => {
        this.httpRequestCounter!.inc({
          method: req.method,
          route: req.path,
          status_code: res.statusCode.toString(),
        });
        this.memoryUsageGauge!.set(process.memoryUsage().heapUsed);
        this.activeConnectionsGauge!.dec();
        end();

        if (res.statusCode >= 400) {
          logToCloudWatch(`Erro ${res.statusCode} - Rota: ${req.path} - Método: ${req.method}`);
        }
      });
      next();
    });

    // Endpoint `/metrics` para Prometheus
    this.app.get('/metrics', async (req: Request, res: Response) => {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    });

    // Inicia o servidor de métricas
    const PORT = process.env.METRICS_PORT || 9100;
    this.app.listen(PORT, () => {
      console.log(`Servidor de métricas Prometheus rodando na porta ${PORT}`);
    });
  }
}
