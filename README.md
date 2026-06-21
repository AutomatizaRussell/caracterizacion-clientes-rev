1. Comando completo: levantar producción
cd /home/rev/plataforma-revisoria

docker compose \
  -p plataforma-revisoria \
  -f docker-compose.yml \
  -f docker-compose.dev.yml \
  up -d postgres

docker rm -f revisoria-prod-test 2>/dev/null || true

docker run -d \
  --name revisoria-prod-test \
  --network plataforma-revisoria_caracterizacion_net \
  -p 127.0.0.1:3010:3000 \
  --env-file .env \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3010 \
  -e APP_BASE_URL=http://localhost:3010 \
  plataforma-revisoria-prod:test

docker logs -f revisoria-prod-test

2. Comando completo: reconstruir y levantar producción
Cuando cambies código:
cd /home/rev/plataforma-revisoria

docker build \
  -t plataforma-revisoria-prod:test \
  .

docker compose \
  -p plataforma-revisoria \
  -f docker-compose.yml \
  -f docker-compose.dev.yml \
  up -d postgres

docker rm -f revisoria-prod-test 2>/dev/null || true

docker run -d \
  --name revisoria-prod-test \
  --network plataforma-revisoria_caracterizacion_net \
  -p 127.0.0.1:3010:3000 \
  --env-file .env \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3010 \
  -e APP_BASE_URL=http://localhost:3010 \
  plataforma-revisoria-prod:test

  
docker logs -f revisoria-prod-test


3. Comando completo: bajar producción
Solo app:
docker rm -f revisoria-prod-test

App + PostgreSQL + red:
cd /home/rev/plataforma-revisoria

docker rm -f revisoria-prod-test 2>/dev/null || true

docker compose \
  -p plataforma-revisoria \
  -f docker-compose.yml \
  -f docker-compose.dev.yml \
  down --remove-orphans