# Laravel Task Management

Aplikasi manajemen tugas lengkap dengan fitur real-time notifications, background jobs, dan WebSocket support. Built with Laravel 11 + React + TypeScript.

[![Watch the video](https://img.youtube.com/vi/Prxsve7vSNw/maxresdefault.jpg)](https://www.youtube.com/watch?v=Prxsve7vSNw)

## 🚀 Fitur Utama

- **Task Management**: CRUD tugas dengan attachment dan komentar
- **Real-time Notifications**: Notifikasi instan via WebSocket (Laravel Reverb)
- **Background Jobs**: Export CSV dan bulk update via queue
- **Role-based Access**: Admin dan User roles
- **UI**: React + TypeScript + Tailwind CSS + shadcn/ui

## 🏗️ Tech Stack

### Backend
- Laravel (PHP 8.4)
- PostgreSQL
- Laravel Reverb (WebSocket)
- Queue Workers (Database driver)

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (React Query)
- Zustand (state management)
- Tailwind CSS + shadcn/ui
- Pusher.js (WebSocket client)

### DevOps
- Docker + Docker Compose
- Makefile (automation)

## 📋 Prerequisites

- Docker Desktop (Mac/Windows) atau Docker Engine + Compose (Linux)
- Git
- Port yang perlu tersedia: 5173 (frontend dev), 8000 (backend), 5432 (PostgreSQL), 8080 (WebSocket)

## 🚀 Quick Start (Development)

### 1. Clone Repository

```bash
git clone https://github.com/livingdolls/laravel-task-management.git
cd laravel-task-management
```

### 2. Jalankan Development Server

```bash
make dev
```

Command ini akan:
- Build dan start semua container (PostgreSQL, Laravel Backend, React Frontend)
- Install dependencies otomatis
- Run migrations + seed database
- Start queue worker dan WebSocket server

### 3. Akses Aplikasi

| Service | URL | Keterangan |
|---------|-----|------------|
| Frontend | http://localhost:5173 | React dev server dengan HMR |
| Backend API | http://localhost:8000 | Laravel API endpoint |
| WebSocket | ws://localhost:8080 | Real-time connection |

### 4. Default Login

admin@example.com / password
manager1@example.com / password
user1@example.com / password

## 🛠️ Makefile Commands

```bash
# Development
make dev              # Start all services
make dev-build        # Rebuild and start
make dev-down         # Stop all services
make dev-down-clean   # Stop + remove volumes (reset database)
make dev-logs         # Tail logs

# Shell Access
make dev-shell-backend   # Bash ke backend container
make dev-shell-frontend  # Shell ke frontend container
make dev-shell-db        # PostgreSQL CLI

# Database
make dev-migrate      # Run migrations
make dev-seed         # Run seeders

Full API documentation: lihat `docs/API.md`

## 🗄️ Database Schema

Lihat `docs/DATABASE.md` untuk detail lengkap schema database.

## 🚢 Deployment

Lihat `docs/DEPLOYMENT.md` untuk panduan deployment


## 📚 Dokumentasi Lengkap

- [API Documentation](docs/API.md) - Endpoint details & examples
- [Database Schema](docs/DATABASE.md) - table descriptions
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment setup# laravel-task-management
