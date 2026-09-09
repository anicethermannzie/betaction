# BetAction

BetAction is a full-stack football prediction application built as a microservices monorepo. It combines live match data from API-Football with weighted prediction analyzers, risk-tiered betting tickets, and real-time match notifications.

[![BetAction CI](https://github.com/anicethermannzie/betaction/actions/workflows/ci.yml/badge.svg)](https://github.com/anicethermannzie/betaction/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)

## Current status

The application foundation and local development stack are implemented:

- Four backend services and an Nginx API gateway
- Next.js frontend with authentication, matches, predictions, tickets, league, and profile views
- PostgreSQL persistence and Redis caching
- Dockerfiles for every application component and a complete Docker Compose stack
- GitHub Actions for linting, tests, image builds, dependency checks, and security scans
- Health checks for the gateway and every backend service

Infrastructure as code, cloud deployment, continuous deployment, and production monitoring are not implemented yet. The auth-service migration files are present in the working tree but are still pending integration.

## Features

- JWT registration, login, refresh-token, and protected-profile flows
- Live, club, international, and date-based football fixtures
- Match odds, statistics, standings, team statistics, and head-to-head data
- Redis-backed caching for match and prediction data
- Weighted match predictions based on form, head-to-head history, goals, and home/away performance
- Multi-market analysis covering totals, BTTS, corners, handicaps, correct score, clean sheets, halftime markets, and combined markets
- Four ticket risk tiers: ultra-safe, safe, moderate, and risky
- Real-time Socket.IO match events with scheduled match polling
- Responsive Next.js interface with ticket building, a bet slip, prediction charts, and live-score views

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Radix UI, Zustand, Recharts |
| Node.js services | Node.js 20, Express, Socket.IO, Jest |
| Prediction service | Python 3.11, FastAPI, Pydantic, NumPy, pytest |
| Data | PostgreSQL 16, Redis 7 |
| External data | API-Football |
| Gateway | Nginx |
| Local operations | Docker, Docker Compose |
| CI and security | GitHub Actions, Ruff, ESLint, Trivy, npm audit, pip-audit |

## Architecture

```text
Browser
  |
  v
Next.js frontend (:3000)
  |
  v
Nginx API gateway (:80)
  |-- /api/auth/*          -> Auth service (:3001)       -> PostgreSQL
  |-- /api/matches/*       -> Match service (:3002)      -> API-Football + Redis
  |-- /api/predictions/*   -> Prediction service (:8000) -> Match service + Redis
  |-- /api/notifications/* -> Notification service (:3003)
  `-- /socket.io/*         -> Notification service       -> Redis
```

## Repository structure

```text
betaction/
|-- backend/
|   |-- api-gateway/          # Nginx routing, rate limits, and security headers
|   |-- auth-service/         # Express, JWT, PostgreSQL, and migrations
|   |-- match-service/        # API-Football integration and Redis caching
|   |-- notification-service/ # Express, Socket.IO, and live-event polling
|   `-- prediction-service/   # FastAPI analyzers and ticket generation
|-- frontend/                 # Next.js App Router application
|-- .github/workflows/        # CI, PR checks, and security automation
|-- docs/                     # Team, sprint, and stand-up documentation
|-- docker-compose.yml        # Local development stack
`-- .env.example              # Root environment template
```

## Getting started

### Prerequisites

- Git
- Docker with Docker Compose
- An API-Football key

Node.js 20+ and Python 3.11+ are only required when running services outside Docker.

### Run the complete stack

1. Clone the repository:

   ```bash
   git clone https://github.com/anicethermannzie/betaction.git
   cd betaction
   ```

2. Create the environment files:

   ```bash
   cp .env.example .env
   cp backend/auth-service/.env.example backend/auth-service/.env
   cp backend/match-service/.env.example backend/match-service/.env
   cp backend/prediction-service/.env.example backend/prediction-service/.env
   cp backend/notification-service/.env.example backend/notification-service/.env
   cp frontend/.env.example frontend/.env
   cp backend/api-gateway/.env.example backend/api-gateway/.env
   ```

3. Replace placeholder secrets and set `RAPID_API_KEY` in the relevant environment files. Never commit `.env` files.

4. Build and start the stack:

   ```bash
   docker compose up --build
   ```

5. Open the application and APIs:

   | Component | URL |
   | --- | --- |
   | Frontend | `http://localhost:3000` |
   | API gateway | `http://localhost` |
   | Auth service | `http://localhost:3001` |
   | Match service | `http://localhost:3002` |
   | Prediction API | `http://localhost:8000` |
   | Prediction OpenAPI docs | `http://localhost:8000/docs` |
   | Notification service | `http://localhost:3003` |
   | PostgreSQL | `localhost:5432` |
   | Redis | `localhost:6379` |

Stop the stack with `docker compose down`. Add `-v` only when you intentionally want to remove the PostgreSQL and Redis volumes.

## API overview

Requests from the frontend normally go through the Nginx gateway.

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh-token
GET  /api/auth/profile
```

### Matches

```http
GET /api/matches/live
GET /api/matches/date/:date
GET /api/matches/clubs/:date?
GET /api/matches/international/:date?
GET /api/matches/h2h/:team1Id/:team2Id
GET /api/matches/:id
GET /api/matches/:id/odds
GET /api/matches/:id/statistics
```

The following match-service routes currently use the service directly at `http://localhost:3002`; gateway mappings for them have not been added yet:

```http
GET /leagues
GET /leagues/international
GET /leagues/clubs
GET /leagues/:leagueId/standings
GET /teams/:teamId/stats
```

### Predictions and tickets

```http
GET /api/predictions/today
GET /api/predictions/league/:leagueId
GET /api/predictions/:fixtureId
GET /api/predictions/:fixtureId/markets?category=all
GET /api/predictions/tickets/today
GET /api/predictions/tickets/:tier
```

Valid ticket tiers are `ultra_safe`, `safe`, `moderate`, and `risky`. Market categories include `all`, `sgp`, `totals`, `corners`, `halftime`, and `spreads`.

### Notifications

```http
GET  /api/notifications/health
GET  /api/notifications/stats
POST /api/notifications/notify/match-event
```

Socket.IO connections are proxied through `/socket.io/`.

## Development and tests

Each Node.js service supports the following commands from its own directory:

```bash
npm install
npm run dev
npm test
npm run lint
```

Run the prediction-service tests with:

```bash
cd backend/prediction-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
pytest -v
```

On Windows PowerShell, activate the virtual environment with `.venv\\Scripts\\Activate.ps1`.

Run the frontend locally with:

```bash
cd frontend
npm install
npm run dev
```

## Delivery progress

| Area | Status | Notes |
| --- | --- | --- |
| Monorepo and service foundation | Complete | Frontend, gateway, four services, PostgreSQL, and Redis |
| Backend APIs | Complete | Core auth, match, prediction, ticket, and notification flows implemented |
| Frontend UI | Complete | Main product pages and reusable components implemented |
| Docker development stack | Complete | Images, health checks, dependencies, and Compose networking implemented |
| Continuous integration | Complete | Lint, test, image build, and security workflows implemented |
| Auth database migrations | In progress | Migration implementation exists locally and awaits integration |
| Terraform infrastructure | Planned | No Terraform configuration is currently committed |
| AWS deployment and CD | Planned | Deployment workflows will follow the infrastructure work |
| Prometheus/Grafana monitoring | Planned | Monitoring configuration is not currently committed |
| Production hardening | Planned | WAF, audit logging, scaling, and operational hardening remain |

Detailed sprint history is available under [`docs/sprints`](docs/sprints/).

## Contributing

Create work from `develop` and open a pull request back to `develop`. Do not push directly to `main` or `develop`.

Branch prefixes:

- `feature/` for features
- `fix/` for bug fixes
- `hotfix/` for urgent production fixes
- `docs/` for documentation

Use conventional commits such as `feat:`, `fix:`, `docs:`, `ci:`, and `ops:`.

## License

BetAction is distributed under the [MIT License](LICENSE).
