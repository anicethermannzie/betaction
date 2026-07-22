output "certificate_arn" {
  description = "ARN of the validated ACM certificate"
  value       = aws_acm_certificate_validation.main.certificate_arn
}

output "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  value       = data.aws_route53_zone.main.zone_id
}

output "domain_name" {
  description = "The primary domain name"
  value       = var.domain_name
}

output "nameservers" {
  description = "NS records for the hosted zone (set these at your registrar)"
  value       = data.aws_route53_zone.main.name_servers
}
