# BetAction - Project Context

## Architecture

* Monorepo with microservices architecture
* 4 backend services: auth-service (Node.js/Express), match-service (Node.js/Express), prediction-service (Python/FastAPI), notification-service (Node.js/Socket.io)
* Frontend: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
* API Gateway: Nginx
* Database: PostgreSQL 16 + Redis 7
* External API: API-Football (RapidAPI)

## Conventions

* Branch naming: feature/, fix/, docs/
* Commits: conventional commits (feat:, fix:, docs:, ci:, ops:)
* Code style: ESLint + Prettier for JS/TS, Black for Python
* All services expose health check at GET /health
* All environment variables go in .env files (never commit them)
* Each microservice has its own Dockerfile

## DevOps Stack

* Docker + Docker Compose (local dev)
* GitHub Actions (CI/CD)
* Terraform (Infrastructure as Code)
* AWS: ECS Fargate, RDS, ElastiCache, S3, CloudFront, ALB
* Monitoring: Prometheus + Grafana + AlertManager

## Project Structure

backend/         → microservices (auth, match, prediction, notification)
frontend/        → Next.js web application
infrastructure/  → Terraform + Docker configs
monitoring/      → Prometheus, Grafana, AlertManager configs
.github/         → CI/CD workflows
scripts/         → utility scripts
docs/            → project documentation

## Collaboration Style

* Always explain the root cause of a bug or CI failure BEFORE writing or changing any code.
Show: what failed, why it failed (the mechanism), and what the fix addresses.
This project is a learning environment — understanding beats speed.

## Ports

* Frontend: 3000
* Auth Service: 3001
* Match Service: 3002
* Notification Service: 3003
* Prediction Service: 8000
* PostgreSQL: 5432
* Redis: 6379





\## Git Workflow

\- Never push directly to `main` or `develop`

\- Always create a feature branch before starting work

\- Branch naming:

&#x20; - Frontend (Antigravity): `feature/frontend-<description>`

&#x20; - Backend (Claude Code): `feature/backend-<description>`

&#x20; - Bug fixes: `fix/<description>`

&#x20; - Urgent production fixes: `hotfix/<description>`

\- Always open a Pull Request toward `develop` when done

\- Wait for owner approval before merging

\- Never force push on `main` or `develop`



\## Agent Responsibilities

\- Antigravity: frontend only → `frontend/` directory

\- Claude Code: backend only → `backend/` directory

\- Neither agent touches the other's directory

