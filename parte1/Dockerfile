# Etapa 1: Build da aplicação
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json e package-lock.json para instalar dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar todo o código da aplicação (incluindo public/)
COPY . .

# Compilar a aplicação NestJS
RUN npm run build

# Verificar se o arquivo main.js está na pasta src após o build
RUN ls -alh dist/src

# Etapa 2: Criar imagem final para produção
FROM node:20-alpine AS runner

WORKDIR /app

# Instalar wget e tar para baixar o Prometheus
RUN apk add --no-cache wget tar

# Copiar apenas os arquivos necessários da etapa anterior
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Instalar Prometheus
RUN wget https://github.com/prometheus/prometheus/releases/download/v2.26.0/prometheus-2.26.0.linux-amd64.tar.gz \
    && tar xvfz prometheus-2.26.0.linux-amd64.tar.gz \
    && mv prometheus-2.26.0.linux-amd64 /prometheus

# Copiar arquivo de configuração do Prometheus
COPY observability/prometheus/prometheus.yml /prometheus/prometheus.yml

# Expor as portas usadas pela aplicação e pelo Prometheus
EXPOSE 8080 9100

# Definir variável de ambiente para o modo de produção
ENV NODE_ENV=production

# Verificar se o arquivo main.js está na pasta src após copiar
RUN ls -alh dist/src

# Comando para iniciar a aplicação e o Prometheus
CMD ["sh", "-c", "node dist/src/main.js & /prometheus/prometheus --config.file=/prometheus/prometheus.yml --web.listen-address=:9100 & wait"]
