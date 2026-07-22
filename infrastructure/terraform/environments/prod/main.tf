# =============================================================================
# BetAction — Production Environment
# Company: ZahTech LLC | Region: us-east-1
# =============================================================================
# Build order:
#   1. VPC                 (networking foundation)
#   2. security_groups     (depends on VPC)
#   3. ec2                 (depends on VPC + SGs)
#   4. rds                 (depends on VPC + SGs)
#   5. ecr                 (independent)
#   6. s3_cloudfront       (independent)
#   7. route53_acm         (depends on ec2 EIP + cloudfront domain)
# =============================================================================

locals {
  common_tags = {
    Project     = var.project
    Company     = var.company
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

module "vpc" {
  source = "../../modules/vpc"

  project     = var.project
  environment = var.environment

  vpc_cidr             = "10.0.0.0/16"
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.3.0/24", "10.0.4.0/24"]
  availability_zones   = ["us-east-1a", "us-east-1b"]

  tags = local.common_tags
}

module "security_groups" {
  source = "../../modules/security-groups"

  project     = var.project
  environment = var.environment
  vpc_id      = module.vpc.vpc_id

  tags = local.common_tags
}

module "ec2" {
  source = "../../modules/ec2"

  project     = var.project
  environment = var.environment

  instance_type     = var.instance_type
  public_subnet_ids = module.vpc.public_subnet_ids
  ec2_sg_id         = module.security_groups.ec2_sg_id
  key_pair_name     = var.key_pair_name

  tags = local.common_tags
}

module "rds" {
  source = "../../modules/rds"

  project     = var.project
  environment = var.environment

  instance_class     = var.db_instance_class
  db_password        = var.db_password
  private_subnet_ids = module.vpc.private_subnet_ids
  rds_sg_id          = module.security_groups.rds_sg_id

  tags = local.common_tags
}

module "ecr" {
  source = "../../modules/ecr"

  project     = var.project
  environment = var.environment

  tags = local.common_tags
}

module "s3_cloudfront" {
  source = "../../modules/s3-cloudfront"

  project     = var.project
  environment = var.environment

  tags = local.common_tags
}

module "route53_acm" {
  source = "../../modules/route53-acm"

  project     = var.project
  environment = var.environment

  domain_name       = var.domain_name
  ec2_elastic_ip    = module.ec2.elastic_ip
  cloudfront_domain = module.s3_cloudfront.cloudfront_domain

  tags = local.common_tags
}
