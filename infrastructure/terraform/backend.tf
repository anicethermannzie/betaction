# =============================================================================
# BetAction — Terraform Remote State Backend
# Company: ZahTech LLC
# =============================================================================
#
# IMPORTANT: The S3 bucket and DynamoDB table must be created MANUALLY
# before running `terraform init`. Run these AWS CLI commands ONCE:
#
#   aws s3 mb s3://betaction-terraform-state --region us-east-1
#
#   aws s3api put-bucket-versioning \
#     --bucket betaction-terraform-state \
#     --versioning-configuration Status=Enabled
#
#   aws dynamodb create-table \
#     --table-name betaction-terraform-locks \
#     --attribute-definitions AttributeName=LockID,AttributeType=S \
#     --key-schema AttributeName=LockID,KeyType=HASH \
#     --billing-mode PAY_PER_REQUEST \
#     --region us-east-1
#
# S3 bucket names are globally unique — append your AWS account ID to avoid
# conflicts: betaction-terraform-state-123456789012
# =============================================================================

terraform {
  backend "s3" {
    bucket         = "betaction-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "betaction-terraform-locks"
  }
}
