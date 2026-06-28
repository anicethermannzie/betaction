# Sprint 2 — CI/CD & Infrastructure ✅ CLOSED (2026-06-27)

## Sprint Goal
Implement a complete CI/CD pipeline and provision AWS infrastructure with Terraform for production deployment.

## Team
| Agent | Role | Tasks |
|-------|------|-------|
| Anicet (CEO) | Product Owner / DevOps Lead | Sprint planning, AWS setup, secrets management |
| Claude.ai | Tech Lead | Architecture, CI/CD strategy, prompts |
| Claude Code | Senior Full-Stack Dev | Workflows, Terraform modules |
| Gemini | DevOps Mentor | CI/CD concepts, Terraform deep-dive, interview prep |

## Sprint Backlog
| Task | Assigned To | Points | Priority | Status |
|------|-------------|--------|----------|--------|
| Understand CI/CD concepts | Gemini | 3 | High | ✅ Done |
| ci.yml (lint, test, build, scan) | Claude Code | 5 | High | ✅ Done — ALL GREEN |
| cd-staging.yml (auto-deploy on develop push) | Claude Code | 5 | High | ❌ DELETED |
| cd-prod.yml (deploy on semver tag) | Claude Code | 5 | High | ❌ DELETED |
| security.yml (weekly Trivy scan) | Claude Code | 3 | Medium | ✅ Done |
| pr-checks.yml (title lint, size check) | Claude Code | 3 | Medium | ✅ Done |
| Sprint A gaps (migrations, auth flow, Redis cache) | Claude Code | 5 | High | ✅ Done |
| Understand Terraform concepts | Gemini | 3 | High | ☐ → Sprint 3 |
| Terraform VPC module | Claude Code | 5 | High | ☐ → Sprint 3 |
| Terraform EC2 module | Claude Code | 5 | High | ☐ → Sprint 3 |
| Terraform RDS module | Claude Code | 3 | High | ☐ → Sprint 3 |
| Terraform S3 + CloudFront module | Claude Code | 3 | Medium | ☐ → Sprint 3 |
| Terraform Route53 module | Claude Code | 2 | Medium | ☐ → Sprint 3 |
| GitHub Actions secrets setup (AWS keys) | Anicet | 2 | High | ☐ → Sprint 3 |
| First deployment on AWS | Anicet + Claude Code | 5 | High | ☐ → Sprint 3 |

## Why cd-staging.yml and cd-prod.yml Were Deleted
> CD pipelines were deleted because the deployment strategy changed from
> ECS Fargate ($280/month) to EC2 Docker Compose ($75/month).
> CD pipelines will be recreated after Terraform provisions the EC2 infrastructure.

The original pipelines targeted ECS Fargate task definitions and ECR-based rolling
deployments — none of which apply to a Docker Compose setup on a single EC2 instance.
Recreating them for EC2 (SSH + `docker compose pull && docker compose up -d`) is a
Sprint 3 deliverable, gated on Terraform completing the EC2 module first.

## Sprint Metrics
- Target velocity: 52 story points
- **Completed: 19 pts** — ci.yml (5) + pr-checks.yml (3) + security.yml (3) + CI concepts (3) + Sprint A fixes (5)
- **Deleted (not delivered): 10 pts** — cd-staging.yml (5) + cd-prod.yml (5) — wrong architecture, descoped
- **Carried over to Sprint 3: 28 pts** — Terraform + AWS secrets + first deployment
- Sprint status: CLOSED

## Progress
```
CI Pipeline  ████████████ 100%   ci.yml + pr-checks + security ✅
Sprint A     ████████████ 100%   migrations + auth + Redis     ✅
CD Pipelines ░░░░░░░░░░░░   0%   deleted — EC2 versions → Sprint 3
Terraform    ░░░░░░░░░░░░   0%   0/5 modules                  → Sprint 3
AWS Deploy   ░░░░░░░░░░░░   0%   not started                  → Sprint 3
```
