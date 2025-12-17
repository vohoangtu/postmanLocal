/**
 * Request Review Store
 * State management cho request reviews
 */

import { create } from 'zustand';
import { authService } from '../services/authService';

import type { RequestReview } from '../types/workspace';

interface RequestReviewStore {
  reviews: RequestReview[];
  loading: boolean;
  loadReviews: (collectionId: string, filters?: { status?: string; reviewer_id?: string; request_id?: string }) => Promise<void>;
  createReview: (requestId: string, collectionId: string, reviewerId: string, comments?: string) => Promise<RequestReview>;
  updateReview: (reviewId: string, status: string, comments?: string) => Promise<void>;
  approveReview: (reviewId: string) => Promise<void>;
  rejectReview: (reviewId: string, comments?: string) => Promise<void>;
  requestChanges: (reviewId: string, comments: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  clearReviews: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const useRequestReviewStore = create<RequestReviewStore>((set, get) => ({
  reviews: [],
  loading: false,

  loadReviews: async (collectionId, filters = {}) => {
    set({ loading: true });
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Chưa đăng nhập');

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.reviewer_id) params.append('reviewer_id', filters.reviewer_id);
      if (filters.request_id) params.append('request_id', filters.request_id);

      const response = await fetch(
        `${API_BASE_URL}/collections/${collectionId}/reviews?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reviewsList = Array.isArray(data) ? data : (data.data || []);
        set({ reviews: reviewsList });
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      set({ loading: false });
    }
  },

  createReview: async (requestId, collectionId, reviewerId, comments) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Chưa đăng nhập');

      const response = await fetch(`${API_BASE_URL}/requests/${requestId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          collection_id: collectionId,
          reviewer_id: reviewerId,
          comments,
        }),
      });

      if (response.ok) {
        const review = await response.json();
        set((state) => ({ reviews: [...state.reviews, review] }));
        return review;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create review');
      }
    } catch (error: any) {
      throw error;
    }
  },

  updateReview: async (reviewId, status, comments) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Chưa đăng nhập');

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          comments,
        }),
      });

      if (response.ok) {
        const updatedReview = await response.json();
        set((state) => ({
          reviews: state.reviews.map((r) => (r.id === reviewId ? updatedReview : r)),
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update review');
      }
    } catch (error: any) {
      throw error;
    }
  },

  approveReview: async (reviewId) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Chưa đăng nhập');

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedReview = await response.json();
        set((state) => ({
          reviews: state.reviews.map((r) => (r.id === reviewId ? updatedReview : r)),
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve review');
      }
    } catch (error: any) {
      throw error;
    }
  },

  rejectReview: async (reviewId, comments) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Chưa đăng nhập');

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comments }),
      });

      if (response.ok) {
        const updatedReview = await response.json();
        set((state) => ({
          reviews: state.reviews.map((r) => (r.id === reviewId ? updatedReview : r)),
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject review');
      }
    } catch (error: any) {
      throw error;
    }
  },

  requestChanges: async (reviewId, comments) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Chưa đăng nhập');

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/request-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comments }),
      });

      if (response.ok) {
        const updatedReview = await response.json();
        set((state) => ({
          reviews: state.reviews.map((r) => (r.id === reviewId ? updatedReview : r)),
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request changes');
      }
    } catch (error: any) {
      throw error;
    }
  },

  deleteReview: async (reviewId) => {
    try {
      const token = await authService.getAccessToken();
      if (!token) throw new Error('Chưa đăng nhập');

      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        set((state) => ({
          reviews: state.reviews.filter((r) => r.id !== reviewId),
        }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete review');
      }
    } catch (error: any) {
      throw error;
    }
  },

  clearReviews: () => set({ reviews: [] }),
}));
