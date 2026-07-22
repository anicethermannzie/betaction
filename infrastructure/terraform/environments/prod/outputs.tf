output "ec2_public_ip" {
  description = "EC2 instance public IP (changes on stop/start — use elastic_ip instead)"
  value       = module.ec2.public_ip
}

output "ec2_elastic_ip" {
  description = "Elastic IP — static IP for DNS and SSH access"
  value       = module.ec2.elastic_ip
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint — use this as DB_HOST in services"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "rds_host" {
  description = "RDS hostname (without port)"
  value       = module.rds.db_host
  sensitive   = true
}

output "ecr_repository_urls" {
  description = "ECR repository URLs keyed by service name"
  value       = module.ecr.repository_urls
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain — use for www DNS alias"
  value       = module.s3_cloudfront.cloudfront_domain
}

output "cloudfront_id" {
  description = "CloudFront distribution ID — needed for cache invalidation"
  value       = module.s3_cloudfront.cloudfront_id
}

output "s3_frontend_bucket" {
  description = "S3 bucket name for frontend static files"
  value       = module.s3_cloudfront.s3_bucket_name
}

# TODO: uncomment after domain purchase
# output "certificate_arn" {
#   description = "ACM certificate ARN"
#   value       = module.route53_acm.certificate_arn
# }

output "ssh_command" {
  description = "SSH command to connect to EC2"
  value       = "ssh -i betaction-prod.pem ec2-user@${module.ec2.elastic_ip}"
}
