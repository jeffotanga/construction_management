import create from 'zustand';
import { authService } from './api';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
    set({ token });
  },
  setError: (error) => set({ error }),
  setIsLoading: (isLoading) => set({ isLoading }),

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(userData);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      const { access_token, user } = response.data;
      localStorage.setItem('access_token', access_token);
      set({ user, token: access_token, isLoading: false });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null });
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.getCurrentUser();
      set({ user: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false, error: 'Failed to fetch user' });
      localStorage.removeItem('access_token');
      set({ token: null, user: null });
      throw error;
    }
  },
}));

