# Development Commands
.PHONY: dev dev-build dev-down dev-logs dev-shell-backend dev-shell-frontend

dev:
	docker-compose -f docker-compose.dev.yml up

dev-build:
	docker-compose -f docker-compose.dev.yml up --build

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-down-clean:
	docker-compose -f docker-compose.dev.yml down -v

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-shell-backend:
	docker-compose -f docker-compose.dev.yml exec backend bash

dev-shell-frontend:
	docker-compose -f docker-compose.dev.yml exec frontend sh

dev-shell-db:
	docker-compose -f docker-compose.dev.yml exec db psql -U takahashi -d backendtest

dev-migrate:
	docker-compose -f docker-compose.dev.yml exec backend php artisan migrate

dev-seed:
	docker-compose -f docker-compose.dev.yml exec backend php artisan db:seed

dev-cache-clear:
	docker-compose -f docker-compose.dev.yml exec backend php artisan cache:clear

dev-optimize:
	docker-compose -f docker-compose.dev.yml exec backend php artisan optimize:clear

dev-restart-backend:
	docker-compose -f docker-compose.dev.yml restart backend

dev-restart-frontend:
	docker-compose -f docker-compose.dev.yml restart frontend
