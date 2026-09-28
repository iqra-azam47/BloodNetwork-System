"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Droplet,
  Building2,
  Package,
  Heart,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { INPUT_CLASSES, SELECT_CLASSES, BLOOD_GROUPS } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, user } = useAuth();

  const [role, setRole] = useState<number>(0); // 0=Donor, 1=Hospital, 2=BloodBank
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [licenseOrRegNumber, setLicenseOrRegNumber] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isAuthenticated && user) {
      if (user.role === 3) router.push("/admin");
      else if (user.role === 2) router.push("/inventory");
      else router.push("/dashboard");
    }
  }, [isMounted, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if ((role === 1 || role === 2) && !licenseOrRegNumber.trim()) {
      setError("Medical license or government facility registration number is mandatory.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      fullName,
      email,
      password,
      role,
      phoneNumber,
      city,
      address,
      bloodGroup: role === 0 ? bloodGroup : null,
      licenseOrRegNumber: role !== 0 ? licenseOrRegNumber : null,
    };

    const res = await register(payload);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.message || "Failed to register.");
    } else {
      if (role === 1 || role === 2) {
        setSuccessMsg("Registration submitted! Facility account is pending Administrator verification.");
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-slate-50 py-12">
      <div className="w-full max-w-xl space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md shadow-rose-600/30">
            <Droplet className="w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Join the Transfusion Network
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Select your clinical role to begin coordinating life-saving blood supplies.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/70 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole(0)}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-bold transition-all ${
              role === 0
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Blood Donor</span>
          </button>

          <button
            type="button"
            onClick={() => setRole(1)}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-bold transition-all ${
              role === 1
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Hospital Facility</span>
          </button>

          <button
            type="button"
            onClick={() => setRole(2)}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-bold transition-all ${
              role === 2
                ? "bg-white text-purple-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Regional Blood Bank</span>
          </button>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {role !== 0 && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span>
                <strong>Verification Notice:</strong> Medical facilities require administrator review of licensing credentials before broadcasting requests or accessing reserve stock.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {role === 0 ? "Full Legal Name" : "Official Facility Name"}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === 0 ? "Dr. / Mr. / Ms. Name" : "e.g., St. Jude Memorial Hospital"}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Official Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@facility.org or personal@domain.com"
                  className={INPUT_CLASSES}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Emergency Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={INPUT_CLASSES}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">City / Municipality</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Metropolis"
                  className={INPUT_CLASSES}
                />
              </div>

              {role === 0 ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className={SELECT_CLASSES}
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">License / Reg Number</label>
                  <input
                    type="text"
                    required
                    value={licenseOrRegNumber}
                    onChange={(e) => setLicenseOrRegNumber(e.target.value)}
                    placeholder="e.g. HOSP-REG-2026-99"
                    className={INPUT_CLASSES}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Physical Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, ward, or hospital campus location"
                className={INPUT_CLASSES}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Create {role === 0 ? "Donor" : "Facility"} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Already have an active account?{" "}
            <Link href="/login" className="font-bold text-rose-600 hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
