# ================================
# Input Variables
# ================================

# General
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "seo-factory"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2
}

# ECS Configuration
variable "app_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "app_memory" {
  description = "Memory for ECS task in MiB"
  type        = number
  default     = 1024
}

variable "app_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "app_min_count" {
  description = "Minimum number of ECS tasks for autoscaling"
  type        = number
  default     = 1
}

variable "app_max_count" {
  description = "Maximum number of ECS tasks for autoscaling"
  type        = number
  default     = 10
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 3000
}

# RDS Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Max allocated storage for RDS autoscaling in GB"
  type        = number
  default     = 100
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "seo_factory"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "seo_factory_admin"
  sensitive   = true
}

variable "db_backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = false
}

variable "db_deletion_protection" {
  description = "Enable deletion protection for RDS"
  type        = bool
  default     = true
}

# ElastiCache Configuration
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

# ALB Configuration
variable "health_check_path" {
  description = "Health check path for ALB"
  type        = string
  default     = "/api/health"
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for HTTPS (required for production)"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

# Cognito Configuration
variable "cognito_callback_urls" {
  description = "Allowed callback URLs for Cognito"
  type        = list(string)
  default     = ["http://localhost:3000/api/auth/callback/cognito"]
}

variable "cognito_logout_urls" {
  description = "Allowed logout URLs for Cognito"
  type        = list(string)
  default     = ["http://localhost:3000"]
}

# S3 Configuration
variable "s3_force_destroy" {
  description = "Force destroy S3 buckets (set to false in production)"
  type        = bool
  default     = false
}

# Application Secrets (passed via environment or Secrets Manager)
variable "nextauth_secret" {
  description = "NextAuth secret key"
  type        = string
  sensitive   = true
}

variable "claude_api_key" {
  description = "Claude API key for AI features"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
  sensitive   = true
}

variable "ses_from_email" {
  description = "Verified email address for SES"
  type        = string
  default     = "noreply@example.com"
}
