/**
 * API Design Review Service
 * Service để tương tác với API design review endpoints
 */

import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface ApiDesignReview {
  id: string;
  schema_id: string;
  workspace_id: string;
  requested_by: string;
  reviewer_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  comments?: string;
  created_at: string;
  updated_at: string;
  schema?: {
    id: string;
    name: string;
  };
  requester?: {
    id: string;
    name: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface RequestReviewData {
  reviewer_id: string;
  comments?: string;
}

/**
 * Yêu cầu review cho schema
 */
export async function requestSchemaReview(schemaId: string, data: RequestReviewData): Promise<ApiDesignReview> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/schemas/${schemaId}/request-review`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to request schema review');
  }

  return await response.json();
}

/**
 * Lấy danh sách design reviews trong workspace
 */
export async function getWorkspaceDesignReviews(workspaceId: string): Promise<ApiDesignReview[]> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/design-reviews`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to load design reviews');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || []);
}

/**
 * Approve design review
 */
export async function approveDesignReview(reviewId: string): Promise<ApiDesignReview> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/design-reviews/${reviewId}/approve`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to approve design review');
  }

  return await response.json();
}

/**
 * Reject design review
 */
export async function rejectDesignReview(reviewId: string, comments?: string): Promise<ApiDesignReview> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/design-reviews/${reviewId}/reject`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comments }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to reject design review');
  }

  return await response.json();
}

/**
 * Request changes cho design review
 */
export async function requestDesignReviewChanges(reviewId: string, comments: string): Promise<ApiDesignReview> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const response = await fetch(`${API_BASE_URL}/design-reviews/${reviewId}/request-changes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comments }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to request changes for design review');
  }

  return await response.json();
}
