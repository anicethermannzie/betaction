<div align="center">

# ⚽ BetAction

### AI-Powered Sports Predictions

[![Build Status](https://img.shields.io/github/actions/workflow/status/yourusername/betaction/ci.yml?branch=main&style=flat-square&logo=github)](https://github.com/yourusername/betaction/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org/)

<br />

<!-- screenshot -->

<br />

*Predict match outcomes with the power of AI — inspired by ESPN, built for the modern web.*

[Live Demo](#) · [Report Bug](https://github.com/yourusername/betaction/issues) · [Request Feature](https://github.com/yourusername/betaction/issues)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 About

**BetAction** is a full-stack football/soccer match prediction web application inspired by ESPN. It leverages **AI-powered algorithms** to generate accurate match predictions by analyzing:

- 📊 **Team Form** — Recent performance across all competitions
- 🤝 **Head-to-Head Stats** — Historical matchup records between teams
- 📈 **Historical Data** — Long-term trends, home/away performance, goal averages
- 🧠 **ML Predictions** — FastAPI-powered machine learning service for outcome probabilities

Built as a **production-grade monorepo** with microservices architecture, containerized with Docker, deployed on AWS, and monitored with Prometheus & Grafana — designed to showcase modern full-stack and DevOps engineering.

---

## 🛠️ Tech Stack

| Layer          | Technologies                                                                 |
|----------------|------------------------------------------------------------------------------|
| **Frontend**   | Next.js 14, React 18, Tailwind CSS, shadcn/ui                               |
| **Backend**    | Node.js, Express, Python, FastAPI                                            |
| **Database**   | PostgreSQL 16, Redis 7                                                       |
| **DevOps**     | Docker, GitHub Actions, Terraform                                            |
| **Cloud**      | AWS ECS Fargate, RDS, ElastiCache, S3, CloudFront                           |
| **Monitoring** | Prometheus, Grafana, AlertManager                                            |
| **API Gateway**| Nginx                                                                        |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Browser                              │
│                     Next.js 14 Frontend (React 18)                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway (Nginx)                           │
│                    Rate Limiting · SSL Termination                   │
└──────┬─────────────┬──────────────┬──────────────┬──────────────────┘
       │             │              │              │
       ▼             ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐
│   Auth   │  │  Match   │  │  Prediction  │  │  Notification    │
│ Service  │  │ Service  │  │   Service    │  │    Service       │
│  (Node)  │  │  (Node)  │  │  (FastAPI)   │  │    (Node)        │
└────┬─────┘  └────┬─────┘  └──────┬───────┘  └────────┬─────────┘
     │              │               │                    │
     └──────────────┴───────────────┴────────────────────┘
                                │
               ┌────────────────┴────────────────┐
               │                                 │
               ▼                                 ▼
     ┌──────────────────┐              ┌──────────────────┐
     │   PostgreSQL 16  │              │     Redis 7       │
     │  (Primary Data)  │              │  (Cache · Queue)  │
     └──────────────────┘              └──────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v20+
- **Python** 3.11+
- **Docker** & Docker Compose
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/betaction.git
   cd betaction
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   ```
   Frontend:        http://localhost:3000
   API Gateway:     http://localhost:8080
   Auth Service:    http://localhost:3001
   Match Service:   http://localhost:3002
   Prediction API:  http://localhost:8000
   Grafana:         http://localhost:3003
   ```

> **Note:** For local development without Docker, see the [Development Guide](./docs/development.md).

---

## 📁 Project Structure

```
betaction/
├── 📦 frontend/                  # Next.js 14 application
│   ├── app/                      # App Router pages & layouts
│   ├── components/               # Reusable UI components (shadcn/ui)
│   ├── lib/                      # Utilities, hooks, API clients
│   └── public/                   # Static assets
│
├── 🔧 services/
│   ├── auth-service/             # JWT authentication (Node.js/Express)
│   ├── match-service/            # Match data & stats (Node.js/Express)
│   ├── prediction-service/       # ML predictions (Python/FastAPI)
│   └── notification-service/     # Alerts & emails (Node.js/Express)
│
├── 🗄️ database/
│   ├── migrations/               # PostgreSQL migrations
│   └── seeds/                    # Sample data
│
├── 🌐 gateway/
│   └── nginx/                    # Nginx config & rate limiting
│
├── 📊 monitoring/
│   ├── prometheus/               # Metrics collection config
│   ├── grafana/                  # Dashboards & datasources
│   └── alertmanager/             # Alert routing rules
│
├── ☁️ infra/
│   └── terraform/                # AWS infrastructure as code
│       ├── modules/              # Reusable Terraform modules
│       └── environments/         # dev / staging / prod configs
│
├── 🔄 .github/
│   └── workflows/                # GitHub Actions CI/CD pipelines
│
├── docker-compose.yml            # Local development stack
├── docker-compose.prod.yml       # Production stack
└── README.md
```

---

## 🔌 API Endpoints

| Service             | Base Path             | Description                              |
|---------------------|-----------------------|------------------------------------------|
| **Authentication**  | `/api/auth`           | Register, login, refresh tokens, logout  |
| **Matches**         | `/api/matches`        | Fixtures, results, team stats, standings |
| **Predictions**     | `/api/predictions`    | AI match predictions, probabilities      |
| **Notifications**   | `/api/notifications`  | User alerts, email subscriptions         |

<details>
<summary><strong>View detailed endpoint examples</strong></summary>

```http
POST   /api/auth/register          # Create new account
POST   /api/auth/login             # Authenticate & receive JWT
POST   /api/auth/refresh           # Refresh access token

GET    /api/matches                # List upcoming matches
GET    /api/matches/:id            # Match details & stats
GET    /api/matches/:id/h2h        # Head-to-head history

GET    /api/predictions/:matchId   # AI prediction for a match
POST   /api/predictions/batch      # Bulk predictions

GET    /api/notifications          # User notifications
POST   /api/notifications/subscribe # Subscribe to match alerts
```

</details>

---

## 🗺️ Roadmap

- [x] **Phase 1** — Project Setup & Monorepo Structure
- [ ] **Phase 2** — Backend Microservices (Auth, Match, Prediction, Notification)
- [ ] **Phase 3** — Frontend UI (Next.js 14, shadcn/ui, ESPN-inspired design)
- [ ] **Phase 4** — Docker Containerization & Docker Compose
- [ ] **Phase 5** — CI/CD Pipelines (GitHub Actions — test, build, push to ECR)
- [ ] **Phase 6** — Infrastructure as Code (Terraform — VPC, ECS, RDS, ElastiCache)
- [ ] **Phase 7** — AWS Deployment (ECS Fargate, CloudFront, S3, Route 53)
- [ ] **Phase 8** — Monitoring & Observability (Prometheus, Grafana, AlertManager)
- [ ] **Phase 9** — Production Hardening (rate limiting, WAF, audit logging, scaling)

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and development process.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

<div align="center">

Built with ❤️ by [Your Name](https://github.com/yourusername)

⭐ **Star this repo if you find it useful!** ⭐

</div>
