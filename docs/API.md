# API Documentation

Dokumentasi lengkap API endpoints untuk Laravel Task Management.

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8000/api` |

## Authentication

Semua endpoint (kecuali auth) memerlukan Bearer token di header:

```
Authorization: Bearer {token}
```

Token didapatkan dari login response.

---

## 🔐 Authentication Endpoints

### Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response (200):**
```json
{
  "access_token": "1|laravel_sanctum_token...",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "created_at": "2024-01-15T00:00:00.000000Z",
    "updated_at": "2024-01-15T00:00:00.000000Z"
  }
}
```

### Register
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password",
  "password_confirmation": "password"
}
```

**Response (201):**
```json
{
  "access_token": "2|laravel_sanctum_token...",
  "token_type": "Bearer",
  "user": {
    "id": 3,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2024-01-15T10:30:00.000000Z",
    "updated_at": "2024-01-15T10:30:00.000000Z"
  }
}
```

### Logout
```
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### Get Current User
```
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin",
    "created_at": "2024-01-15T00:00:00.000000Z",
    "updated_at": "2024-01-15T00:00:00.000000Z"
  }
}
```

---

## 📋 Task Endpoints

### List Tasks
```
GET /api/tasks
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `pending`, `in_progress`, `completed`, `cancelled` |
| `priority` | string | Filter by priority: `low`, `medium`, `high`, `urgent` |
| `assigned_to` | integer | Filter by assigned user ID |
| `search` | string | Search by title/description |
| `sort_by` | string | Sort column: `created_at`, `due_date`, `priority` |
| `sort_order` | string | Sort direction: `asc`, `desc` |
| `page` | integer | Page number for pagination |
| `per_page` | integer | Items per page (default: 10) |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Implement login feature",
      "description": "Create login page with validation",
      "status": "in_progress",
      "priority": "high",
      "assigned_to": 2,
      "created_by": 1,
      "due_date": "2024-01-20",
      "created_at": "2024-01-15T08:00:00.000000Z",
      "updated_at": "2024-01-15T08:00:00.000000Z",
      "assigned_user": {
        "id": 2,
        "name": "Regular User",
        "email": "user@example.com"
      },
      "creator": {
        "id": 1,
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "attachments": [
        {
          "id": 1,
          "filename": "mockup.png",
          "original_name": "login-mockup.png",
          "mime_type": "image/png",
          "size": 1024567,
          "url": "/storage/attachments/mockup.png"
        }
      ],
      "comments": [
        {
          "id": 1,
          "content": "Please use JWT for auth",
          "user_id": 1,
          "created_at": "2024-01-15T09:00:00.000000Z",
          "user": {
            "id": 1,
            "name": "Admin User"
          }
        }
      ]
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 10,
    "total": 50
  }
}
```

### Create Task
```
POST /api/tasks
```

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "status": "pending",
  "priority": "medium",
  "assigned_to": 2,
  "due_date": "2024-02-01"
}
```

**Response (201):**
```json
{
  "message": "Task created successfully",
  "data": {
    "id": 10,
    "title": "New Task",
    "description": "Task description",
    "status": "pending",
    "priority": "medium",
    "assigned_to": 2,
    "created_by": 1,
    "due_date": "2024-02-01",
    "created_at": "2024-01-15T10:00:00.000000Z",
    "updated_at": "2024-01-15T10:00:00.000000Z"
  }
}
```

### Get Task Detail
```
GET /api/tasks/{id}
```

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "title": "Implement login feature",
    "description": "Create login page with validation",
    "status": "in_progress",
    "priority": "high",
    "assigned_to": 2,
    "created_by": 1,
    "due_date": "2024-01-20",
    "created_at": "2024-01-15T08:00:00.000000Z",
    "updated_at": "2024-01-15T08:00:00.000000Z",
    "assigned_user": { ... },
    "creator": { ... },
    "attachments": [ ... ],
    "comments": [ ... ]
  }
}
```

### Update Task
```
PUT /api/tasks/{id}
```

**Request Body:**
```json
{
  "title": "Updated Task Title",
  "description": "Updated description",
  "status": "completed",
  "priority": "high",
  "assigned_to": 3,
  "due_date": "2024-02-15"
}
```

**Response (200):**
```json
{
  "message": "Task updated successfully",
  "data": { ... }
}
```

### Delete Task
```
DELETE /api/tasks/{id}
```

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

### Add Comment
```
POST /api/tasks/{id}/comments
```

**Request Body:**
```json
{
  "content": "This task is almost done"
}
```

**Response (201):**
```json
{
  "message": "Comment added successfully",
  "data": {
    "id": 5,
    "content": "This task is almost done",
    "task_id": 1,
    "user_id": 1,
    "created_at": "2024-01-15T11:00:00.000000Z",
    "updated_at": "2024-01-15T11:00:00.000000Z",
    "user": {
      "id": 1,
      "name": "Admin User"
    }
  }
}
```

### Upload Attachment
```
POST /api/tasks/{id}/attachments
```

**Request Body (multipart/form-data):**
| Field | Type | Description |
|-------|------|-------------|
| `file` | file | File to upload (max 100MB) |

**Response (201):**
```json
{
  "message": "Attachment uploaded successfully",
  "data": {
    "id": 3,
    "filename": "document.pdf",
    "original_name": "project-specs.pdf",
    "mime_type": "application/pdf",
    "size": 2048567,
    "task_id": 1,
    "uploaded_by": 1,
    "url": "/storage/attachments/document.pdf",
    "created_at": "2024-01-15T11:30:00.000000Z"
  }
}
```

---

## ⚙️ Background Job Endpoints

### Export Tasks to CSV
```
POST /api/jobs/export
```

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response (202):**
```json
{
  "message": "Export job started",
  "job_id": 15
}
```

### Bulk Update Task Status
```
POST /api/jobs/bulk-update
```

**Request Body:**
```json
{
  "task_ids": [1, 2, 3, 4, 5],
  "status": "completed"
}
```

**Response (202):**
```json
{
  "message": "Bulk update job started",
  "job_id": 16
}
```

### Get Job Status
```
GET /api/jobs/{id}
```

**Response (200):**
```json
{
  "data": {
    "id": 15,
    "user_id": 1,
    "type": "export_tasks",
    "status": "completed",
    "progress": 100,
    "payload": {
      "status": "completed"
    },
    "result": {
      "file_path": "exports/tasks_export_1705312800.csv",
      "total_rows": 50
    },
    "error_message": null,
    "created_at": "2024-01-15T10:00:00.000000Z",
    "updated_at": "2024-01-15T10:00:15.000000Z",
    "completed_at": "2024-01-15T10:00:15.000000Z"
  }
}
```

**Status Values:**
- `pending` - Job queued, waiting to be processed
- `processing` - Job sedang dikerjakan
- `completed` - Job selesai sukses
- `failed` - Job gagal

### List User Jobs
```
GET /api/jobs
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `type` | string | Filter by type: `export_tasks`, `bulk_update` |
| `page` | integer | Page number |
| `per_page` | integer | Items per page |

**Response (200):**
```json
{
  "data": [
    {
      "id": 15,
      "type": "export_tasks",
      "status": "completed",
      "progress": 100,
      "created_at": "2024-01-15T10:00:00.000000Z",
      "completed_at": "2024-01-15T10:00:15.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 2,
    "per_page": 10,
    "total": 15
  }
}
```

### Download Export File
```
GET /api/jobs/{id}/download
```

**Response:** File download (CSV) atau JSON error jika job belum selesai.

---

## 🔔 Notification Endpoints

### Get Notifications
```
GET /api/notifications
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `unread_only` | boolean | Hanya tampilkan yang belum dibaca |
| `page` | integer | Page number |
| `per_page` | integer | Items per page |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "type": "task_assigned",
      "title": "New Task Assigned",
      "message": "You have been assigned to 'Implement login feature'",
      "data": {
        "task_id": 1,
        "task_title": "Implement login feature",
        "assigned_by": 1
      },
      "read_at": null,
      "created_at": "2024-01-15T09:00:00.000000Z"
    }
  ],
  "unread_count": 3,
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 20,
    "total": 3
  }
}
```

### Get Unread Count
```
GET /api/notifications/unread-count
```

**Response (200):**
```json
{
  "count": 3
}
```

### Mark as Read
```
POST /api/notifications/{id}/read
```

**Response (200):**
```json
{
  "message": "Notification marked as read"
}
```

### Mark All as Read
```
POST /api/notifications/mark-all-read
```

**Response (200):**
```json
{
  "message": "All notifications marked as read",
  "count": 3
}
```

---

## 📊 Enums & Constants

### Task Status
```php
'pending'      // Menunggu dikerjakan
'in_progress'  // Sedang dikerjakan
'completed'    // Selesai
'cancelled'    // Dibatalkan
```

### Task Priority
```php
'low'      // Rendah
'medium'   // Sedang
'high'     // Tinggi
'urgent'   // Mendesak
```

### User Role
```php
'admin'  // Administrator - bisa manage semua task
'user'   // User biasa - hanya task yang di-assign ke dia
```

### Job Types
```php
'export_tasks'   // Export task ke CSV
'bulk_update'    // Bulk update status task
```

### Job Status
```php
'pending'     // Menunggu queue
'processing'  // Sedang diproses
'completed'   // Sukses
'failed'      // Gagal
```

---

## 🔌 WebSocket Events

Aplikasi menggunakan Laravel Reverb untuk real-time updates.

### Connection Details
```
Host: ws://localhost:8080 (dev)
App Key: my-app-key
```

### Channels

#### Private User Channel
```
private-users.{userId}
```

### Events

#### Notification Created
```javascript
{
  "event": "notification.created",
  "data": {
    "id": 1,
    "type": "task_assigned",
    "title": "New Task Assigned",
    "message": "You have been assigned...",
    "data": {
      "task_id": 1,
      "task_title": "...",
      "assigned_by": 1
    }
  }
}
```

---

## ❌ Error Responses

### Format
```json
{
  "message": "Error description",
  "errors": {
    "field_name": ["Error message"]
  }
}
```

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | OK - Request sukses |
| 201 | Created - Resource berhasil dibuat |
| 202 | Accepted - Job queued |
| 400 | Bad Request - Validasi gagal |
| 401 | Unauthorized - Token invalid/missing |
| 403 | Forbidden - Tidak punya permission |
| 404 | Not Found - Resource tidak ditemukan |
| 422 | Unprocessable Entity - Validasi error |
| 500 | Server Error |

### Common Errors

**401 Unauthorized:**
```json
{
  "message": "Unauthenticated."
}
```

**422 Validation Error:**
```json
{
  "message": "The email field is required.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password field is required."]
  }
}
```

**404 Not Found:**
```json
{
  "message": "Task not found"
}
```

---

## 📝 Postman Collection

Import file `docs/postman-collection.json` ke Postman untuk testing API.

Atau gunakan cURL examples di atas.
