variable "project" {
  description = "Project name used in resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (prod, staging, dev)"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name — the Route53 hosted zone must already exist"
  type        = string
  default     = "betaction.com"
}

variable "ec2_elastic_ip" {
  description = "Elastic IP of the EC2 instance for DNS A records"
  type        = string
}

variable "cloudfront_domain" {
  description = "CloudFront distribution domain for www alias"
  type        = string
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
