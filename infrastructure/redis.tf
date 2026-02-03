# ================================
# ElastiCache Redis Configuration
# ================================

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name        = "${var.project_name}-redis-subnet-${var.environment}"
  description = "Subnet group for ElastiCache Redis"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-redis-subnet-group-${var.environment}"
  }
}

# ElastiCache Security Group
resource "aws_security_group" "redis" {
  name        = "${var.project_name}-redis-${var.environment}"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Redis from ECS"
    from_port       = 6379
    to_port         = 6379
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
    Name = "${var.project_name}-redis-sg-${var.environment}"
  }
}

# ElastiCache Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  name        = "${var.project_name}-redis-params-${var.environment}"
  family      = "redis7"
  description = "Custom parameter group for ${var.project_name} Redis"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  tags = {
    Name = "${var.project_name}-redis-params-${var.environment}"
  }
}

# ElastiCache Cluster
resource "aws_elasticache_cluster" "main" {
  cluster_id           = "${var.project_name}-redis-${var.environment}"
  engine               = "redis"
  engine_version       = var.redis_engine_version
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.main.name
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  port                 = 6379

  # Maintenance
  maintenance_window       = "sun:05:00-sun:06:00"
  snapshot_retention_limit = 7
  snapshot_window          = "00:00-01:00"

  # Notifications
  notification_topic_arn = aws_sns_topic.alerts.arn

  apply_immediately = true

  tags = {
    Name = "${var.project_name}-redis-${var.environment}"
  }
}

# SNS Topic for ElastiCache alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${var.environment}"

  tags = {
    Name = "${var.project_name}-alerts-${var.environment}"
  }
}

# CloudWatch Alarm for Redis CPU
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${var.project_name}-redis-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Redis CPU utilization is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.main.cluster_id
  }

  tags = {
    Name = "${var.project_name}-redis-cpu-alarm-${var.environment}"
  }
}

# CloudWatch Alarm for Redis Memory
resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  alarm_name          = "${var.project_name}-redis-memory-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Redis memory usage is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.main.cluster_id
  }

  tags = {
    Name = "${var.project_name}-redis-memory-alarm-${var.environment}"
  }
}
