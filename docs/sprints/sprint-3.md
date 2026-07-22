# Sprint 3 — Terraform + AWS Deployment ✅ CLOSED (2026-07-11)
## 2026-06-30 → 2026-07-11 (2 weeks)

## Sprint Goal
Provision AWS infrastructure with Terraform and deploy BetAction
on EC2 for the first time.

## Team
| Agent | Role | Tasks |
|-------|------|-------|
| Anicet (CEO) | Product Owner / DevOps Lead | AWS CLI, secrets, approve PRs, final deploy |
| Claude Code | Senior Full-Stack Dev | All Terraform modules, EC2 CD pipelines |
| Gemini / Claude.ai | DevOps Mentor / Tech Lead | Terraform concepts, interview Q&A, state mgmt |

---

## Sprint Backlog
| Task | Agent | Points | Priority | Status |
|------|-------|--------|----------|--------|
| Auth-service migrations (server.js + migrate.js) | Claude Code | 3 | High | ✅ Done |
| Terraform deep-dive (concepts) | Gemini/Claude.ai | 3 | High | ✅ Done |
| AWS CLI + Terraform installed locally | Anicet | 1 | High | ✅ Done |
| Terraform backend (S3 + DynamoDB) | Claude Code | 3 | High | ✅ Done |
| Terraform VPC module | Claude Code | 5 | High | ✅ Done |
| Terraform EC2 module | Claude Code | 5 | High | ✅ Done |
| Terraform RDS module | Claude Code | 3 | High | ✅ Done |
| Terraform S3 + CloudFront module | Claude Code | 3 | Medium | ✅ Done |
| Terraform Route53 + ACM module | Claude Code | 2 | Medium | ✅ Written — commented out (domain not purchased) |
| ECR repositories (6 services) | Claude Code | 2 | High | ✅ Done |
| GitHub Secrets (AWS keys) | Anicet | 1 | High | ✅ Done |
| First terraform apply | Anicet + Claude Code | 5 | High | ✅ Done — infra live on AWS |
| cd-staging.yml (EC2 version) | Claude Code | 5 | High | ❌ → Sprint 4 |
| cd-prod.yml (EC2 version) | Claude Code | 5 | High | ❌ → Sprint 4 |

## Sprint Metrics
- **Completed: 36 pts** — auth migrations (3) + Terraform concepts (3) + AWS CLI (1) + backend S3/DDB (3) + VPC (5) + EC2 (5) + RDS (3) + S3/CF (3) + Route53 module written (2) + ECR (2) + GitHub Secrets (1) + first apply (5)
- **Carried over to Sprint 4: 10 pts** — cd-staging.yml (5) + cd-prod.yml (5)
- Sprint status: CLOSED

## AWS Infrastructure — Live (Account 145736414753)
| Resource | ID / Endpoint | Status |
|----------|--------------|--------|
| EC2 t3.medium | `i-0ea971bac3f6fc938` · IP `32.195.76.194` | ✅ running |
| Elastic IP | `100.29.36.91` (unassociated — release it) | ⚠️ |
| Elastic IP | `32.195.76.194` → EC2 | ✅ attached |
| RDS PostgreSQL 16 | `betaction-postgres-prod.cizgyuq6cf7w.us-east-1.rds.amazonaws.com` | ✅ available |
| S3 bucket | `betaction-frontend-5a0f571b` | ✅ created |
| CloudFront | `d3uxrk5uue7f9r.cloudfront.net` | ✅ deployed |
| ECR | 6 repositories | ✅ created |
| VPC | `vpc-0c49011dc57fa4e16` — 10.0.0.0/16 | ✅ available |
| NAT Gateway | `nat-0ee537e24ce8e6087` | ✅ available |
| Route53 + ACM | Module written, disabled | ⏳ pending domain purchase |

## Progress
```
Auth migrations  ████████████ 100%   server.js + migrate.js + SQL   ✅
Terraform IaC    ████████████ 100%   7 modules written + applied     ✅
AWS Deploy       ████████░░░░  70%   infra live, containers pending  🔄
CD Pipelines     ░░░░░░░░░░░░   0%   cd-staging + cd-prod           → Sprint 4
```

## Sprint Review
### What was delivered:
- Complete Terraform infrastructure (7 modules, 40+ AWS resources)
- EC2 t3.medium live in us-east-1, RDS PostgreSQL available, CloudFront deployed
- Auth-service SQL migration system committed and pushed
- 6 ECR repositories with lifecycle policies

### First infrastructure URL:
- CloudFront: https://d3uxrk5uue7f9r.cloudfront.net (no frontend deployed yet)
- EC2: ssh -i betaction-prod.pem ec2-user@32.195.76.194

## Sprint Retrospective
### What went well:
- terraform apply worked first try — all modules correct
- RDS and ECR fully operational on first plan
- Migration system architecture clean and simple

### What could improve:
- CD pipelines should have been written before closing the sprint
- Domain purchase should be planned before writing Route53 module

### Action items for Sprint 4:
- Write cd-staging.yml + cd-prod.yml (EC2/SSH version)
- Deploy containers on EC2 (docker compose up)
- Purchase betaction.com domain
