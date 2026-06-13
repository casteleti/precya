.PHONY: help setup dev dev-logs test lint build deploy backup clean

help:
	@echo "Comandos disponíveis:"
	@echo "  make setup      - Primeira vez (instala deps, cria .env, sobe containers)"
	@echo "  make dev        - Inicia desenvolvimento"
	@echo "  make dev-logs   - Logs em tempo real"
	@echo "  make test       - Roda testes"
	@echo "  make lint       - Checa código"
	@echo "  make build      - Build produção"
	@echo "  make deploy     - Deploy em VPS"
	@echo "  make backup     - Backup do banco"
	@echo "  make clean      - Remove containers e imagens"

setup:
	bash scripts/setup.sh

dev:
	docker-compose up

dev-logs:
	docker-compose logs -f

test:
	cd app/backend && npm test

lint:
	cd app/frontend && npm run lint
	cd app/backend && npm run lint

build:
	docker-compose build

deploy:
	bash scripts/deploy.sh

backup:
	bash scripts/backup.sh

clean:
	docker-compose down
	docker system prune -f
