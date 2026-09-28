"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Droplet,
  Shield,
  Activity,
  Heart,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  Building2,
  AlertTriangle,
  Sparkles,
  Zap,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { URGENCY_LABELS } from "@/lib/constants";

export default function HomePage() {
  const { isAuthenticated, user, isDonor, isHospital, isBloodBank, isAdmin } = useAuth();
  const [activeRequests, setActiveRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get("/api/bloodrequests/active");
        setActiveRequests(res.data?.value || res.data || []);
      } catch (e) {
        console.error("Failed to load active requests", e);
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchRequests();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/70 via-white to-slate-50 pt-16 pb-20 border-b border-slate-200/60">
        <div className="absolute inset-0 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100/80 border border-rose-200 text-rose-700 text-xs font-bold tracking-wide uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-rose-600 animate-spin" />
              Next-Gen Medical Transfusion Coordination
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Every Drop Counts. <br />
              <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-rose-700 bg-clip-text text-transparent">
                Every Second Matters.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
              BloodNetwork connects emergency hospital trauma units, certified regional cryo-depots, and verified voluntary blood donors on an instantaneous, AI-triaged transfusion network.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/requests"
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/25 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                <Droplet className="w-4 h-4 fill-white" />
                View Active Emergency Needs
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/screening"
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm border border-slate-200 shadow-sm hover:shadow transition-all"
              >
                <Activity className="w-4 h-4 text-rose-600" />
                AI Donor Screening (Gemini)
              </Link>

              {isAuthenticated && (isHospital || isBloodBank || isAdmin) && (
                <Link
                  href="/requests/new"
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  Broadcast Emergency Request
                </Link>
              )}
            </div>

            {/* Quick Demo Credentials Pill Bar */}
            <div className="pt-6">
              <div className="inline-block p-3 bg-white/90 backdrop-blur rounded-2xl border border-slate-200 shadow-sm text-xs text-slate-600">
                <span className="font-bold text-slate-900 mr-2">Testing Sandbox Ready:</span>
                Sign in with sample accounts on the{" "}
                <Link href="/login" className="text-rose-600 font-bold hover:underline">
                  Login Page
                </Link>{" "}
                (1-Click demo fill for Super Admin, Hospital, Blood Bank, or Donor).
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Metrics Showcase */}
      <section className="py-10 bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
                <Droplet className="w-5 h-5 fill-rose-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">8 Groups</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Universal Real-Time Matrix</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900">Multi-Facility</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Verified Hospitals & Depots</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900">Gemini AI</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Intelligent Medical Triage</p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900">Cryptographic</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Verified Donation Records</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Active Emergency Requests Feed Preview */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Live Urgent Blood Broadcasts
              </h2>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Active trauma ward transfusions and critical blood bank replenishments.
            </p>
          </div>

          <Link
            href="/requests"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-4 py-2 rounded-xl border border-rose-200 transition-colors"
          >
            Explore All Requests
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingRequests ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-56 bg-white rounded-3xl border border-slate-200 animate-pulse p-6"></div>
            ))}
          </div>
        ) : activeRequests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">All Immediate Needs Currently Met</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              No active emergency broadcasts at this exact moment. Register as a donor to receive instantaneous regional notifications when critical needs arise.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeRequests.slice(0, 3).map((req) => {
              const urgencyInfo = URGENCY_LABELS[req.urgency] || URGENCY_LABELS[2];
              const remaining = req.requiredUnits - req.fulfilledUnits;
              const percent = Math.min(100, Math.round((req.fulfilledUnits / req.requiredUnits) * 100));

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-rose-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-rose-600/20 group-hover:scale-105 transition-transform">
                          {req.bloodGroup}
                        </div>
                        <div>
                          <span className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${urgencyInfo.badge}`}>
                            {urgencyInfo.label} Priority
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1 leading-tight line-clamp-1">
                            {req.creatorName}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p className="line-clamp-2 italic text-slate-700 font-medium">
                        "{req.patientDiagnosis}"
                      </p>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] pt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.creatorCity} • {req.wardOrBedNumber}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">Fulfilled: {req.fulfilledUnits} / {req.requiredUnits} Units</span>
                        <span className="text-rose-600 font-bold">{remaining} needed</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-rose-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {req.activePledgesCount} active pledge(s)
                    </span>
                    <Link
                      href="/requests"
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                    >
                      Pledge Units →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. AI Screening Feature Highlight */}
      <section className="py-14 bg-gradient-to-tr from-slate-900 via-slate-850 to-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                Google Gemini Medical Screening
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Instant Clinical Donor Clearance Powered by AI
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed">
                Before heading to a hospital or blood bank, donors can evaluate their physiological donation readiness. Our Gemini-backed screening model reviews complete blood count (CBC) metrics, hemoglobin levels, symptom logs, and viral exposure windows against global blood transfusion criteria.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Anemia & Hemoglobin Optimization</h5>
                    <p className="text-xs text-slate-400">Identifies microcytic anemia, low ferritin indicators, or signs requiring dietary iron stabilization.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Automated Deferral Window Checks</h5>
                    <p className="text-xs text-slate-400">Verifies 6-month tattoo/piercing deferrals and endemic malaria travel guidelines.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/screening"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all"
                >
                  Launch AI Screening Test
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Interactive Screening Mock Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-6 sm:p-8 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Clinical Eligibility Certificate</h4>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase">Cleared For Whole Blood Donation</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">Hb: 14.2 g/dL</span>
              </div>

              <div className="py-5 space-y-3 text-xs text-slate-300">
                <p className="leading-relaxed">
                  <strong className="text-white">Clinical Insights:</strong> Hemoglobin metrics (14.2 g/dL) and biological markers satisfy standard transfusion safety guidelines. No active contraindications, needle exposures, or viral deferral markers detected.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Rest Interval</span>
                    <span className="text-xs font-bold text-white">8 Weeks (Whole Blood)</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-[10px] text-slate-400 block">AI Screening Model</span>
                    <span className="text-xs font-bold text-white">Google Gemini 1.5 Flash</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Secure Electronic Triage Badge</span>
                <span className="text-emerald-400 font-bold">100% Verification Valid</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 4-Role Architecture Overview */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Strict Role-Based Access Isolation
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Designed for clinical compliance and airtight operational security across 4 dedicated domains.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Role 0 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-rose-300 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                0
              </div>
              <h4 className="text-base font-bold text-slate-900">Blood Donor</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Take AI medical screening, view active emergency broadcasts, pledge donations with estimated arrival time, and track personal verified donation history and badges.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 text-[11px] font-bold text-rose-600">
              Personal Impact History
            </div>
          </div>

          {/* Role 1 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-blue-300 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900">Hospital Facility</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Broadcast emergency blood needs, monitor live incoming donor pledges feed, and execute "Confirm Donation Received" to auto-close requests and generate verified certificates.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 text-[11px] font-bold text-blue-600">
              Emergency Broadcast & Verification
            </div>
          </div>

          {/* Role 2 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-purple-300 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900">Regional Blood Bank</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manage 8-group inventory ledger (A+, B+, O+, AB±), record inward intake & outward dispatch, track critical shortage thresholds, and directly fulfill hospital requests from reserve units.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 text-[11px] font-bold text-purple-600">
              Live Cryo-Ledger & Dispatch
            </div>
          </div>

          {/* Role 3 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-amber-300 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900">Super Administrator</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dedicated /admin control hub, hospital and blood bank license approval pipeline, entity CRUD management, and immutable platform activity audit trail.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 text-[11px] font-bold text-amber-600">
              Facility Governance & Audit Logs
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
