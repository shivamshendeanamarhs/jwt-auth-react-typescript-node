import API from "../config/apiClient";

export const register = async (data) => API.post("http://localhost:4000/auth/register", data);
export const login = async (data) => API.post("http://localhost:4000/auth/login", data);
export const logout = async () => API.get("http://localhost:4000/auth/logout");
export const verifyEmail = async (verificationCode) =>
  API.get(`http://localhost:4000/auth/email/verify/${verificationCode}`);
export const sendPasswordResetEmail = async (email) =>
  API.post("http://localhost:4000/auth/password/forgot", { email });
export const resetPassword = async ({ verificationCode, password }) =>
  API.post("http://localhost:4000/auth/password/reset", { verificationCode, password });

export const getUser = async () => API.get("http://localhost:4000/user");
export const getSessions = async () => API.get("http://localhost:4000/sessions");
export const deleteSession = async (id) => API.delete(`http://localhost:4000/sessions/${id}`);
