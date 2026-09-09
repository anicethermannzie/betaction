# Sprint 4 — CD Pipelines + First Live Deployment
## 2026-07-22 → 2026-08-04 (2 weeks)

## Sprint Goal
Deploy all 10 BetAction containers on EC2 via automated CD pipelines
and make the application accessible live for the first time.

## Team
| Agent | Role | Tasks |
|-------|------|-------|
| Anicet (CEO) | Product Owner / DevOps Lead | Domain purchase, GitHub Secrets, approve PRs, final validation |
| Claude Code | Senior Full-Stack Dev | CD pipelines, EC2 deploy scripts, .env setup, Nginx SSL |
| Gemini / Claude.ai | DevOps Mentor | CD concepts, SSH deploy patterns, pipeline review |

---

## Sprint Backlog
| Task | Agent | Points | Priority | Status |
|------|-------|--------|----------|--------|
| cd-staging.yml (EC2 SSH version) | Claude Code | 5 | High | ☐ To Do |
| cd-prod.yml (EC2 SSH version) | Claude Code | 5 | High | ☐ To Do |
| Build + push 6 images to ECR | Claude Code | 3 | High | ☐ To Do |
| EC2 deploy script (docker-compose pull + up) | Claude Code | 3 | High | ☐ To Do |
| .env setup on EC2 (DB_HOST, secrets) | Anicet + Claude Code | 2 | High | ☐ To Do |
| Nginx SSL config on EC2 (Let's Encrypt or ACM) | Claude Code | 3 | High | ☐ To Do |
| GitHub Secrets (ECR, SSH key, DB password) | Anicet | 2 | High | ☐ To Do |
| First full deploy — all 10 containers running | Anicet + Claude Code | 5 | High | ☐ To Do |
| /health check on all 4 backend services | Claude Code | 2 | Medium | ☐ To Do |
| Purchase domain betaction.com | Anicet | 1 | Medium | ☐ To Do |
| Route53 + ACM — uncomment module + apply | Claude Code | 3 | Medium | ☐ To Do |
| Release unassociated Elastic IP (cost saving) | Anicet | 1 | Low | ☐ To Do |

**Total: 35 points**

---

## CD Pipeline Architecture (EC2 SSH)

```
Push to develop branch
    ↓
GitHub Actions: cd-staging.yml
    ↓
1. Build Docker images (6 services)
2. Push to ECR (145736414753.dkr.ecr.us-east-1.amazonaws.com)
3. SSH to EC2 (32.195.76.194)
4. docker compose pull
5. docker compose up -d
6. Health check — curl http://localhost:3001/health
```

## GitHub Secrets Required
| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | IAM user betaction-deploy key |
| `AWS_SECRET_ACCESS_KEY` | IAM user betaction-deploy secret |
| `EC2_HOST` | `32.195.76.194` |
| `EC2_SSH_KEY` | Content of betaction-prod.pem |
| `DB_PASSWORD` | RDS master password |

## EC2 Connection
```bash
ssh -i betaction-prod.pem ec2-user@32.195.76.194
```

## RDS Endpoint (for .env on EC2)
```
DB_HOST=betaction-postgres-prod.cizgyuq6cf7w.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=betaction
DB_USER=betaction_user
```

## Suggested Daily Plan
| Date | Focus |
|------|-------|
| Tue Jul 22 | cd-staging.yml + cd-prod.yml |
| Wed Jul 23 | EC2 deploy script + .env setup |
| Thu Jul 24 | Build + push images to ECR |
| Fri Jul 25 | First manual docker compose up on EC2 |
| Mon Jul 28 | /health checks + Nginx SSL |
| Tue Jul 29 | GitHub Secrets + first CD pipeline run |
| Wed Jul 30 | Domain purchase + Route53 module apply |
| Thu Jul 31 | Full end-to-end CD pipeline validation |
| Fri Aug 1  | Buffer + Sprint review prep |

---

## Definition of Done
- [ ] cd-staging.yml triggers on push to develop and deploys to EC2
- [ ] cd-prod.yml triggers on semver tag (v*.*.*) and deploys to EC2
- [ ] All 10 containers running: `docker compose ps` shows Up
- [ ] `/health` returns 200 on auth:3001, match:3002, prediction:8000, notif:3003
- [ ] Frontend loads at CloudFront URL
- [ ] Application reachable via domain (if purchased)
- [ ] No secrets in git — all via GitHub Secrets + .env on EC2

---

## Sprint Review (fill at end — 2026-08-04)
### What was delivered:
-
### Live URL:
-

## Sprint Retrospective (fill at end)
### What went well:
-
### What could improve:
-
### Action items for Sprint 5:
-
