# ================================
# RDS PostgreSQL Configuration
# ================================

# Generate random password for database
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name        = "${var.project_name}-db-subnet-${var.environment}"
  description = "Database subnet group for ${var.project_name}"
  subnet_ids  = aws_subnet.database[*].id

  tags = {
    Name = "${var.project_name}-db-subnet-group-${var.environment}"
  }
}

# RDS Security Group
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-${var.environment}"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg-${var.environment}"
  }
}

# RDS Parameter Group
resource "aws_db_parameter_group" "main" {
  name        = "${var.project_name}-pg-${var.environment}"
  family      = "postgres15"
  description = "Custom parameter group for ${var.project_name}"

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries taking more than 1 second
  }

  parameter {
    name         = "rds.force_ssl"
    value        = "1"
    apply_method = "pending-reboot"
  }

  tags = {
    Name = "${var.project_name}-pg-${var.environment}"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db-${var.environment}"

  # Engine
  engine               = "postgres"
  engine_version       = var.db_engine_version
  instance_class       = var.db_instance_class
  parameter_group_name = aws_db_parameter_group.main.name

  # Storage
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result
  port     = 5432

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = var.db_multi_az

  # Backup
  backup_retention_period   = var.db_backup_retention_period
  backup_window             = "03:00-04:00"
  maintenance_window        = "Mon:04:00-Mon:05:00"
  copy_tags_to_snapshot     = true
  delete_automated_backups  = true
  final_snapshot_identifier = "${var.project_name}-final-snapshot-${random_id.suffix.hex}"
  skip_final_snapshot       = false

  # Monitoring
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  enabled_cloudwatch_logs_exports       = ["postgresql", "upgrade"]
  monitoring_interval                   = 60
  monitoring_role_arn                   = aws_iam_role.rds_monitoring.arn

  # Security
  deletion_protection      = var.db_deletion_protection
  auto_minor_version_upgrade = true

  tags = {
    Name = "${var.project_name}-db-${var.environment}"
  }
}

# Enhanced Monitoring Role
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-rds-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-rds-monitoring-role-${var.environment}"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Store database password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.project_name}-db-password-${var.environment}-${random_id.suffix.hex}"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-db-password-${var.environment}"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    database = var.db_name
  })
}
