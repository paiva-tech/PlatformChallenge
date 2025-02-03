# 🚀 Aplicação

## 🌟 Descrição
Esta pasta contém a aplicação desenvolvida em TypeScript e NestJS, que expõe uma API REST respondendo "Hello World" na porta 8080. Além disso, a aplicação inclui componentes de observabilidade e uma página HTML estática que simula o site oficial da empresa.

## 🛠️ Tecnologias Utilizadas
- TypeScript
- NestJS
- Docker
- Prometheus para métricas
- CloudWatch para logs

## 🚀 Como Executar
1. Instale as dependências: `npm install`
2. Execute a aplicação: `npm start`
3. Acesse a aplicação em `http://localhost:8080`

## 📦 Contenerização
1. Crie a imagem Docker: `docker build -t minha-aplicacao .`
2. Execute o contêiner: `docker run -p 8080:8080 minha-aplicacao`

## 🛠️ Pipeline de CI para ECR
1. Construir e testar a imagem Docker.
2. Publicar a imagem no Amazon ECR.

## 📂 Estrutura do Código
- `src/`: Código-fonte da aplicação.
  - `app.controller.ts`: Define a rota principal que serve o arquivo HTML estático.
  - `main.ts`: Arquivo principal que inicializa a aplicação e configura a observabilidade.
- `public/`: Arquivos públicos.
  - `index.html`: Página HTML estática que simula o site oficial da empresa.
- `observability/`: Componentes de observabilidade.
  - `PrometheusService`: Configura métricas para a aplicação.
  - `CloudWatchLogger`: Envia logs para o Amazon CloudWatch.
  - `ObservabilityModule`: Módulo de observabilidade que registra e exporta os serviços.

### 📊 Componentes de Observabilidade
#### PrometheusService
O arquivo `PrometheusService` em `observability/` configura métricas para a aplicação, como:
- Número total de requisições HTTP (`http_requests_total`)
- Uso de memória (`memory_usage_bytes`)
- Uso da CPU (`cpu_usage_percentage`)
- Duração das requisições HTTP (`http_request_duration_seconds`)
- Número de conexões ativas (`active_connections`)

Essas métricas são coletadas e expostas no endpoint `/metrics`.

#### CloudWatch Logger
O arquivo `CloudWatchLogger` em `observability/` envia logs para o Amazon CloudWatch. Ele garante que o grupo de logs e o stream existam e, em seguida, envia eventos de log para o CloudWatch.

#### ObservabilityModule
O arquivo `ObservabilityModule` configura o módulo de observabilidade, registrando o `PrometheusService` como provedor e exportando-o para uso em outros módulos.

## 🧪 Testes
- Como executar os testes.
