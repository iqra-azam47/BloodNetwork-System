"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/api";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: number; // 0=Donor, 1=Hospital, 2=BloodBank, 3=Admin
  roleName: string;
  city: string;
  address: string;
  phoneNumber: string;
  bloodGroup?: string | null;
  isVerified: boolean;
  licenseOrRegNumber?: string | null;
  notificationRadiusKm?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDonor: boolean;
  isHospital: boolean;
  isBloodBank: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateLocalUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Read from localStorage on mount
    try {
      const storedToken = localStorage.getItem("bloodnetwork_token");
      const storedUser = localStorage.getItem("bloodnetwork_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to restore session", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const data = res.data;

      const newUser: User = {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        roleName: data.roleName,
        city: data.city,
        address: data.address,
        phoneNumber: data.phoneNumber,
        bloodGroup: data.bloodGroup,
        isVerified: data.isVerified,
        licenseOrRegNumber: data.licenseOrRegNumber,
        notificationRadiusKm: data.notificationRadiusKm,
      };

      setToken(data.token);
      setUser(newUser);

      localStorage.setItem("bloodnetwork_token", data.token);
      localStorage.setItem("bloodnetwork_user", JSON.stringify(newUser));

      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid credentials. Please verify your email and password.";
      return { success: false, message };
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.post("/api/auth/register", data);
      const resData = res.data;

      const newUser: User = {
        id: resData.id,
        fullName: resData.fullName,
        email: resData.email,
        role: resData.role,
        roleName: resData.roleName,
        city: resData.city,
        address: resData.address,
        phoneNumber: resData.phoneNumber,
        bloodGroup: resData.bloodGroup,
        isVerified: resData.isVerified,
        licenseOrRegNumber: resData.licenseOrRegNumber,
        notificationRadiusKm: resData.notificationRadiusKm,
      };

      setToken(resData.token);
      setUser(newUser);

      localStorage.setItem("bloodnetwork_token", resData.token);
      localStorage.setItem("bloodnetwork_user", JSON.stringify(newUser));

      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.message || "Registration failed. Please check your details.";
      return { success: false, message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("bloodnetwork_token");
    localStorage.removeItem("bloodnetwork_user");
    window.location.href = "/login";
  };

  const updateLocalUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem("bloodnetwork_user", JSON.stringify(updated));
  };

  const isDonor = user?.role === 0;
  const isHospital = user?.role === 1;
  const isBloodBank = user?.role === 2;
  const isAdmin = user?.role === 3;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        isDonor,
        isHospital,
        isBloodBank,
        isAdmin,
        login,
        register,
        logout,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
