# Sprint 3 — Terraform + AWS Deployment
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

## Week 1 Check-in (2026-07-03 — Day 4 of 10)

### ✅ Completed this week
- Auth-service migration system implemented (server.js + migrate.js + 001_create_users_table.sql)
  → **Pending commit** — files are in the working tree, not yet staged

### ⚠️ Not started yet (should have started by now)
- Terraform deep-dive (concepts) — still In Progress, no modules written
- AWS CLI / Terraform installation — not confirmed
- Terraform backend — blocked until above

### 🚨 Risk
Day 4 and Terraform hasn't started. The dependency chain
(backend → VPC → EC2 → RDS → ECR → S3/CF → Route53) needs ~6 days of
sequential work. With 6 working days left (Jul 4–11), the sprint is tight.
**Terraform backend must start today.**

---

## Sprint Backlog
| Task | Agent | Points | Priority | Status |
|------|-------|--------|----------|--------|
| Auth-service migrations (server.js + migrate.js) | Claude Code | 3 | High | ✅ Done — pending commit |
| Terraform deep-dive (concepts) | Gemini/Claude.ai | 3 | High | 🔄 In Progress |
| AWS CLI + Terraform installed locally | Anicet | 1 | High | ☐ To Do |
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

**Total: 46 points** (43 original + 3 for migration work added mid-sprint)
**Completed: 3 pts | Remaining: 43 pts**

---

## Terraform Module Build Order
Build strictly in this order — each level depends on the one above:
```
1. Backend (S3 + DynamoDB)      ← run FIRST, before terraform init
2. VPC + subnets + SGs          ← everything else lives inside it
3. EC2 instance (t3.medium)     ← needs VPC + SG
4. RDS (PostgreSQL db.t3.micro) ← needs VPC + SG
5. ECR repositories             ← independent, build alongside RDS
6. S3 + CloudFront              ← independent from VPC
7. Route53 + ACM                ← needs CloudFront distribution ID
```

## Suggested Daily Plan (remaining days)
| Date | Focus |
|------|-------|
| Thu Jul 3 | Commit auth-service work · Start Terraform backend |
| Fri Jul 4 | Terraform VPC module |
| Mon Jul 7 | Terraform EC2 module |
| Tue Jul 8 | Terraform RDS + ECR modules · Anicet: AWS CLI + GitHub Secrets |
| Wed Jul 9 | Terraform S3 + CloudFront + Route53/ACM · `terraform plan` |
| Thu Jul 10 | `terraform apply` · CD pipelines (EC2 versions) |
| Fri Jul 11 | First live deploy · Sprint review |

---

## Definition of Done
- [ ] Auth-service migration committed and passing CI
- [ ] `terraform plan` exits 0 with a clean diff
- [ ] `terraform apply` completes without errors
- [ ] EC2 instance reachable via SSH
- [ ] All 10 containers running (`docker compose ps`)
- [ ] `/health` returns 200 on all 4 backend services
- [ ] Frontend loads at the CloudFront URL
- [ ] CD pipelines deploy on push to `develop` and on semver tag

---

## Sprint Review (fill at end — 2026-07-11)
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
