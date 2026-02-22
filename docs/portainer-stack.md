# Portainer Stack (.yaml) - PostgreSQL Persistente

```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    container_name: havyapp_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-dinofit}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-dinofitpass}
      POSTGRES_DB: ${POSTGRES_DB:-dinofit}
    volumes:
      - havyapp_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-dinofit} -d ${POSTGRES_DB:-dinofit}"]
      interval: 10s
      timeout: 5s
      retries: 12

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: havyapp_app
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "${APP_PORT:-18743}:3001"
    environment:
      NODE_ENV: production
      PORT: 3001
      STATIC_DIR: /app/public
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost:18743}
      DATABASE_URL: postgresql://${POSTGRES_USER:-dinofit}:${POSTGRES_PASSWORD:-dinofitpass}@db:5432/${POSTGRES_DB:-dinofit}
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 20s
    networks:
      - havyapp_net

networks:
  havyapp_net:
    driver: bridge

volumes:
  havyapp_pgdata:
```
