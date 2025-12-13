# API Documentation - PostmanLocal Backend

Tài liệu này mô tả tất cả API endpoints của Laravel backend.

## Base URL

```
http://localhost:8000/api
```

Production: `https://api.postmanlocal.com/api`

## Authentication

Tất cả protected endpoints yêu cầu Bearer token trong header:

```
Authorization: Bearer {access_token}
```

### Token Refresh

Access tokens expire sau 1 hour. Sử dụng refresh token để lấy access token mới:

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```

Response:
```json
{
  "token": "new_access_token",
  "refresh_token": "new_refresh_token",
  "expires_at": "2025-12-13T10:00:00Z"
}
```

## Endpoints

### Authentication

#### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Validation:**
- `name`: required, string, max:255, alphanumeric + spaces
- `email`: required, email, unique
- `password`: required, min:8, must contain uppercase, lowercase, and number

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "access_token",
  "refresh_token": "refresh_token",
  "expires_at": "2025-12-13T10:00:00Z"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:** Same as register

#### Get Current User

```http
GET /api/auth/user
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### Logout

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Collections

#### List Collections

```http
GET /api/collections?page=1&per_page=15
Authorization: Bearer {token}
```

**Query Parameters:**
- `page`: Page number (optional)
- `per_page`: Items per page (1-100, default: 15)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "My Collection",
      "description": "Collection description",
      "data": {},
      "user_id": 1,
      "workspace_id": null,
      "is_shared": false,
      "created_at": "2025-12-13T08:00:00Z",
      "updated_at": "2025-12-13T08:00:00Z"
    }
  ],
  "current_page": 1,
  "per_page": 15,
  "total": 1
}
```

#### Create Collection

```http
POST /api/collections
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Collection",
  "description": "Description",
  "data": {}
}
```

#### Get Collection

```http
GET /api/collections/{id}
Authorization: Bearer {token}
```

**Response:** Collection với relationships (user, workspace, shares)

#### Update Collection

```http
PUT /api/collections/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### Delete Collection

```http
DELETE /api/collections/{id}
Authorization: Bearer {token}
```

#### Sync Collections

```http
POST /api/collections/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "collections": [
    {
      "name": "Collection 1",
      "description": "Description",
      "data": {}
    }
  ]
}
```

**Response:**
```json
{
  "collections": [
    {
      "id": 1,
      "name": "Collection 1",
      ...
    }
  ]
}
```

#### Share Collection

```http
POST /api/collections/{id}/share
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "user@example.com",
  "permission": "read"
}
```

**Permissions:** `read`, `write`, `admin`

#### Get Shared Collections

```http
GET /api/collections/shared?page=1&per_page=15
Authorization: Bearer {token}
```

#### Update Share Permission

```http
PUT /api/collections/{id}/permission
Authorization: Bearer {token}
Content-Type: application/json

{
  "shareId": 1,
  "permission": "write"
}
```

#### Unshare Collection

```http
DELETE /api/collections/{id}/share/{shareId}
Authorization: Bearer {token}
```

### Collection Versions

#### List Versions

```http
GET /api/collections/{id}/versions?page=1&per_page=15
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "collection_id": 1,
      "version_number": 1,
      "data": {},
      "description": "Version description",
      "created_by_id": 1,
      "created_at": "2025-12-13T08:00:00Z"
    }
  ]
}
```

#### Create Version

```http
POST /api/collections/{id}/versions
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Version description"
}
```

#### Get Version

```http
GET /api/collections/{id}/versions/{versionId}
Authorization: Bearer {token}
```

#### Restore Version

```http
POST /api/collections/{id}/restore/{versionId}
Authorization: Bearer {token}
```

### Workspaces

#### List Workspaces

```http
GET /api/workspaces?page=1&per_page=15
Authorization: Bearer {token}
```

#### Create Workspace

```http
POST /api/workspaces
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My Workspace",
  "description": "Workspace description",
  "is_team": true
}
```

#### Get Workspace

```http
GET /api/workspaces/{id}
Authorization: Bearer {token}
```

#### Update Workspace

```http
PUT /api/workspaces/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### Delete Workspace

```http
DELETE /api/workspaces/{id}
Authorization: Bearer {token}
```

#### Invite Member

```http
POST /api/workspaces/{id}/invite
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "member"
}
```

**Roles:** `admin`, `member`, `viewer`

#### Remove Member

```http
DELETE /api/workspaces/{id}/members/{userId}
Authorization: Bearer {token}
```

### Comments

#### List Comments

```http
GET /api/collections/{collectionId}/comments?page=1&per_page=15
Authorization: Bearer {token}
```

#### Create Comment

```http
POST /api/collections/{collectionId}/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Comment text",
  "request_id": null,
  "parent_id": null
}
```

#### Update Comment

```http
PUT /api/comments/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Updated comment"
}
```

#### Delete Comment

```http
DELETE /api/comments/{id}
Authorization: Bearer {token}
```

### Annotations

#### List Annotations

```http
GET /api/requests/{requestId}/annotations
Authorization: Bearer {token}
```

#### Create Annotation

```http
POST /api/requests/{requestId}/annotations
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "note",
  "content": "Annotation content",
  "position": {"x": 100, "y": 200}
}
```

#### Delete Annotation

```http
DELETE /api/annotations/{id}
Authorization: Bearer {token}
```

### Environments

#### List Environments

```http
GET /api/environments
Authorization: Bearer {token}
```

#### Create Environment

```http
POST /api/environments
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Development",
  "variables": {
    "api_url": "https://api.dev.example.com",
    "api_key": "dev_key"
  }
}
```

#### Sync Environments

```http
POST /api/environments/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "environments": [...]
}
```

### Schemas

#### List Schemas

```http
GET /api/schemas
Authorization: Bearer {token}
```

#### Create Schema

```http
POST /api/schemas
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "API Schema",
  "content": {...}
}
```

#### Sync Schemas

```http
POST /api/schemas/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "schemas": [...]
}
```

### Sync

#### Sync All

```http
POST /api/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "collections": [...],
  "environments": [...],
  "schemas": [...]
}
```

**Response:**
```json
{
  "collections": [...],
  "environments": [...],
  "schemas": [...]
}
```

### Notifications

#### List Notifications

```http
GET /api/notifications?page=1&per_page=15
Authorization: Bearer {token}
```

#### Get Unread Notifications

```http
GET /api/notifications/unread
Authorization: Bearer {token}
```

#### Mark as Read

```http
PUT /api/notifications/{id}/read
Authorization: Bearer {token}
```

#### Mark All as Read

```http
PUT /api/notifications/read-all
Authorization: Bearer {token}
```

### Activity Logs

#### List Activities

```http
GET /api/activities?page=1&per_page=15
Authorization: Bearer {token}
```

#### Workspace Activities

```http
GET /api/workspaces/{id}/activities?page=1&per_page=15
Authorization: Bearer {token}
```

#### Collection Activities

```http
GET /api/collections/{id}/activities?page=1&per_page=15
Authorization: Bearer {token}
```

## Error Responses

### Standard Error Format

```json
{
  "message": "Error message",
  "errors": {
    "field": ["Error message"]
  }
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Server Error

## Rate Limiting

API endpoints có rate limiting:
- **Authentication**: 5 requests/minute
- **General API**: 60 requests/minute

Response headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1638360000
```

## Pagination

Tất cả list endpoints hỗ trợ pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Items per page (1-100, default: 15)

**Response Format:**
```json
{
  "data": [...],
  "current_page": 1,
  "per_page": 15,
  "total": 100,
  "last_page": 7,
  "from": 1,
  "to": 15
}
```

## Caching

Một số endpoints được cache:
- Collections list: 5 minutes
- Workspaces list: 5 minutes
- Comments: 1 minute

Cache được invalidate khi data thay đổi.
