import { api } from "./api";

export const authService = {
  async register(data: any) {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  async login(data: any) {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  async logout() {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  async refreshToken() {
    const response = await api.post("/auth/refresh");
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  async resetPassword(data: any) {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
  },
};
