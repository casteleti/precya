#!/bin/bash
set -e

echo "🚀 Configurando PRECYA..."

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale: https://nodejs.org/"
    exit 1
fi

# 2. Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale: https://docker.com/"
    exit 1
fi

# 3. Create .env from example
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ .env criado — edite com suas credenciais antes de continuar"
fi

# 4. Install dependencies
echo "📦 Instalando dependências..."
cd app/frontend && npm install && cd ../..
cd app/backend && npm install && cd ../..

# 5. Pull Docker images
echo "🐳 Baixando imagens Docker..."
docker-compose pull

# 6. Start containers
echo "🟢 Subindo containers..."
docker-compose up -d precya-postgres precya-redis

# 7. Wait for Postgres
echo "⏳ Aguardando PostgreSQL..."
sleep 8

# 8. Run migrations
echo "🗄️ Rodando migrations..."
cd app/backend
npx prisma migrate dev --name init
cd ../..

echo ""
echo "✅ Setup completo!"
echo ""
echo "Próximos passos:"
echo "  make dev                              → inicia todos os serviços"
echo "  http://localhost:5002                 → app web"
echo "  http://localhost:5003/api/health      → API health check"
