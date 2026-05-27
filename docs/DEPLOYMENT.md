# Panduan Deployment (Development)

Panduan menjalankan aplikasi Laravel Task Management di environment development menggunakan Docker.

---

## 📋 Prerequisites

Pastikan sudah terinstall di laptop/komputer:

- **Docker Desktop** (Mac/Windows) atau Docker Engine + Compose (Linux)
  - Download: https://www.docker.com/products/docker-desktop
- **Git**
  - Download: https://git-scm.com/downloads
- **Make** (opsional tapi recommended)
  - Mac: `xcode-select --install`
  - Windows: Install Git Bash atau WSL
  - Linux: `sudo apt install make`

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/livingdolls/laravel-task-management.git
cd laravel-task-management
```

### 2. Jalankan Aplikasi

```bash
make dev
```

Command ini akan:
- Download Docker images (PostgreSQL, PHP, Node)
- Install PHP dependencies (Composer)
- Install Node dependencies (npm)
- Run database migrations
- Seed database dengan data dummy
- Start queue worker
- Start WebSocket server (Reverb)
- Start development servers

**Tunggu sampai semua service running** (biasanya 2-3 menit pertama kali).

### 3. Akses Aplikasi

| Service | URL | Keterangan |
|---------|-----|------------|
| Frontend | http://localhost:5173 | React dev server dengan Hot Module Replacement (HMR) |
| Backend API | http://localhost:8000 | Laravel API |
| WebSocket | ws://localhost:8080 | Real-time notifications |

### 4. Login Default

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password | Admin |
| user@example.com | password | User |

---

## 🛠️ Makefile Commands

```bash
# Start development
make dev

# Rebuild containers (kalau ada perubahan Dockerfile)
make dev-build

# Stop semua services
make dev-down

# Stop + hapus database (reset total)
make dev-down-clean

# Lihat logs
make dev-logs

# Shell access ke container
make dev-shell-backend    # Bash ke backend
make dev-shell-frontend   # Shell ke frontend
make dev-shell-db         # PostgreSQL CLI

# Database commands
make dev-migrate    # Run migrations
make dev-seed       # Run seeders
```

---

## 🔧 Environment Variables

File environment sudah di-setup otomatis via Docker. Tapi kalau mau customize, bisa edit:

### Backend (`backend-test/.env`)
```env
# Database
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=backendtest
DB_USERNAME=takahashi
DB_PASSWORD=yourpassword

# Queue
QUEUE_CONNECTION=database

# WebSocket
REVERB_APP_KEY=my-app-key
REVERB_APP_SECRET=my-app-secret
REVERB_HOST=0.0.0.0
REVERB_PORT=8080
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000/api
VITE_REVERB_APP_KEY=my-app-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
```

**Catatan:** Kalau edit `.env`, restart container dengan `make dev-down && make dev`

---

## 🐛 Troubleshooting

### Masalah 1: Port sudah dipakai

Error: `port is already allocated`

**Solusi:**
```bash
# Cek apa yang pakai port
lsof -i :5173  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # PostgreSQL

# Kill process atau gunakan port berbeda
# Edit docker-compose.dev.yml, ubah ports mapping
```

### Masalah 2: "npm: not found"

**Solusi:**
```bash
make dev-down
make dev-build
make dev
```

### Masalah 3: Database connection error

**Solusi:**
```bash
# Reset total (hapus semua data)
make dev-down-clean
make dev
```

### Masalah 4: Permission denied saat upload file

**Solusi:**
```bash
# Di terminal lain, jalankan:
docker exec -it laravel_backend_dev bash
chown -R www-data:www-data /var/www/html/storage
chmod -R 775 /var/www/html/storage
exit
```

### Masalah 5: WebSocket tidak connect

**Cek:**
1. Port 8080 tidak dipakai aplikasi lain
2. Browser console tidak ada error CORS
3. Restart: `make dev-down && make dev`

---

## 🔌 Development Workflow


### Database Changes

**Buat migration baru:**
```bash
make dev-shell-backend
php artisan make:migration create_new_table
exit
```

**Jalankan migration:**
```bash
make dev-migrate
# atau otomatis saat restart (karena pakai migrate:fresh --seed)
```

### View Logs

```bash
# Semua services
make dev-logs

# Spesifik container
docker logs -f laravel_backend_dev
docker logs -f vite_frontend_dev
docker logs -f postgres_db_dev
```

---

## 💾 Database

### Access PostgreSQL CLI

```bash
make dev-shell-db
```

### Backup Database

```bash
# Dari host machine
docker exec postgres_db_dev pg_dump -U takahashi backendtest > backup.sql
```

### Restore Database

```bash
docker exec -i postgres_db_dev psql -U takahashi backendtest < backup.sql
```