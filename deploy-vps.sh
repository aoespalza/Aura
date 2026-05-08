#!/bin/bash
# deploy-vps.sh — Aura en VPS
# Ubuntu 22.04 | PostgreSQL | Node 20 | PM2 + Nginx
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

APP_DIR="/var/www/aura"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
BACKUP_FILE="/tmp/aura_backup_$(date +%Y%m%d_%H%M%S).sql"
DB_NAME="aura_db"
DB_USER="aura_user"
DB_PASS="aura123"

echo "========================================================"
echo "  Aura — Despliegue $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================================"

# ── 1. Backup DB ─────────────────────────────────────────────
info "Respaldando base de datos..."
PGPASSWORD=$DB_PASS pg_dump -U $DB_USER -h localhost $DB_NAME > "$BACKUP_FILE" 2>/dev/null || true
info "Backup: $BACKUP_FILE"

# ── 2. Detener backend ────────────────────────────────────────
info "Deteniendo backend..."
pm2 stop aura-backend 2>/dev/null || true
sleep 1

# ── 3. Git pull ───────────────────────────────────────────────
info "Actualizando código..."
mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/master
else
  git clone https://github.com/aoespalza/aura.git "$APP_DIR"
  cd "$APP_DIR"
fi
info "Código: $(git log --oneline -1)"

# ── 4. DB: crear si no existe ────────────────────────────────
info "Verificando base de datos..."
if ! PGPASSWORD=$DB_PASS psql -U $DB_USER -h localhost -d $DB_NAME -c '\q' 2>/dev/null; then
  warn "Creando DB y usuario..."
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
fi

# ── 5. Backend ────────────────────────────────────────────────
info "Instalando dependencias del backend..."
cd "$BACKEND_DIR"
npm install --prefer-offline 2>/dev/null || npm install

info "Generando Prisma Client..."
export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"
npx prisma generate

info "Ejecutando migraciones..."
npx prisma migrate deploy 2>&1 || warn "Migraciones: verifica manualmente"

info "Compilando backend..."
npm run build

# ── 6. Frontend ───────────────────────────────────────────────
info "Instalando dependencias del frontend..."
cd "$FRONTEND_DIR"
npm install --prefer-offline 2>/dev/null || npm install

info "Compilando frontend..."
VITE_API_URL="" npm run build

# ── 7. Nginx ──────────────────────────────────────────────────
info "Configurando Nginx..."
cat > /etc/nginx/conf.d/aura.conf << 'NGINX'
server {
    listen 5177;
    server_name _;
    root /var/www/aura/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3007/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX

nginx -t && systemctl reload nginx
info "Nginx OK (puerto 5177)"

# ── 8. PM2 ───────────────────────────────────────────────────
info "Iniciando backend con PM2..."
cd "$BACKEND_DIR"
command -v pm2 &>/dev/null || npm install -g pm2

# Escribir .env de producción
cat > "$BACKEND_DIR/.env" << EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public
JWT_SECRET=aura-super-secret-2026
JWT_EXPIRES_IN=30d
PORT=3007
NODE_ENV=production
EOF

pm2 delete aura-backend 2>/dev/null || true
pm2 start dist/index.js --name aura-backend

pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | grep "sudo" | bash 2>/dev/null || true

# ── 9. Verificación ──────────────────────────────────────────
sleep 4
echo ""
echo "========================================================"
echo "  Verificación"
echo "========================================================"

if pm2 list | grep -q aura-backend; then
  info "✓ Backend corriendo (PM2)"
else
  error "✗ Backend no está corriendo — revisar: pm2 logs aura-backend"
fi

if curl -s http://localhost:3007/api/health > /dev/null 2>&1; then
  info "✓ Health check OK"
else
  warn "⚠ Health check no responde aún (puede tardar)"
fi

SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "========================================================"
echo "  Despliegue completado"
echo "  App:    http://$SERVER_IP:5177"
echo "  Backup: $BACKUP_FILE"
echo "========================================================"
