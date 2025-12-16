/**
 * Role Service
 * Quản lý và kiểm tra user roles
 */

import { authService } from './authService';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
}

/**
 * Role Service
 */
class RoleService {
  private currentUser: User | null = null;

  /**
   * Set current user
   */
  setUser(user: User | null): void {
    this.currentUser = user;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const user = await authService.getUser();
      this.currentUser = user;
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Kiểm tra user có phải admin không
   */
  async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'admin' || user?.role === 'super_admin';
  }

  /**
   * Kiểm tra user có phải super admin không
   */
  async isSuperAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'super_admin';
  }

  /**
   * Kiểm tra user có role cụ thể không
   */
  async hasRole(role: UserRole): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Kiểm tra user có phải user thông thường không
   */
  async isUser(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'user' || !user?.role;
  }

  /**
   * Clear current user
   */
  clearUser(): void {
    this.currentUser = null;
  }
}

export const roleService = new RoleService();
