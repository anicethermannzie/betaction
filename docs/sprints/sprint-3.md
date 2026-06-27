# Sprint 3 — Terraform + EC2 Deployment
## 2026-06-30 → 2026-07-11 (2 weeks)

## Sprint Goal
Provision all AWS infrastructure with Terraform and ship the first live EC2 deployment
of BetAction — so the app is reachable at a public URL by end of sprint.

## Carry-over from Sprint 2
All Terraform tasks were blocked in Sprint 2 while CI/CD was finished.
CD pipelines for EC2 were removed (commit 47dc95a) pending Terraform completion.
Both are priority-1 this sprint.

## Team
| Agent | Role | Tasks |
|-------|------|-------|
| Anicet (CEO) | Product Owner / DevOps Lead | AWS CLI, secrets, approve PRs, final deploy |
| Claude Code | Senior Full-Stack Dev | All Terraform modules, EC2 CD pipelines |
| Gemini | DevOps Mentor | Terraform concepts, interview Q&A, state mgmt |

## Sprint Backlog

### 🔴 High Priority — Terraform Core (Phase 6)
| Task | Assigned To | Points | Status |
|------|-------------|--------|--------|
| Terraform state backend (S3 + DynamoDB lock) | Claude Code | 3 | ☐ To Do |
| Terraform VPC module (subnets, IGW, SG) | Claude Code | 5 | ☐ To Do |
| Terraform EC2 module (t3.medium, key pair, EIP) | Claude Code | 5 | ☐ To Do |
| Terraform RDS module (PostgreSQL db.t3.micro) | Claude Code | 3 | ☐ To Do |
| Terraform ElastiCache module (Redis t3.micro) | Claude Code | 2 | ☐ To Do |
| Terraform S3 + CloudFront (frontend static hosting) | Claude Code | 3 | ☐ To Do |
| Terraform Route53 + ACM (DNS + SSL cert) | Claude Code | 2 | ☐ To Do |
| Terraform ECR repositories (6 services) | Claude Code | 2 | ☐ To Do |

### 🔴 High Priority — CD Pipelines for EC2 (Phase 5c)
| Task | Assigned To | Points | Status |
|------|-------------|--------|--------|
| cd-ec2.yml (SSH + Docker Compose deploy on develop push) | Claude Code | 5 | ☐ To Do |
| cd-prod-ec2.yml (deploy on semver tag push) | Claude Code | 3 | ☐ To Do |

### 🔴 High Priority — AWS Setup (Anicet)
| Task | Assigned To | Points | Status |
|------|-------------|--------|--------|
| AWS CLI configured + credentials working locally | Anicet | 1 | ☐ To Do |
| GitHub Actions secrets: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY | Anicet | 1 | ☐ To Do |
| SSH key pair generated + public key registered in AWS | Anicet | 1 | ☐ To Do |
| `terraform init && terraform plan` — review before apply | Anicet + Claude Code | 2 | ☐ To Do |
| `terraform apply` — first real infrastructure provisioning | Anicet | 3 | ☐ To Do |
| First deployment: Docker Compose up on EC2 | Anicet + Claude Code | 5 | ☐ To Do |

### 🟡 Medium Priority — Interview Prep (Phase 7.5)
| Task | Assigned To | Points | Status |
|------|-------------|--------|--------|
| Understand Terraform concepts (state, plan, apply, modules) | Gemini | 3 | ☐ To Do |
| Kubernetes basics notebook (why K8s, pods, deployments, services) | Gemini | 3 | ☐ To Do |
| Docker Compose → Kubernetes migration path (written notes) | Gemini | 2 | ☐ To Do |

## Sprint Metrics
- **Target velocity:** 54 story points
- **Completed:** 0 pts
- **Remaining:** 54 pts
- **Sprint status:** NOT STARTED

## Progress
```
Terraform    ░░░░░░░░░░░░   0%    0/8 modules   ☐
CD Pipelines ░░░░░░░░░░░░   0%    0/2 workflows ☐
AWS Deploy   ░░░░░░░░░░░░   0%    Not started   ☐
K8s Prep     ░░░░░░░░░░░░   0%    0/3 tasks     ☐
```

## Terraform Module Order (dependency chain)
Build in this order — each depends on the previous:
```
1. State backend (S3 + DynamoDB)    ← must exist before terraform init
2. VPC + subnets + security groups  ← everything else lives inside it
3. EC2 instance                     ← needs VPC + SG
4. RDS (PostgreSQL)                 ← needs VPC + SG
5. ElastiCache (Redis)              ← needs VPC + SG
6. ECR repositories                 ← independent, create early
7. S3 + CloudFront                  ← independent from VPC
8. Route53 + ACM                    ← needs CloudFront distribution ID
```

## Definition of Done
- [ ] `terraform plan` shows 0 errors and a sensible diff
- [ ] `terraform apply` completes without errors
- [ ] EC2 instance is reachable via SSH
- [ ] All 10 Docker containers are running (`docker compose ps`)
- [ ] `/health` endpoint returns 200 on all 4 backend services
- [ ] Frontend loads at the CloudFront URL
- [ ] RDS and Redis are reachable from EC2

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
