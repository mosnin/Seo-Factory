variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "seo-factory"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "database_url" {
  description = "PostgreSQL connection string for the post-confirmation Lambda"
  type        = string
  sensitive   = true
}

variable "database_ssl" {
  description = "Whether to use SSL for database connections"
  type        = bool
  default     = true
}

variable "lambda_zip_path" {
  description = "Path to the zipped Lambda deployment package"
  type        = string
  default     = "../../lambda/post-confirmation/dist/function.zip"
}

variable "lambda_vpc_config" {
  description = "VPC configuration for the Lambda (set to null if DB is publicly accessible)"
  type = object({
    subnet_ids         = list(string)
    security_group_ids = list(string)
  })
  default = null
}
