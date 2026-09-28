"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Droplet,
  Zap,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import api from "@/lib/api";
import {
  INPUT_CLASSES,
  SELECT_CLASSES,
  TEXTAREA_CLASSES,
  BLOOD_GROUPS,
} from "@/lib/constants";

export default function NewBloodRequestPage() {
  const router = useRouter();
  const { user, isAuthenticated, isDonor, isHospital, isBloodBank, isAdmin } = useAuth();

  const [bloodGroup, setBloodGroup] = useState<string>("O-");
  const [requiredUnits, setRequiredUnits] = useState<number>(3);
  const [urgency, setUrgency] = useState<number>(0); // 0=Critical, 1=Urgent, 2=Standard
  const [patientDiagnosis, setPatientDiagnosis] = useState("");
  const [wardOrBedNumber, setWardOrBedNumber] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (isDonor) {
        router.push("/requests");
      } else if (user) {
        setContactNumber(user.phoneNumber || "");
      }
    }
  }, [isMounted, isAuthenticated, isDonor, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const payload = {
        bloodGroup,
        requiredUnits: Number(requiredUnits),
        urgency: Number(urgency),
        patientDiagnosis: patientDiagnosis.trim(),
        wardOrBedNumber: wardOrBedNumber.trim(),
        contactNumber: contactNumber.trim(),
      };

      const res = await api.post("/api/bloodrequests", payload);
      setSuccess("Emergency Blood Request successfully broadcasted across the transfusion grid!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to broadcast blood request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDonor) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md text-center space-y-4 shadow-sm">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            Blood Donors cannot broadcast emergency requests. Only accredited hospitals and regional blood depots hold broadcast privileges.
          </p>
          <Link
            href="/requests"
            className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
          >
            Go to Active Requests Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-rose-600" />
            Immediate Dispatch Portal
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Broadcast Emergency Blood Need
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Alert regional blood donors and certified cryo-depots for immediate unit dispatch.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Blood Group */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Required Blood Group</label>
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

              {/* Units */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Required Units</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={requiredUnits}
                  onChange={(e) => setRequiredUnits(parseInt(e.target.value) || 1)}
                  className={INPUT_CLASSES}
                />
              </div>

              {/* Urgency */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Urgency Level</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(parseInt(e.target.value))}
                  className={SELECT_CLASSES}
                >
                  <option value={0}>Critical (Stat / Immediate)</option>
                  <option value={1}>Urgent (Within 6 Hours)</option>
                  <option value={2}>Standard (Elective / Reserve)</option>
                </select>
              </div>
            </div>

            {/* Diagnosis / Clinical Indication */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Patient Diagnosis / Clinical Indication
              </label>
              <textarea
                rows={3}
                required
                value={patientDiagnosis}
                onChange={(e) => setPatientDiagnosis(e.target.value)}
                placeholder="e.g. Acute hemorrhagic shock following trauma; emergency cardiac surgery; postpartum hemorrhage..."
                className={TEXTAREA_CLASSES}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ward / Bed */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Ward / Room / Bed Number</label>
                <input
                  type="text"
                  required
                  value={wardOrBedNumber}
                  onChange={(e) => setWardOrBedNumber(e.target.value)}
                  placeholder="e.g. Trauma ICU Bed 04, Surgical Ward 2"
                  className={INPUT_CLASSES}
                />
              </div>

              {/* Contact */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Emergency Direct Phone</label>
                <input
                  type="tel"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+1 (555) 0144"
                  className={INPUT_CLASSES}
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              Broadcasting publishes this requirement directly to nearby eligible donors with matching blood groups and alerts certified regional blood banks capable of reserve dispatch.
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                href="/dashboard"
                className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Broadcasting Live Need...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Broadcast Emergency Need</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
