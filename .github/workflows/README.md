# ⚙️ Configuração CI/CD com GitHub Actions

## 🌟 Descrição
Esta pasta contém a configuração do CI/CD utilizando GitHub Actions para o projeto DigAi.

## 📜 Workflow Principal
O workflow é acionado quando há um push na branch `main`.

### 🔧 Build and Test
1. **Checkout do código**: Baixa o código do repositório.
2. **Instalar dependências**: Instala as dependências da aplicação.
3. **Rodar testes**: Executa os testes da aplicação.

### 🏗️ Build and Push
1. **Configurar credenciais da AWS**: Configura as credenciais para acessar a AWS.
2. **Login no Amazon ECR**: Faz o login no ECR.
3. **Obter URL e Nome do Repositório ECR**: Obtém a URL e o nome do repositório no ECR.
4. **Construir e enviar a imagem Docker para ECR**: Constrói e envia a imagem Docker para o ECR.

### 🚀 Deploy
1. **Configurar credenciais da AWS**: Configura as credenciais para acessar a AWS.
2. **Criar grupo de logs do CloudWatch**: Cria o grupo de logs do CloudWatch (se não existir).
3. **Obter Informações do Cluster ECS e Serviço**: Obtém informações do cluster ECS e do serviço.
4. **Criar/Atualizar Definição de Tarefa e Forçar Novo Deploy**: Cria ou atualiza a definição de tarefa e força um novo deploy.
5. **Verificar Health Check e ativar rollback**: Verifica o health check e ativa o rollback em caso de falha.

## 📂 Estrutura dos Workflows
- `jobs`: Definição dos jobs do CI/CD.
- `steps`: Passos executados em cada job.

## 🔐 Configuração de Segredos no GitHub
Certifique-se de cadastrar os seguintes segredos no seu repositório GitHub:
- `AWS_ACCESS_KEY_ID`: Chave de acesso da AWS.
- `AWS_SECRET_ACCESS_KEY`: Chave secreta de acesso da AWS.
- `AWS_REGION`: Região da AWS.
- `ECR_IMAGE`: Nome da imagem no ECR.
- `EXECUTION_ROLE_ARN`: ARN do papel de execução.
- `PULUMI_ACCESS_TOKEN`: Token de acesso do Pulumi.

