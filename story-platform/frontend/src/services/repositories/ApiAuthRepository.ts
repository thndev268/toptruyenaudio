import { apiRequest } from '../apiClient';
import { supabase } from '../../lib/supabase';

export class ApiAuthRepository {
  async register(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { displayName },
      },
    });
    if (error) throw error;
    return data;
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async getMe() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async logoutAll() {
    // Supabase doesn't have logout-all, just sign out current session
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}

export const apiAuthRepository = new ApiAuthRepository();
