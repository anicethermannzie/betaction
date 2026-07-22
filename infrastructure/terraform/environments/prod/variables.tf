variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "betaction"
}

variable "company" {
  description = "Company name"
  type        = string
  default     = "zahtech"
}

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_password" {
  description = "RDS master password — pass via TF_VAR_db_password, never in tfvars"
  type        = string
  sensitive   = true
}

variable "key_pair_name" {
  description = "AWS key pair name for SSH — pass via TF_VAR_key_pair_name"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name — Route53 hosted zone must already exist"
  type        = string
  default     = "betaction.com"
}
