variable "project" {
  description = "Project name used in resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (prod, staging, dev)"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs — instance is placed in index 0"
  type        = list(string)
}

variable "ec2_sg_id" {
  description = "ID of the EC2 security group"
  type        = string
}

variable "key_pair_name" {
  description = "Optional legacy key pair; administrative access uses Session Manager"
  type        = string
  default     = null
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
