import { storage } from '../storage';
import { apiRequest, getDataSourceMode } from '../apiClient';

export interface UserProfileInput {
  name?: string;
  username?: string;
  avatarUrl?: string;
  expectedVersion?: number;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface UserProfileMembership {
  tier: 'FREE' | 'PREMIUM';
  subscriptionStatus: 'NONE' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  planId?: string;
  startedAt?: string;
  expiresAt?: string;
}

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  role: string;
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
  membership?: UserProfileMembership;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export interface UserProfileRepository {
  getCurrentProfile(): Promise<UserProfileData>;
  updateProfile(input: UserProfileInput): Promise<UserProfileData>;
  changePassword(input: ChangePasswordInput): Promise<void>;
  uploadAvatar(file: File): Promise<{ avatarUrl: string }>;
  deleteAvatar?(): Promise<UserProfileData>;
}

export class ApiUserProfileRepository implements UserProfileRepository {
  async getCurrentProfile(): Promise<UserProfileData> {
    try {
      const response = await apiRequest<{ data: any } | any>('/users/me', { method: 'GET' });
      const data = response.data || response;
      
      const profile: UserProfileData = {
        id: data.id,
        name: data.displayName || data.name,
        email: data.email,
        username: data.username,
        avatarUrl: data.avatarUrl,
        role: data.role,
        accountStatus: data.accountStatus,
        membership: data.membership,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        version: data.version,
      };

      // Sync local storage copy safely
      const auth = storage.getAuth();
      if (auth.user) {
        storage.saveAuth({
          ...auth,
          role: profile.role as any,
          user: {
            ...auth.user,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
          },
        });
      }

      return profile;
    } catch (err) {
      if (getDataSourceMode() === 'API') {
        throw err;
      }
      return new LocalUserProfileRepository().getCurrentProfile();
    }
  }

  async updateProfile(input: UserProfileInput): Promise<UserProfileData> {
    try {
      const body: Record<string, any> = {};
      if (input.name !== undefined) body.displayName = input.name.trim();
      if (input.username !== undefined) body.username = input.username.trim();
      if (input.expectedVersion !== undefined) body.expectedVersion = input.expectedVersion;

      const response = await apiRequest<{ data: any } | any>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      const data = response.data || response;
      const updated: UserProfileData = {
        id: data.id,
        name: data.displayName || data.name,
        email: data.email,
        username: data.username,
        avatarUrl: data.avatarUrl,
        role: data.role,
        accountStatus: data.accountStatus,
        membership: data.membership,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        version: data.version,
      };

      // Keep local state in sync
      const auth = storage.getAuth();
      if (auth.user) {
        storage.saveAuth({
          ...auth,
          user: {
            ...auth.user,
            name: updated.name,
            avatarUrl: updated.avatarUrl,
          },
        });
      }

      return updated;
    } catch (err: any) {
      if (err?.message?.includes('409') || err?.code === 'PROFILE_VERSION_CONFLICT') {
        throw new Error('VERSION_CONFLICT');
      }
      if (getDataSourceMode() === 'API') {
        throw err;
      }
      return new LocalUserProfileRepository().updateProfile(input);
    }
  }

  async changePassword(input: ChangePasswordInput): Promise<void> {
    if (!input.currentPassword || !input.newPassword) {
      throw new Error('VALIDATION_ERROR');
    }

    try {
      await apiRequest('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: input.currentPassword,
          newPassword: input.newPassword,
          confirmPassword: input.confirmPassword,
        }),
      });
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('401') || msg.includes('CURRENT_PASSWORD_INCORRECT')) {
        throw new Error('CURRENT_PASSWORD_INCORRECT');
      }
      if (msg.includes('409') || msg.includes('PASSWORD_REUSE_NOT_ALLOWED')) {
        throw new Error('PASSWORD_REUSE_NOT_ALLOWED');
      }
      throw err;
    }
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiRequest<{ data: any } | any>('/users/me/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = response.data || response;
      return { avatarUrl: data.avatarUrl };
    } catch (err) {
      if (getDataSourceMode() === 'API') {
        throw err;
      }
      return new LocalUserProfileRepository().uploadAvatar(file);
    }
  }

  async deleteAvatar(): Promise<UserProfileData> {
    try {
      const response = await apiRequest<{ data: any } | any>('/users/me/avatar', {
        method: 'DELETE',
      });
      const data = response.data || response;
      return {
        id: data.id,
        name: data.displayName || data.name,
        email: data.email,
        username: data.username,
        avatarUrl: data.avatarUrl,
        role: data.role,
        accountStatus: data.accountStatus,
        membership: data.membership,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        version: data.version,
      };
    } catch (err) {
      if (getDataSourceMode() === 'API') {
        throw err;
      }
      return new LocalUserProfileRepository().updateProfile({ avatarUrl: '' });
    }
  }
}

export class LocalUserProfileRepository implements UserProfileRepository {
  async getCurrentProfile(): Promise<UserProfileData> {
    const auth = storage.getAuth();
    if (!auth.user) {
      throw new Error('UNAUTHENTICATED');
    }
    return {
      id: auth.user.id,
      name: auth.user.name,
      email: auth.user.email,
      avatarUrl: auth.user.avatarUrl,
      role: auth.role,
      membership: {
        tier: 'FREE',
        subscriptionStatus: 'NONE',
      },
      version: 1,
    };
  }

  async updateProfile(input: UserProfileInput): Promise<UserProfileData> {
    const auth = storage.getAuth();
    if (!auth.user) {
      throw new Error('UNAUTHENTICATED');
    }

    const updatedUser = {
      ...auth.user,
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
    };

    const newAuth = { ...auth, user: updatedUser };
    storage.saveAuth(newAuth);

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl,
      role: auth.role,
      membership: {
        tier: 'FREE',
        subscriptionStatus: 'NONE',
      },
      version: (auth.user as any).version ? (auth.user as any).version + 1 : 1,
    };
  }

  async changePassword(input: ChangePasswordInput): Promise<void> {
    if (!input.currentPassword || !input.newPassword) {
      throw new Error('VALIDATION_ERROR');
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('UNSUPPORTED_MEDIA_TYPE');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('FILE_TOO_LARGE');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ avatarUrl: reader.result as string });
      };
      reader.onerror = () => reject(new Error('READ_FAILED'));
      reader.readAsDataURL(file);
    });
  }

  async deleteAvatar(): Promise<UserProfileData> {
    return this.updateProfile({ avatarUrl: '' });
  }
}

export const userProfileRepository: UserProfileRepository = new ApiUserProfileRepository();
