# Sprint 3 — Terraform + AWS Deployment

## Sprint Goal
Provision AWS infrastructure with Terraform and deploy BetAction
on EC2 for the first time.

## Team
| Agent | Role | Tasks |
|-------|------|-------|
| Anicet (CEO) | Product Owner / DevOps Lead | AWS CLI, secrets, approve PRs, final deploy |
| Claude Code | Senior Full-Stack Dev | All Terraform modules, EC2 CD pipelines |
| Gemini / Claude.ai | DevOps Mentor / Tech Lead | Terraform concepts, interview Q&A, state mgmt |

## Sprint Backlog
| Task | Agent | Points | Priority | Status |
|------|-------|--------|----------|--------|
| Terraform deep-dive (concepts) | Gemini/Claude.ai | 3 | High | 🔄 In Progress |
| AWS CLI + Terraform installed | Anicet | 1 | High | ☐ To Do |
| Terraform backend (S3 + DynamoDB) | Claude Code | 3 | High | ☐ To Do |
| Terraform VPC module | Claude Code | 5 | High | ☐ To Do |
| Terraform EC2 module | Claude Code | 5 | High | ☐ To Do |
| Terraform RDS module | Claude Code | 3 | High | ☐ To Do |
| Terraform S3 + CloudFront module | Claude Code | 3 | Medium | ☐ To Do |
| Terraform Route53 + ACM module | Claude Code | 2 | Medium | ☐ To Do |
| ECR repositories | Claude Code | 2 | High | ☐ To Do |
| GitHub Secrets (AWS keys) | Anicet | 1 | High | ☐ To Do |
| cd-staging.yml (EC2 version) | Claude Code | 5 | High | ☐ To Do |
| cd-prod.yml (EC2 version) | Claude Code | 5 | High | ☐ To Do |
| First terraform apply + deploy | Anicet + Claude Code | 5 | High | ☐ To Do |

**Total: 43 points**

## Terraform Module Build Order
Dependencies flow top-to-bottom — build in this sequence:
```
1. Backend (S3 + DynamoDB)      ← must exist before terraform init
2. VPC + subnets + SGs          ← all other resources live inside it
3. EC2 instance (t3.medium)     ← needs VPC + SG
4. RDS (PostgreSQL db.t3.micro) ← needs VPC + SG
5. ECR repositories             ← independent, needed for image push
6. S3 + CloudFront              ← independent from VPC
7. Route53 + ACM                ← needs CloudFront distribution ID
```

## Definition of Done
- [ ] `terraform plan` exits 0 with a clean diff
- [ ] `terraform apply` completes without errors
- [ ] EC2 instance reachable via SSH
- [ ] All 10 containers running (`docker compose ps`)
- [ ] `/health` returns 200 on all 4 backend services
- [ ] Frontend loads at the CloudFront URL
- [ ] CD pipelines deploy on push to `develop` (staging) and on semver tag (prod)

## Sprint Review (fill at end)
### What was delivered:
-
### First deployment URL:
-

## Sprint Retrospective (fill at end)
### What went well:
-
### What could improve:
-
### Action items for Sprint 4:
-
