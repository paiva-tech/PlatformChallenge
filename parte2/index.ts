import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// ============================================================
// Leitura das variáveis de ambiente
// ============================================================
const region = process.env.AWS_REGION ?? "us-east-1";
const clusterName = "ecs-cluster-digai";
const ecrRepositoryName = "ecr-digai";

console.log({ AWS_REGION: region });

// ============================================================
// Configuração para usar a secret "ECR_IMAGE" do Pulumi Config.
// OBS: Essa secret deve ser configurada previamente no seu workflow do GitHub Actions, 
// usando um comando como:
//    pulumi config set --secret DigAi:ECR_IMAGE ${{ secrets.ECR_IMAGE }}
// ============================================================
const config = new pulumi.Config();
const secretEcrImage = config.requireSecret("ECR_IMAGE");

// ============================================================
// Buscar ou criar VPC
// ============================================================
const vpc = new aws.ec2.Vpc("vpc-digai", {
  cidrBlock: "10.0.0.0/16",
  enableDnsSupport: true,
  enableDnsHostnames: true,
  tags: { Name: "vpc-digai" },
});

// ============================================================
// Criando o Internet Gateway
// ============================================================
const internetGateway = new aws.ec2.InternetGateway("internet-gateway-digai", {
  vpcId: vpc.id,
  tags: { Name: "internet-gateway-digai" },
});

// ============================================================
// Criando a Route Table e associando ao Internet Gateway
// ============================================================
const routeTable = new aws.ec2.RouteTable("route-table-digai", {
  vpcId: vpc.id,
  routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: internetGateway.id }],
  tags: { Name: "route-table-digai" },
});

// ============================================================
// Criando as Subnets
// ============================================================
const publicSubnet1 = new aws.ec2.Subnet("public-subnet1-digai", {
  vpcId: vpc.id,
  cidrBlock: "10.0.1.0/24",
  mapPublicIpOnLaunch: true,
  availabilityZone: pulumi.interpolate`${region}a`,
  tags: { Name: "public-subnet1-digai" },
});

const publicSubnet2 = new aws.ec2.Subnet("public-subnet2-digai", {
  vpcId: vpc.id,
  cidrBlock: "10.0.2.0/24",
  mapPublicIpOnLaunch: true,
  availabilityZone: pulumi.interpolate`${region}b`,
  tags: { Name: "public-subnet2-digai" },
});

// ============================================================
// Associando subnets à Route Table
// ============================================================
new aws.ec2.RouteTableAssociation("route-table-association-public-subnet1", {
  subnetId: publicSubnet1.id,
  routeTableId: routeTable.id,
});

new aws.ec2.RouteTableAssociation("route-table-association-public-subnet2", {
  subnetId: publicSubnet2.id,
  routeTableId: routeTable.id,
});

// ============================================================
// Criando Security Group
// ============================================================
const securityGroup = new aws.ec2.SecurityGroup("security-group-digai", {
  vpcId: vpc.id,
  description: "Security Group for digai ECS Cluster",
  ingress: [
    { protocol: "tcp", fromPort: 8080, toPort: 8080, cidrBlocks: ["0.0.0.0/0"] },
    { protocol: "tcp", fromPort: 9100, toPort: 9100, cidrBlocks: ["0.0.0.0/0"] },
    { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] }
  ],
  egress: [{ protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }],
  tags: { Name: "security-group-digai" }
});

// ============================================================
// Criando Load Balancer (ALB)
// ============================================================
const loadBalancer = new aws.lb.LoadBalancer("alb-digai", {
  securityGroups: [securityGroup.id],
  subnets: [publicSubnet1.id, publicSubnet2.id],
  loadBalancerType: "application",
  tags: { Name: "alb-digai" }
});

// ============================================================
// Criando Target Group para a aplicação
// ============================================================
const targetGroup = new aws.lb.TargetGroup("tg-digai", {
  port: 8080,
  protocol: "HTTP",
  targetType: "ip",
  vpcId: vpc.id,
  healthCheck: {
    path: "/",
    interval: 30,
    timeout: 5,
    healthyThreshold: 2,
    unhealthyThreshold: 2
  },
  tags: { Name: "tg-digai" }
});

// ============================================================
// Criando Target Group para Prometheus
// ============================================================
const prometheusTargetGroup = new aws.lb.TargetGroup("prometheus-tg-digai", {
  port: 9100,
  protocol: "HTTP",
  targetType: "ip",
  vpcId: vpc.id,
  healthCheck: {
    path: "/metrics",
    interval: 30,
    timeout: 5,
    healthyThreshold: 2,
    unhealthyThreshold: 2
  },
  tags: { Name: "prometheus-tg-digai" }
});

// ============================================================
// Criando Listeners
// ============================================================
const listener = new aws.lb.Listener("listener-digai", {
  loadBalancerArn: loadBalancer.arn,
  port: 80,
  protocol: "HTTP",
  defaultActions: [{ type: "forward", targetGroupArn: targetGroup.arn }],
});

const prometheusListener = new aws.lb.Listener("prometheus-listener-digai", {
  loadBalancerArn: loadBalancer.arn,
  port: 9100,
  protocol: "HTTP",
  defaultActions: [{ type: "forward", targetGroupArn: prometheusTargetGroup.arn }],
});

// ============================================================
// Criando repositório ECR (caso seja necessário)
// ============================================================
const ecrRepository = new aws.ecr.Repository("ecr-digai", {
  name: ecrRepositoryName,
});

// ============================================================
// Criando o cluster ECS
// ============================================================
const ecsCluster = new aws.ecs.Cluster("ecs-cluster-digai", {
  name: clusterName,
  settings: [{ name: "containerInsights", value: "enabled" }]
});

// ============================================================
// Criando a Role para execução da Task ECS
// ============================================================
const ecsTaskExecutionRole = new aws.iam.Role("ecs-task-execution-role-digai", {
  name: "ecs-task-execution-role-digai",
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Principal: { Service: "ecs-tasks.amazonaws.com" },
      Action: "sts:AssumeRole",
    }],
  }),
  tags: { Name: "ecs-task-execution-role-digai" }
});

// ============================================================
// Anexando a política necessária à role
// ============================================================
new aws.iam.RolePolicyAttachment("ecs-task-execution-role-policy-attachment-digai", {
  role: ecsTaskExecutionRole.name,
  policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
});

// ============================================================
// Criando uma policy inline para garantir acesso ao ECR e CloudWatch Logs
// ============================================================
const ecsTaskExecutionRolePolicy = new aws.iam.RolePolicy("ecs-task-execution-role-inline-policy", {
  role: ecsTaskExecutionRole.id,
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        // Permissões para acessar o ECR e puxar imagens
        Effect: "Allow",
        Action: [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetAuthorizationToken"
        ],
        Resource: "*"
      },
      {
        // Permissões para escrever logs no CloudWatch
        Effect: "Allow",
        Action: [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "logs:GetLogEvents"
        ],
        Resource: "*"
      },
      {
        // Permissões para a task ECS recuperar credenciais da AWS
        Effect: "Allow",
        Action: [
          "ssm:GetParameters",
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ],
        Resource: "*"
      }
    ]
  })
});

// ============================================================
// Criando o Log Group do CloudWatch
// ============================================================
const logGroup = new aws.cloudwatch.LogGroup("log-group-digai", {
  name: "/ecs/digai",
  retentionInDays: 7,
});

// ============================================================
// Criando a Task Definition
// ============================================================
// A imagem do container agora é obtida da secret "ECR_IMAGE"
const taskDefinition = new aws.ecs.TaskDefinition("task-def-digai", {
  family: "digai-task",
  requiresCompatibilities: ["FARGATE"],
  cpu: "256",
  memory: "512",
  networkMode: "awsvpc",
  executionRoleArn: ecsTaskExecutionRole.arn,
  containerDefinitions: pulumi.all([logGroup.name, region, secretEcrImage]).apply(
    ([logGroupName, region, image]) =>
      JSON.stringify([{
        name: "digai-container",
        image: image, // Usa o valor da secret "ECR_IMAGE"
        essential: true,
        portMappings: [
          { containerPort: 8080, hostPort: 8080, protocol: "tcp" },
          { containerPort: 9100, hostPort: 9100, protocol: "tcp" }
        ],
        logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": logGroupName,
            "awslogs-region": region,
            "awslogs-stream-prefix": "digai"
          }
        }
      }])
  )
});

// ============================================================
// Criando o Service ECS
// ============================================================
const service = new aws.ecs.Service("service-digai", {
  name: "service-digai",
  cluster: ecsCluster.arn,
  taskDefinition: taskDefinition.arn,
  desiredCount: 1,
  launchType: "FARGATE",
  networkConfiguration: {
    subnets: [publicSubnet1.id, publicSubnet2.id],
    securityGroups: [securityGroup.id],
    assignPublicIp: true
  },
  loadBalancers: [
    {
      targetGroupArn: targetGroup.arn,
      containerName: "digai-container",
      containerPort: 8080
    },
    {
      targetGroupArn: prometheusTargetGroup.arn,
      containerName: "digai-container",
      containerPort: 9100
    }
  ],
  tags: { Name: "service-digai" }
}, {
  dependsOn: [listener, prometheusListener]
});

// ============================================================
// Exportando valores
// ============================================================
export const vpcId = vpc.id;
export const internetGatewayId = internetGateway.id;
export const routeTableId = routeTable.id;
export const securityGroupId = securityGroup.id;
export const loadBalancerArn = loadBalancer.arn;
export const ecrRepositoryUrl = ecrRepository.repositoryUrl;
export const ecsClusterName = ecsCluster.name;
export const ecsTaskExecutionRoleArn = ecsTaskExecutionRole.arn;
export const logGroupName = logGroup.name;
export const taskDefinitionArn = taskDefinition.arn;
export const serviceNameExport = service.name;
