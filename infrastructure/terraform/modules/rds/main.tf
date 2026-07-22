# =============================================================================
# RDS Module — BetAction (PostgreSQL 16)
# =============================================================================

# DB Subnet Group (uses private subnets)
resource "aws_db_subnet_group" "main" {
  name        = "${var.project}-db-subnet-group-${var.environment}"
  subnet_ids  = var.private_subnet_ids
  description = "BetAction RDS subnet group — private subnets only"

  tags = merge(var.tags, {
    Name = "${var.project}-db-subnet-group-${var.environment}"
  })
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project}-postgres-${var.environment}"

  # Engine
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.instance_class

  # Database
  db_name  = "betaction"
  username = "betaction_user"
  password = var.db_password

  # Storage
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.rds_sg_id]
  publicly_accessible    = false
  multi_az               = false

  # Backups
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Snapshots
  skip_final_snapshot       = false
  final_snapshot_identifier = "betaction-final-snapshot"
  copy_tags_to_snapshot     = true

  # Protection
  deletion_protection = true

  # Parameter group
  parameter_group_name = "default.postgres16"

  # Performance Insights (free tier)
  performance_insights_enabled = true

  tags = merge(var.tags, {
    Name = "${var.project}-postgres-${var.environment}"
  })
}
