# =============================================================================
# BetAction — Production Terraform Variables
# =============================================================================
# IMPORTANT: db_password and key_pair_name are NOT here.
# Pass them as environment variables to avoid committing secrets:
#
#   export TF_VAR_db_password="YourSecurePassword123!"
#   export TF_VAR_key_pair_name="betaction-prod"
#
# Then run: terraform plan / terraform apply
# =============================================================================

environment       = "prod"
project           = "betaction"
company           = "zahtech"
aws_region        = "us-east-1"
instance_type     = "t3.medium"
db_instance_class = "db.t3.micro"
domain_name       = "betaction.com"
