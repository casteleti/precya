# Deploy na VPS

## Primeiro Deploy
```bash
ssh deploy@SEU_VPS_IP
git clone https://github.com/SEU_USER/precya /opt/apps/precya
cd /opt/apps/precya
cp .env.example .env
# Editar .env com credenciais de produção
docker-compose -f docker-compose.prod.yml up -d
```

## Deploys Subsequentes
```bash
# Local:
make deploy
# Ou via GitHub Actions (workflow_dispatch em production.yml)
```

## Variáveis de Ambiente (VPS)
Editar `/opt/apps/precya/.env` com:
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `NEXTAUTH_SECRET` (openssl rand -base64 32)
- `NEXTAUTH_URL` (domínio real)
- `NEXT_PUBLIC_API_URL` (domínio real da API)
