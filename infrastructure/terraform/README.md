# BetAction — Terraform Infrastructure

**Company:** ZahTech LLC  
**Target:** AWS us-east-1  
**Architecture:** EC2 t3.medium (Docker Compose) + RDS PostgreSQL + S3/CloudFront + Route53/ACM  
**Estimated cost:** ~$68–75/month

---

## Prerequisites

- AWS CLI configured with sufficient permissions: `aws sts get-caller-identity`
- Terraform >= 1.5: `terraform -version`
- SSH key pair created in AWS us-east-1 (see Step 2)

---

## Step 1 — Create Terraform State Backend (ONE TIME ONLY)

Run these three commands **before** `terraform init`. They create the S3 bucket
and DynamoDB table that store your Terraform state remotely.

```bash
aws s3 mb s3://betaction-terraform-state --region us-east-1

aws s3api put-bucket-versioning \
  --bucket betaction-terraform-state \
  --versioning-configuration Status=Enabled

aws dynamodb create-table \
  --table-name betaction-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

---

## Step 2 — Create SSH Key Pair

```bash
aws ec2 create-key-pair \
  --key-name betaction-prod \
  --query 'KeyMaterial' \
  --output text > betaction-prod.pem

chmod 400 betaction-prod.pem
```

Keep `betaction-prod.pem` somewhere safe — you cannot download it again from AWS.

---

## Step 3 — Initialize Terraform

```bash
cd infrastructure/terraform/environments/prod
terraform init
```

---

## Step 4 — Plan

```bash
TF_VAR_db_password="YourSecurePassword123!" \
TF_VAR_key_pair_name="betaction-prod" \
terraform plan
```

Review the plan. You should see **~40–50 resources** to be created.

---

## Step 5 — Apply

```bash
TF_VAR_db_password="YourSecurePassword123!" \
TF_VAR_key_pair_name="betaction-prod" \
terraform apply
```

Type `yes` when prompted. Full apply takes ~10–15 minutes (RDS + ACM validation).

---

## Step 6 — Get Outputs

```bash
terraform output
```

Key outputs you will need:

| Output | Used for |
|--------|----------|
| `ec2_elastic_ip` | SSH access + DNS |
| `rds_endpoint` | `DB_HOST` in `.env` |
| `ecr_repository_urls` | Docker image push/pull |
| `cloudfront_domain` | Frontend CDN URL |
| `s3_frontend_bucket` | `aws s3 sync ./out s3://...` |
| `ssh_command` | Connect to EC2 |

---

## Estimated Monthly Cost

| Resource | Spec | Cost |
|----------|------|------|
| EC2 | t3.medium (2 vCPU, 4 GB) | ~$30 |
| RDS | db.t3.micro PostgreSQL 16 | ~$15 |
| NAT Gateway | 1× us-east-1a | ~$15 |
| S3 + CloudFront | PriceClass_100 | ~$5 |
| ECR | 6 repositories | ~$2 |
| Route53 | 1 hosted zone | ~$1 |
| Elastic IP | Attached to EC2 | ~$0 |
| **Total** | | **~$68/month** |

---

## Module Structure

```
infrastructure/terraform/
├── backend.tf                    ← S3 remote state config
├── modules/
│   ├── vpc/                      ← VPC, subnets, IGW, NAT, route tables
│   ├── security-groups/          ← EC2, RDS, Redis security groups
│   ├── ec2/                      ← Instance, IAM role, Elastic IP
│   ├── rds/                      ← PostgreSQL 16 (private subnets)
│   ├── ecr/                      ← 6 image registries with lifecycle policies
│   ├── s3-cloudfront/            ← Frontend CDN with OAC
│   └── route53-acm/              ← DNS + SSL certificate
└── environments/
    └── prod/                     ← Wires all modules together
```

---

## Important Notes

- **Never commit** `terraform.tfstate`, `*.tfvars` with secrets, or `.terraform/`
- **Never store** `TF_VAR_db_password` in any file tracked by git
- **Terraform state** is in S3 — never check in the local `.tfstate` file
- **Deletion protection** is enabled on RDS — you must disable it before `terraform destroy`
- **SSH port 22** is open to `0.0.0.0/0` in the EC2 security group — restrict to your IP
  after first setup by editing `modules/security-groups/main.tf`
- **Route53 hosted zone** must already exist before applying the `route53_acm` module

---

## Destroy (when needed)

```bash
# 1. Disable RDS deletion protection first
aws rds modify-db-instance \
  --db-instance-identifier betaction-postgres-prod \
  --no-deletion-protection \
  --apply-immediately

# 2. Then destroy
TF_VAR_db_password="..." TF_VAR_key_pair_name="betaction-prod" \
terraform destroy
```
