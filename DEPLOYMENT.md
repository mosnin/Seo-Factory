# SEO Factory - AWS Deployment Guide

This guide covers deploying SEO Factory to AWS using ECS Fargate, RDS PostgreSQL, and ElastiCache Redis.

## Architecture Overview

```
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                         AWS Cloud                           │
                                    │                                                             │
    ┌──────────┐                    │  ┌─────────────┐      ┌─────────────────────────────────┐  │
    │  Users   │───────────────────────▶│     ALB     │─────▶│         ECS Fargate            │  │
    └──────────┘                    │  │  (HTTPS)    │      │  ┌─────────┐  ┌─────────┐       │  │
                                    │  └─────────────┘      │  │ Task 1  │  │ Task 2  │  ...  │  │
                                    │        │              │  └────┬────┘  └────┬────┘       │  │
                                    │        │              └───────┼────────────┼────────────┘  │
                                    │        │                      │            │               │
                                    │  ┌─────▼─────┐         ┌──────▼────────────▼──────┐       │
                                    │  │    WAF    │         │                          │       │
                                    │  └───────────┘         │   ┌──────────────────┐   │       │
                                    │                        │   │   RDS Postgres   │   │       │
                                    │                        │   └──────────────────┘   │       │
                                    │  ┌───────────┐         │                          │       │
                                    │  │    S3     │         │   ┌──────────────────┐   │       │
                                    │  │ (uploads) │         │   │ ElastiCache Redis│   │       │
                                    │  └───────────┘         │   └──────────────────┘   │       │
                                    │        │               │                          │       │
                                    │  ┌─────▼─────┐         └──────────────────────────┘       │
                                    │  │CloudFront │              Private Subnets               │
                                    │  │   (CDN)   │                                             │
                                    │  └───────────┘                                             │
                                    └─────────────────────────────────────────────────────────────┘
```

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI** (v2.x) - [Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. **Terraform** (v1.5+) - [Install Guide](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli)
3. **Docker** (v24+) - [Install Guide](https://docs.docker.com/get-docker/)
4. **Node.js** (v20+) - For local development
5. **AWS Account** with appropriate permissions

### Required AWS Permissions

Your AWS IAM user/role needs permissions for:
- VPC, Subnets, Security Groups, NAT Gateway
- ECS, ECR
- RDS, ElastiCache
- ALB, WAF
- S3, CloudFront
- Cognito
- Secrets Manager
- CloudWatch
- IAM (for creating roles)
- ACM (for SSL certificates)
- SES (for email)

## Local Development with Docker

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/seo-factory.git
cd seo-factory

# Copy environment file
cp .env.example .env.local

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma migrate deploy

# View logs
docker-compose logs -f app
```

### Accessing Services

- **Application**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Stopping Services

```bash
docker-compose down

# To remove volumes (data):
docker-compose down -v
```

## AWS Deployment

### Step 1: Configure AWS CLI

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### Step 2: Set Up Terraform Variables

```bash
cd infrastructure

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

### Step 3: Set Sensitive Variables

Export sensitive variables (don't commit these):

```bash
export TF_VAR_nextauth_secret="$(openssl rand -base64 32)"
export TF_VAR_claude_api_key="your-claude-api-key"
export TF_VAR_stripe_secret_key="sk_live_..."
export TF_VAR_stripe_webhook_secret="whsec_..."
```

### Step 4: Initialize and Apply Terraform

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply infrastructure
terraform apply
```

This creates:
- VPC with public/private subnets
- ECS cluster with Fargate
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- Application Load Balancer with WAF
- S3 buckets for uploads/exports
- CloudFront CDN
- Cognito User Pool
- All necessary security groups and IAM roles

### Step 5: Build and Push Docker Image

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t seo-factory .

# Tag image
docker tag seo-factory:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/seo-factory-prod:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/seo-factory-prod:latest
```

### Step 6: Run Database Migrations

```bash
# Get ECS task ARN
TASK_ARN=$(aws ecs list-tasks --cluster seo-factory-cluster-prod --service-name seo-factory-service-prod --query 'taskArns[0]' --output text)

# Run migrations
aws ecs execute-command \
  --cluster seo-factory-cluster-prod \
  --task $TASK_ARN \
  --container seo-factory-app \
  --interactive \
  --command "npx prisma migrate deploy"
```

### Step 7: Configure DNS

Point your domain to the ALB:

```bash
# Get ALB DNS name
terraform output alb_dns_name
```

Create a CNAME or ALIAS record in your DNS provider pointing to the ALB DNS name.

### Step 8: Verify Deployment

```bash
# Check service status
aws ecs describe-services \
  --cluster seo-factory-cluster-prod \
  --services seo-factory-service-prod

# Check health endpoint
curl https://your-domain.com/api/health
```

## CI/CD with GitHub Actions

### Configure GitHub Secrets

Add these secrets in your GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `DOMAIN_NAME` | Your production domain |

### Automatic Deployments

Pushing to `main` branch triggers:
1. **Test**: Runs linter, type check, and tests
2. **Build**: Builds Docker image and pushes to ECR
3. **Deploy**: Updates ECS service with new image
4. **Migrate**: Runs database migrations

### Manual Deployment

You can also trigger deployments manually via GitHub Actions UI.

## Rollback Procedure

### Quick Rollback (ECS)

```bash
# Get current task definition
CURRENT=$(aws ecs describe-services \
  --cluster seo-factory-cluster-prod \
  --services seo-factory-service-prod \
  --query 'services[0].taskDefinition' \
  --output text)

# Extract revision number and decrement
FAMILY=$(echo $CURRENT | cut -d':' -f1 | rev | cut -d'/' -f1 | rev)
REVISION=$(echo $CURRENT | cut -d':' -f2)
PREV_REVISION=$((REVISION - 1))

# Rollback to previous version
aws ecs update-service \
  --cluster seo-factory-cluster-prod \
  --service seo-factory-service-prod \
  --task-definition $FAMILY:$PREV_REVISION \
  --force-new-deployment
```

### Database Rollback

**Warning**: Database rollbacks can cause data loss. Always backup first!

```bash
# Create backup before any migration
aws rds create-db-snapshot \
  --db-instance-identifier seo-factory-db-prod \
  --db-snapshot-identifier pre-migration-$(date +%Y%m%d%H%M%S)

# If needed, restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier seo-factory-db-prod-restored \
  --db-snapshot-identifier <snapshot-id>
```

## Monitoring

### CloudWatch Logs

```bash
# View application logs
aws logs tail /ecs/seo-factory-prod --follow

# Filter for errors
aws logs filter-log-events \
  --log-group-name /ecs/seo-factory-prod \
  --filter-pattern "ERROR"
```

### CloudWatch Metrics

Key metrics to monitor:
- **ECS**: CPU/Memory utilization, running task count
- **RDS**: CPU, connections, storage
- **ElastiCache**: CPU, memory, connections
- **ALB**: Request count, latency, 5xx errors

### Alerts

SNS topic `seo-factory-alerts-prod` receives:
- Redis high CPU/memory alerts
- ECS task failures
- RDS performance issues

Subscribe your email:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:<account-id>:seo-factory-alerts-prod \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Scaling

### Manual Scaling

```bash
# Scale ECS tasks
aws ecs update-service \
  --cluster seo-factory-cluster-prod \
  --service seo-factory-service-prod \
  --desired-count 5
```

### Auto Scaling

Auto scaling is configured by default:
- **CPU Target**: 70% utilization
- **Memory Target**: 80% utilization
- **Min Tasks**: 1
- **Max Tasks**: 10

Modify in `infrastructure/ecs.tf` to adjust.

## Costs Estimate

Estimated monthly costs (us-east-1, minimal setup):

| Resource | Configuration | Est. Cost |
|----------|---------------|-----------|
| ECS Fargate | 2 tasks × 0.5 vCPU × 1GB | ~$30 |
| RDS PostgreSQL | db.t3.micro | ~$15 |
| ElastiCache Redis | cache.t3.micro | ~$12 |
| ALB | 1 LCU average | ~$20 |
| NAT Gateway | 2 AZs | ~$65 |
| S3/CloudFront | 10GB storage, 100GB transfer | ~$5 |
| **Total** | | **~$150/month** |

Production recommendations:
- Use Reserved Instances for RDS (up to 60% savings)
- Use Savings Plans for Fargate (up to 50% savings)
- Consider single NAT Gateway for dev/staging

## Troubleshooting

### ECS Tasks Not Starting

```bash
# Check stopped tasks
aws ecs describe-tasks \
  --cluster seo-factory-cluster-prod \
  --tasks $(aws ecs list-tasks --cluster seo-factory-cluster-prod --desired-status STOPPED --query 'taskArns[0]' --output text)

# Common issues:
# - Image not found: Check ECR repository
# - Health check failing: Check /api/health endpoint
# - Memory issues: Increase task memory
```

### Database Connection Issues

```bash
# Test connectivity from ECS
aws ecs execute-command \
  --cluster seo-factory-cluster-prod \
  --task $TASK_ARN \
  --container seo-factory-app \
  --interactive \
  --command "nc -zv <rds-endpoint> 5432"
```

### Application Errors

```bash
# Get recent errors
aws logs filter-log-events \
  --log-group-name /ecs/seo-factory-prod \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --filter-pattern "ERROR"
```

## Security Best Practices

1. **Secrets Management**: All secrets stored in AWS Secrets Manager
2. **Network Isolation**: RDS/Redis in private subnets with no public access
3. **Encryption**: TLS for all connections, S3 encryption at rest
4. **WAF**: AWS WAF protects against common attacks
5. **IAM**: Least privilege access for all roles
6. **Audit Logging**: CloudTrail enabled for API auditing

## Support

For issues or questions:
- Open a GitHub issue
- Check CloudWatch logs
- Review AWS Health Dashboard
