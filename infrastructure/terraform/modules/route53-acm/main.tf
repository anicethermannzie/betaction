# =============================================================================
# Route53 + ACM Module — BetAction
#
# NOTE: var.domain_name defaults to "betaction.com" but can be any domain.
#
# PREREQUISITE: You must have a registered domain and the Route53 hosted zone
# must already exist before applying this module. Create it manually:
#   aws route53 create-hosted-zone \
#     --name betaction.com \
#     --caller-reference $(date +%s)
# Then update your domain registrar's nameservers with the NS records from AWS.
# =============================================================================

# Look up the existing hosted zone
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# ── ACM Certificate (us-east-1 — required for CloudFront) ────────────────────
resource "aws_acm_certificate" "main" {
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  tags = merge(var.tags, {
    Name = "${var.project}-cert-${var.environment}"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# DNS validation records
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60

  allow_overwrite = true
}

# Wait for certificate validation to complete
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# ── Route53 A record: root domain → EC2 Elastic IP ───────────────────────────
resource "aws_route53_record" "root" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [var.ec2_elastic_ip]
}

# ── Route53 A record: www → CloudFront (alias) ───────────────────────────────
resource "aws_route53_record" "www" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.cloudfront_domain
    zone_id                = "Z2FDTNDATAQYW2" # CloudFront hosted zone ID (constant)
    evaluate_target_health = false
  }
}

# ── Route53 A record: api → EC2 Elastic IP ───────────────────────────────────
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"
  ttl     = 300
  records = [var.ec2_elastic_ip]
}
