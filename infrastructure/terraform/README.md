# BetAction — Terraform Infrastructure

**Company:** ZahTech LLC  
**Target:** AWS us-east-1  
**Architecture:** HTTPS ALB + EC2 (Docker Compose) + RDS PostgreSQL + S3/CloudFront + Route53/ACM
**Cost:** Review an AWS estimate before applying; the ALB adds hourly and capacity charges.

---

## Prerequisites

- AWS CLI configured with sufficient permissions: `aws sts get-caller-identity`
- Terraform >= 1.5: `terraform -version`
- Session Manager plugin installed locally, plus operator IAM permissions to start sessions

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

## Step 2 - Prepare Session Manager access

The EC2 role includes AmazonSSMManagedInstanceCore. New instances install and enable
amazon-ssm-agent during bootstrap. Operators need their own IAM permissions to
start and terminate sessions; the instance role does not grant operator access.
No inbound SSH rule is created. A legacy key_pair_name can remain set on an
existing instance to avoid changing instance configuration during this migration.

## Step 3 — Initialize Terraform

```bash
cd infrastructure/terraform/environments/prod
terraform init
```

---

## Step 4 — Plan

```bash
TF_VAR_db_password="YourSecurePassword123!" \
terraform plan
```

Review the plan, including ALB charges and DNS changes.

---

## Step 5 — Apply

```bash
TF_VAR_db_password="YourSecurePassword123!" \
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
| `application_url` | HTTPS application URL |
| `rds_endpoint` | `DB_HOST` in `.env` |
| `ecr_repository_urls` | Docker image push/pull |
| `cloudfront_domain` | Frontend CDN URL |
| `s3_frontend_bucket` | `aws s3 sync ./out s3://...` |
| `session_manager_command` | Connect to EC2 through SSM |

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
- **EC2 ingress:** ports 80 and 3000 from the ALB security group only; no SSH or public application listeners.
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
TF_VAR_db_password="..." terraform destroy
```

## HTTPS and Session Manager migration

The ALB redirects HTTP to HTTPS using the validated ACM certificate. Root and www
serve Next.js on EC2 port 3000. The api hostname, /api/matches/*,
/api/predictions/*, /api/notifications/* and /socket.io* go to the gateway on
port 80. Same-origin /api/auth/* stays on Next.js for its session proxy.
S3/CloudFront resources remain available at their distribution URL; www now serves
the running Next.js application through the ALB.

Before applying to an existing deployment:

1. Attach AmazonSSMManagedInstanceCore to the existing EC2 role and verify the node
   is Online in Systems Manager and an operator can open a session. If the agent
   is absent, install and enable amazon-ssm-agent using existing administrative
   access before removing SSH ingress. Existing instances ignore user_data changes,
   so applying this configuration will not rerun bootstrap on them.
2. Confirm the deployed containers serve Next.js on host port 3000 and gateway
   /health on port 80. Set NEXT_PUBLIC_API_URL to /api and NEXT_PUBLIC_SOCKET_URL
   to the HTTPS application origin; configure production CORS origins and the
   server-side AUTH_SERVICE_URL. Rebuild frontend images for public env changes.
3. Plan and apply in a maintenance window. This changes root, www and api DNS and
   removes direct EC2 access; cached old DNS can cause transient failures. Review
   the plan for unintended instance replacements and keep any existing key pair
   input unchanged during migration.
4. Check both ALB target groups are healthy, HTTP redirects to HTTPS, certificate
   validation succeeds, and login, API requests and WebSocket connections work.
   Confirm EC2 ports 22, 80, 443 and 3000 cannot be reached directly from the Internet.
5. Connect using the command printed by terraform output -raw session_manager_command.

EC2 retains outbound Internet access for SSM, image pulls and bootstrap. The ALB
is the only allowed inbound source; Session Manager requires no inbound ports.

References: [ALB target security groups](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-update-security-groups.html),
[Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html),
[instance permissions](https://docs.aws.amazon.com/systems-manager/latest/userguide/setup-instance-permissions.html).
