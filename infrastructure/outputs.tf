# ================================
# Terraform Outputs
# ================================

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "application_url" {
  description = "URL to access the application"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_lb.main.dns_name}"
}

# RDS Outputs
output "rds_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_database_name" {
  description = "Name of the database"
  value       = aws_db_instance.main.db_name
}

# Redis Outputs
output "redis_endpoint" {
  description = "Endpoint of the Redis cluster"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
  sensitive   = true
}

output "redis_port" {
  description = "Port of the Redis cluster"
  value       = aws_elasticache_cluster.main.cache_nodes[0].port
}

# Cognito Outputs
output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.app.id
}

output "cognito_user_pool_client_secret" {
  description = "Secret of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.app.client_secret
  sensitive   = true
}

output "cognito_domain" {
  description = "Domain of the Cognito User Pool"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "cognito_issuer" {
  description = "Issuer URL for Cognito"
  value       = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

# S3 Outputs
output "uploads_bucket_name" {
  description = "Name of the uploads S3 bucket"
  value       = aws_s3_bucket.uploads.id
}

output "uploads_bucket_arn" {
  description = "ARN of the uploads S3 bucket"
  value       = aws_s3_bucket.uploads.arn
}

output "exports_bucket_name" {
  description = "Name of the exports S3 bucket"
  value       = aws_s3_bucket.exports.id
}

output "cdn_domain_name" {
  description = "CloudFront CDN domain name"
  value       = aws_cloudfront_distribution.uploads.domain_name
}

# Secrets Manager
output "app_secrets_arn" {
  description = "ARN of the application secrets in Secrets Manager"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "db_password_secret_arn" {
  description = "ARN of the database password secret"
  value       = aws_secretsmanager_secret.db_password.arn
}

# CloudWatch
output "ecs_log_group" {
  description = "Name of the ECS CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.name
}

# SNS
output "alerts_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

# Summary for .env file
output "env_file_summary" {
  description = "Summary of values needed for .env file"
  value = <<-EOT
    # Add these to your .env.production file:

    DATABASE_URL="postgresql://${var.db_username}:<password>@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${var.db_name}?schema=public"
    REDIS_URL="redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:${aws_elasticache_cluster.main.cache_nodes[0].port}"

    NEXTAUTH_URL="https://${var.domain_name != "" ? var.domain_name : aws_lb.main.dns_name}"

    COGNITO_CLIENT_ID="${aws_cognito_user_pool_client.app.id}"
    COGNITO_ISSUER="https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"

    S3_UPLOADS_BUCKET="${aws_s3_bucket.uploads.id}"
    S3_EXPORTS_BUCKET="${aws_s3_bucket.exports.id}"
    CDN_URL="https://${aws_cloudfront_distribution.uploads.domain_name}"

    AWS_REGION="${var.aws_region}"
  EOT
  sensitive = true
}
