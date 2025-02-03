# 🛠️ Infraestrutura como Código (IaC) com Pulumi

## 🌟 Descrição
Esta pasta contém a configuração da infraestrutura necessária para hospedar a aplicação utilizando Pulumi e AWS.

## 🛠️ Tecnologias Utilizadas
- Pulumi
- AWS (ECS, ECR, VPC, ALB, IAM, CloudWatch, etc.)

## 🚀 Como Configurar
1. Instale as dependências: `npm install`
2. Configure o Pulumi: `pulumi login`
3. Inicialize a infraestrutura: `pulumi up`

## 📂 Estrutura do Código
- `index.ts`: Arquivo principal da configuração de infraestrutura.

### Detalhes da Configuração

#### 🌐 Variáveis de Ambiente
- `AWS_REGION`: Região da AWS (ex: us-east-1).

#### 🔐 Secrets Necessárias
- `ECR_IMAGE`: Nome da imagem no ECR (configurar no Pulumi Config).

#### 📁 VPC e Subnets
- VPC: `10.0.0.0/16`
- Subnets:
  - `public-subnet1`: `10.0.1.0/24`
  - `public-subnet2`: `10.0.2.0/24`

#### 🔐 Security Group
- Porta 8080: Acesso à aplicação.
- Porta 9100: Acesso ao Prometheus.
- Porta 443: Acesso HTTPS.

#### 📊 Load Balancer (ALB)
- Configurado para rotear tráfego para os Target Groups da aplicação e Prometheus.

#### 🏗️ ECS Cluster e Role
- Cluster: `ecs-cluster-digai`
- Task Execution Role: `ecs-task-execution-role-digai`
  - Permissões para acessar ECR, CloudWatch Logs e recuperar credenciais da AWS.

#### 🗄️ Repositório ECR
- Nome: `ecr-digai`

#### 📝 Log Group do CloudWatch
- Nome: `/ecs/digai`
- Retenção: 7 dias

#### 📦 Task Definition
- Task Definition: `digai-task`
- Compatibilidade: `FARGATE`
- CPU: 256
- Memória: 512
- Network Mode: `awsvpc`
- Role de Execução: `ecs-task-execution-role-digai`
- Container: `digai-container`
  - Portas: 8080 (Aplicação) e 9100 (Prometheus)
  - Configuração de logs com AWS CloudWatch

#### 🚀 Service ECS
- Serviço: `service-digai`
- Contagem de Tarefas: 1
- Tipo de Lançamento: `FARGATE`
- Configuração de Rede:
  - Subnets: `public-subnet1`, `public-subnet2`
  - Security Groups: `security-group-digai`
  - Atribuição de IP Público: `true`
- Load Balancers:
  - Target Group: `tg-digai` (Porta 8080)
  - Target Group: `prometheus-tg-digai` (Porta 9100)

## 🛠️ Pipeline para Infraestrutura como Código (IaC)
1. Execute os scripts de provisionamento de infraestrutura automaticamente.
2. Garanta que o pipeline seja idempotente e seguro.

### 📌 Observações
- Configure os secrets necessários no GitHub Actions para que o pipeline funcione corretamente.
- Certifique-se de que as políticas de IAM estejam devidamente configuradas para permitir as ações necessárias.
