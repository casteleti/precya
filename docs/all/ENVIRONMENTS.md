# Deployment Environments — DAKSA MVP

## 3 Ambientes

### Development
- Local Docker
- Hot reload
- Debug logging

### Staging
- Pre-prod
- Backup diário
- HTTPS real

### Production
- Hetzner VPS (167.233.105.48)
- Backup 6h
- Monitoring 24/7
- Alertas de erro

## Deploy

```bash
# Staging
git push origin staging  # CI/CD automático

# Production  
git push origin main    # CI/CD + manual approval
```

---

**Última atualização:** Junho 2026
