# Database Schema Documentation
---

## 📋 Tables

### 1. users

Menyimpan data user aplikasi.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto-increment | ID unik user |
| name | varchar(255) | not null | Nama user |
| email | varchar(255) | unique, not null | Email login |
| password | varchar(255) | not null | Password hash (bcrypt) |
| role | varchar(50) | default 'user' | Role: 'admin' atau 'user' |
| email_verified_at | timestamp | nullable | Waktu verifikasi email |
| remember_token | varchar(100) | nullable | Token remember me |
| created_at | timestamp | nullable | Timestamp dibuat |
| updated_at | timestamp | nullable | Timestamp diupdate |

**Indexes:**
- Primary: `id`
- Unique: `email`

**Relations:**
- One-to-Many: `tasks` (as assigned_user, created_by)
- One-to-Many: `notifications`
- One-to-Many: `task_comments`
- One-to-Many: `job_statuses`

---

### 2. tasks

Menyimpan data task/tugas.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto-increment | ID unik task |
| title | varchar(255) | not null | Judul task |
| description | text | nullable | Deskripsi detail |
| status | varchar(50) | default 'pending' | Status: pending, in_progress, completed, cancelled |
| priority | varchar(50) | default 'medium' | Priority: low, medium, high, urgent |
| assigned_to | bigint | FK → users.id, nullable | User yang di-assign |
| created_by | bigint | FK → users.id, not null | User pembuat task |
| due_date | date | nullable | Deadline task |
| created_at | timestamp | nullable | Timestamp dibuat |
| updated_at | timestamp | nullable | Timestamp diupdate |

**Indexes:**
- Primary: `id`
- Index: `status`
- Index: `priority`
- Index: `assigned_to`
- Index: `created_by`
- Index: `due_date`

**Relations:**
- BelongsTo: `users` (assigned_to)
- BelongsTo: `users` (created_by)
- HasMany: `task_attachments`
- HasMany: `task_comments`

---

### 3. task_attachments

Menyimpan file attachments untuk task.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto-increment | ID unik attachment |
| task_id | bigint | FK → tasks.id, not null | Task yang punya file |
| filename | varchar(255) | not null | Nama file di storage |
| original_name | varchar(255) | not null | Nama file asli upload |
| mime_type | varchar(100) | not null | MIME type file |
| size | integer | not null | Ukuran file (bytes) |
| path | varchar(500) | not null | Path file di storage |
| uploaded_by | bigint | FK → users.id, not null | User yang upload |
| created_at | timestamp | nullable | Timestamp upload |

**Indexes:**
- Primary: `id`
- Index: `task_id`

**Relations:**
- BelongsTo: `tasks`
- BelongsTo: `users` (uploaded_by)

---

### 4. task_comments

Menyimpan komentar pada task.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto-increment | ID unik komentar |
| task_id | bigint | FK → tasks.id, not null | Task yang dikomentari |
| user_id | bigint | FK → users.id, not null | User yang berkomentar |
| content | text | not null | Isi komentar |
| created_at | timestamp | nullable | Timestamp dibuat |
| updated_at | timestamp | nullable | Timestamp diupdate |

**Indexes:**
- Primary: `id`
- Index: `task_id`

**Relations:**
- BelongsTo: `tasks`
- BelongsTo: `users`

---

### 5. notifications

Menyimpan notifikasi user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto-increment | ID unik notifikasi |
| user_id | bigint | FK → users.id, not null | User penerima |
| type | varchar(100) | not null | Tipe: task_assigned, task_completed, dll |
| title | varchar(255) | not null | Judul notifikasi |
| message | text | not null | Pesan notifikasi |
| data | json | nullable | Data tambahan (task_id, dll) |
| read_at | timestamp | nullable | Waktu dibaca |
| created_at | timestamp | nullable | Timestamp dibuat |

**Indexes:**
- Primary: `id`
- Index: `user_id`
- Index: `read_at` (untuk query unread)
- Index: `created_at` (untuk sorting)

**Relations:**
- BelongsTo: `users`

---

### 6. job_statuses

Menyimpan status background jobs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK, auto-increment | ID unik job |
| user_id | bigint | FK → users.id, not null | User yang request job |
| type | varchar(100) | not null | Tipe: export_tasks, bulk_update |
| status | varchar(50) | default 'pending' | Status: pending, processing, completed, failed |
| payload | json | nullable | Parameter job |
| result | json | nullable | Hasil job (file path, count, dll) |
| progress | integer | default 0 | Progress 0-100% |
| error_message | text | nullable | Pesan error jika failed |
| created_at | timestamp | nullable | Timestamp dibuat |
| updated_at | timestamp | nullable | Timestamp diupdate |
| completed_at | timestamp | nullable | Timestamp selesai |

**Indexes:**
- Primary: `id`
- Index: `user_id`
- Index: `status`
- Index: `type`

**Relations:**
- BelongsTo: `users`

---

### 7. personal_access_tokens (Laravel Sanctum)

Table bawaan Laravel Sanctum untuk API tokens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PK | ID token |
| tokenable_type | varchar(255) | not null | Model type (App\Models\User) |
| tokenable_id | bigint | not null | User ID |
| name | varchar(255) | not null | Nama token |
| token | varchar(64) | unique | Token hash |
| abilities | text | nullable | Abilities (JSON) |
| last_used_at | timestamp | nullable | Last used timestamp |
| expires_at | timestamp | nullable | Expiry timestamp |
| created_at | timestamp | nullable | |
| updated_at | timestamp | nullable | |
