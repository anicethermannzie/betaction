#!/bin/bash
set -euo pipefail

LOG=/var/log/betaction-setup.log
exec > >(tee -a "$LOG") 2>&1

echo "=== BetAction EC2 Setup — $(date) ==="

# ── System update ─────────────────────────────────────────────────────────────
echo "[1/6] Updating system packages..."
dnf update -y

# ── Docker ────────────────────────────────────────────────────────────────────
echo "[2/6] Installing Docker..."
dnf install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# ── Docker Compose v2 ─────────────────────────────────────────────────────────
echo "[3/6] Installing Docker Compose v2..."
DOCKER_COMPOSE_VERSION="v2.27.0"
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL \
  "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Verify
docker compose version >> "$LOG" 2>&1

# ── AWS CLI v2 ────────────────────────────────────────────────────────────────
echo "[4/6] Installing AWS CLI v2..."
dnf install -y unzip
curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/awscliv2.zip /tmp/aws

aws --version >> "$LOG" 2>&1

# ── CloudWatch Agent ──────────────────────────────────────────────────────────
echo "[5/6] Installing CloudWatch Agent..."
dnf install -y amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent

# ── App directory ─────────────────────────────────────────────────────────────
echo "[6/6] Creating app directory..."
mkdir -p /opt/betaction
chown ec2-user:ec2-user /opt/betaction

echo "=== BetAction EC2 Ready ==="
