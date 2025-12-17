/**
 * Workspace Type Definitions
 * Centralized type definitions cho workspace entities
 */

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Workspace types
export interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  user?: User;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_team: boolean;
  owner?: User;
  team_members?: TeamMember[];
  created_at?: string;
  updated_at?: string;
}

// Collection types
export interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  queryParams?: Array<{ key: string; value: string; enabled: boolean }>;
  folderId?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: Request[];
  is_shared?: boolean;
  permission?: 'read' | 'write' | 'admin';
  is_default?: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Task types
export interface Task {
  id: string;
  collection_id: string;
  request_id?: string;
  title: string;
  description?: string;
  assigned_to?: string;
  created_by: string;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_user?: User;
  creator?: User;
  collection?: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

// Discussion types
export interface DiscussionReply {
  id: string;
  discussion_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Discussion {
  id: string;
  collection_id: string;
  title: string;
  content: string;
  created_by: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  creator?: User;
  resolver?: User;
  replies?: DiscussionReply[];
}

// Activity types
export interface ActivityLog {
  id: string;
  collection_id?: string;
  user_id: string;
  action: 'created' | 'updated' | 'deleted' | 'shared' | 'commented' | 'annotated' | string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  user?: User;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read_at?: string;
  created_at: string;
}

// Analytics types
export interface WorkspaceAnalytics {
  total_collections: number;
  total_requests: number;
  total_members: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  recent_activities?: ActivityLog[];
  collections_by_status?: Record<string, number>;
  requests_by_method?: Record<string, number>;
}

// API Design Review types
export interface ApiDesignReview {
  id: string;
  schema_id: string;
  collection_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments?: string;
  requester?: User;
  reviewer?: User;
  schema?: {
    id: string;
    name: string;
  };
  created_at: string;
  reviewed_at?: string;
}

// Request Review types
export interface RequestReview {
  id: string;
  request_id: string;
  collection_id: string;
  reviewer_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments?: string;
  reviewed_at?: string;
  created_at: string;
  reviewer?: User;
  request?: {
    id: string;
    name: string;
    method: string;
    url: string;
  };
}

// Template types (không còn workspace)
export interface CollectionTemplate {
  id: string;
  name: string;
  description?: string;
  collection_id: string;
  created_at: string;
  updated_at: string;
}

// Form types
export interface CreateCollectionFormData {
  name: string;
  description?: string;
}

export interface CreateTaskFormData {
  title: string;
  description?: string;
  collection_id?: string;
  request_id?: string;
  assigned_to?: string;
  priority: Task['priority'];
  due_date?: string;
}

export interface CreateDiscussionFormData {
  title: string;
  content: string;
}

// Filter types
export interface TaskFilters {
  status?: Task['status'];
  priority?: Task['priority'];
  assigned_to?: string;
}

export interface DiscussionFilters {
  resolved?: boolean;
  created_by?: string;
}

export interface ActivityFilters {
  collection_id?: string;
  user_id?: string;
  action?: string;
  entity_type?: string;
  limit?: number;
  offset?: number;
}

// WebSocket event types
export interface WebSocketEvent {
  type: string;
  data: unknown;
  timestamp?: string;
}

export interface CollectionWebSocketEvent extends WebSocketEvent {
  collection_id: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
}
