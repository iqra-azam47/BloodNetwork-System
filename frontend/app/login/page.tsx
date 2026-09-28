"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Droplet, Lock, Mail, ArrowRight, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { INPUT_CLASSES } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isAuthenticated && user) {
      if (user.role === 3) {
        router.push("/admin");
      } else if (user.role === 2) {
        router.push("/inventory");
      } else {
        router.push("/dashboard");
      }
    }
  }, [isMounted, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.message || "Invalid credentials.");
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-slate-50 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md shadow-rose-600/30">
            <Droplet className="w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Sign In to BloodNetwork
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Secure clinical authentication for Donors, Hospitals, and Blood Banks.
          </p>
        </div>

        {/* Demo Fast-Fill Bar */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider text-center">
            One-Click Test Role Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@bloodnetwork.org", "Admin@123")}
              className="p-2 text-left rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              <div className="text-[11px] font-bold text-amber-900">Super Admin</div>
              <div className="text-[10px] text-amber-700 truncate">admin@bloodnetwork.org</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("hospital@stjude.org", "Password@123")}
              className="p-2 text-left rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <div className="text-[11px] font-bold text-blue-900">Hospital Facility</div>
              <div className="text-[10px] text-blue-700 truncate">hospital@stjude.org</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("bank@redcrossblood.org", "Password@123")}
              className="p-2 text-left rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
            >
              <div className="text-[11px] font-bold text-purple-900">Blood Bank Depot</div>
              <div className="text-[10px] text-purple-700 truncate">bank@redcrossblood.org</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("donor@bloodnetwork.org", "Password@123")}
              className="p-2 text-left rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              <div className="text-[11px] font-bold text-rose-900">Blood Donor (O+)</div>
              <div className="text-[10px] text-rose-700 truncate">donor@bloodnetwork.org</div>
            </button>
          </div>
        </div>

        {/* Main Login Form */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Work / User Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@facility.org or donor@domain.com"
                  className={INPUT_CLASSES}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">Account Password</label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={INPUT_CLASSES}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <span>Sign In to Transfusion System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Don't have an account yet?{" "}
            <Link href="/register" className="font-bold text-rose-600 hover:underline">
              Register New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
