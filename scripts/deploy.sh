#!/bin/bash
set -e

VPS_USER=${VPS_USER:-deploy}
VPS_HOST=${VPS_HOST:-your-vps-ip}
VPS_PATH=${VPS_PATH:-/opt/apps/precya}

echo "🚀 Deploy para VPS ($VPS_USER@$VPS_HOST)..."

# 1. Push branch
git push origin main

# 2. SSH para VPS e deploy
ssh "$VPS_USER@$VPS_HOST" bash << EOF
  set -e
  cd $VPS_PATH
  git pull origin main
  docker-compose -f docker-compose.prod.yml build
  docker-compose -f docker-compose.prod.yml up -d
  sleep 5
  curl -f http://localhost:5003/api/health || exit 1
  echo "✅ Deploy concluído!"
EOF
