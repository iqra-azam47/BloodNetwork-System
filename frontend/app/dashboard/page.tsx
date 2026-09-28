"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Heart,
  Droplet,
  Activity,
  ShieldCheck,
  Building2,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Award,
  Zap,
  Phone,
  Settings,
  ChevronRight,
  ExternalLink,
  Flame,
  Radio,
  FileCheck2
} from "lucide-react";
import api from "@/lib/api";
import {
  INPUT_CLASSES,
  URGENCY_LABELS
} from "@/lib/constants";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isDonor, isHospital, isBloodBank, isAdmin, updateLocalUser } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // Donor State
  const [donorStats, setDonorStats] = useState<any | null>(null);
  const [donorPledges, setDonorPledges] = useState<any[]>([]);
  const [loadingDonor, setLoadingDonor] = useState(false);

  // Profile update state
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Hospital State
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [incomingPledges, setIncomingPledges] = useState<any[]>([]);
  const [loadingHospital, setLoadingHospital] = useState(false);

  // Hospital Confirm Donation Modal State
  const [confirmModalPledge, setConfirmModalPledge] = useState<any | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<any | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (isAdmin) {
        router.push("/admin");
      } else if (isBloodBank) {
        router.push("/inventory");
      } else if (user) {
        setPhone(user.phoneNumber || "");
        setAddress(user.address || "");
        setCity(user.city || "");
        setRadiusKm(user.notificationRadiusKm || 25);

        if (isDonor) {
          fetchDonorData();
        } else if (isHospital) {
          fetchHospitalData();
        }
      }
    }
  }, [isMounted, isAuthenticated, user, isDonor, isHospital, isBloodBank, isAdmin, router]);

  // Fetch Donor Data
  const fetchDonorData = async () => {
    setLoadingDonor(true);
    try {
      const [historyRes, pledgesRes] = await Promise.all([
        api.get("/api/donors/history"),
        api.get("/api/bloodpledges/my-pledges"),
      ]);
      setDonorStats(historyRes.data);
      setDonorPledges(pledgesRes.data || []);
    } catch (e) {
      console.error("Failed to load donor data", e);
    } finally {
      setLoadingDonor(false);
    }
  };

  // Fetch Hospital Data
  const fetchHospitalData = async () => {
    setLoadingHospital(true);
    try {
      const [requestsRes, pledgesRes] = await Promise.all([
        api.get("/api/bloodrequests/mine"),
        api.get("/api/bloodpledges/incoming"),
      ]);
      setMyRequests(requestsRes.data || []);
      setIncomingPledges(pledgesRes.data || []);
    } catch (e) {
      console.error("Failed to load hospital data", e);
    } finally {
      setLoadingHospital(false);
    }
  };

  // Toggle Request Active/Inactive
  const handleToggleRequestStatus = async (requestId: string, currentActive: boolean) => {
    try {
      await api.patch(`/api/bloodrequests/${requestId}/toggle-status`, {
        isActive: !currentActive,
      });
      fetchHospitalData();
    } catch (e) {
      console.error("Failed to toggle request status", e);
    }
  };

  // Confirm Donation Received
  const handleConfirmDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmModalPledge) return;

    setConfirming(true);
    setConfirmError(null);
    setConfirmResult(null);

    try {
      const res = await api.post("/api/bloodpledges/confirm-donation", {
        pledgeId: confirmModalPledge.id,
        clinicalCaseNotes: clinicalNotes.trim(),
      });
      setConfirmResult(res.data);
      fetchHospitalData();
    } catch (err: any) {
      setConfirmError(err.response?.data?.message || "Failed to confirm donation.");
    } finally {
      setConfirming(false);
    }
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await api.put("/api/auth/profile", {
        phoneNumber: phone,
        address,
        city,
        notificationRadiusKm: radiusKm,
      });
      updateLocalUser({
        phoneNumber: phone,
        address,
        city,
        notificationRadiusKm: radiusKm,
      });
      setProfileMsg("Contact preferences successfully updated.");
    } catch (e) {
      console.error("Failed to update profile", e);
    } finally {
      setSavingProfile(false);
    }
  };

  if (!isMounted || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-50">
        <div className="h-8 w-8 rounded-full border-4 border-rose-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // ==========================================
  // RENDER DONOR DASHBOARD (Role 0)
  // ==========================================
  if (isDonor) {
    return (
      <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Welcome Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-rose-600/25 shrink-0">
                {user.bloodGroup || "O+"}
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase">
                  <Heart className="w-3 h-3 fill-rose-600" />
                  Verified Blood Donor Portal
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Welcome back, {user.fullName}
                </h1>
                <p className="text-xs text-slate-500">
                  {user.city} • Emergency Notification Radius: <strong>{radiusKm} km</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/screening"
                className="px-5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center gap-2"
              >
                <Activity className="w-4 h-4 text-rose-600" />
                AI Health Screening
              </Link>
              <Link
                href="/requests"
                className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                <Droplet className="w-4 h-4 fill-white" />
                Browse Needs & Pledge
              </Link>
            </div>
          </div>

          {/* Impact Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Verified Donations
              </span>
              <p className="text-3xl font-black text-slate-900 mt-2">
                {donorStats?.totalDonations ?? 0}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Confirmed clinical procedures</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Whole Blood Contributed
              </span>
              <p className="text-3xl font-black text-rose-600 mt-2">
                {donorStats?.totalUnitsDonated ?? 0} <span className="text-sm font-bold text-slate-500">Units</span>
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Directly transfused to patients</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Estimated Lives Impacted
              </span>
              <p className="text-3xl font-black text-emerald-600 mt-2">
                {donorStats?.livesImpacted ?? 0} <span className="text-sm font-bold text-slate-500">Lives</span>
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Based on 1 unit = 3 patient saves</p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Clinical Eligibility
              </span>
              <p className="text-xl font-black text-slate-900 mt-2 flex items-center gap-2">
                {donorStats?.isEligibleNow ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-emerald-600">Eligible Now</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-amber-500" />
                    <span className="text-amber-600">Rest Interval</span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {donorStats?.isEligibleNow
                  ? "Cleared for whole blood pledge"
                  : `Next: ${new Date(donorStats?.nextEligibleDonationDate).toLocaleDateString()}`}
              </p>
            </div>
          </div>

          {/* AI Health Badges Showcase */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">AI Transfusion & Health Badges</h3>
                <p className="text-xs text-slate-500">Earned milestone certificates acknowledging life-saving community support.</p>
              </div>
              <Award className="w-6 h-6 text-amber-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              {(donorStats?.badges || []).map((badge: any) => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    badge.isUnlocked
                      ? "bg-gradient-to-b from-white to-slate-50 border-slate-300 shadow-sm"
                      : "bg-slate-50/60 border-slate-200/60 opacity-50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                    badge.isUnlocked
                      ? "bg-rose-100 text-rose-600 shadow-sm"
                      : "bg-slate-200 text-slate-400"
                  }`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{badge.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                    {badge.description}
                  </p>
                  <span className={`inline-block mt-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    badge.isUnlocked ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                  }`}>
                    {badge.isUnlocked ? "UNLOCKED" : "LOCKED"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Two Columns: Active Pledges & Verified History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Pledges */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Your Active Blood Pledges</h3>
                  <p className="text-xs text-slate-500">Scheduled arrival times and pledge statuses.</p>
                </div>
                <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
              </div>

              {donorPledges.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <Heart className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Pending Pledges</p>
                  <p className="text-[11px] text-slate-500">
                    You have not pledged for any active hospital broadcasts. Explore the feed to offer whole blood units.
                  </p>
                  <Link
                    href="/requests"
                    className="inline-block mt-2 px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                  >
                    View Emergency Needs
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {donorPledges.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                            {p.bloodGroup}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{p.facilityName}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          ETA: <strong>{p.estimatedArrival}</strong> • Offered: {p.unitsOffered} unit(s)
                        </p>
                      </div>

                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                        p.status.includes("Completed")
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verified Donation History */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Verified Clinical Donation Log</h3>
                  <p className="text-xs text-slate-500">Cryptographically recorded transfusion history.</p>
                </div>
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
              </div>

              {(donorStats?.donations || []).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Completed Donations Yet</p>
                  <p className="text-[11px] text-slate-500">
                    Once a hospital physically receives and verifies your blood donation, your verified certificate code will be registered here permanently.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(donorStats?.donations || []).map((d: any) => (
                    <div
                      key={d.id}
                      className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                            {d.bloodGroup}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{d.facilityName}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {new Date(d.donationDate).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 italic">"{d.clinicalCase}"</p>

                      <div className="pt-2 border-t border-emerald-200/50 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Verification Certificate Code:</span>
                        <code className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {d.verificationCode}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Profile & Notification Preferences Form */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-700" />
              <h3 className="text-base font-black text-slate-900">
                Contact & Regional Notification Radius
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Set your alert radius to receive emergency trauma broadcasts occurring within your driving proximity.
            </p>

            {profileMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{profileMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Contact Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Home City / District</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Radius in Kilometers</label>
                    <span className="text-xs font-extrabold text-rose-600">{radiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value) || 25)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600 mt-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Physical Address / Apartment</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
                >
                  {savingProfile ? "Saving Preferences..." : "Save Contact Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER HOSPITAL DASHBOARD (Role 1)
  // ==========================================
  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hospital Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-600/25 shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                <Building2 className="w-3 h-3" />
                Accredited Hospital Transfusion Center
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {user.fullName}
              </h1>
              <p className="text-xs text-slate-500">
                {user.address}, {user.city} • Emergency Hotline: <strong>{user.phoneNumber}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/requests/new"
              className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white" />
              Broadcast Emergency Need
            </Link>
          </div>
        </div>

        {/* Live Incoming Pledges Feed for Hospital */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Live Incoming Donors & Pledges Feed
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Voluntary donors in transit responding to your hospital's broadcasted needs.
              </p>
            </div>

            <span className="text-xs font-bold text-slate-500">
              {incomingPledges.length} Total Registered Pledge(s)
            </span>
          </div>

          {incomingPledges.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <Heart className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No Incoming Donors Currently</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                When donors view your emergency broadcasts and pledge whole blood units, their contact details and estimated arrival times will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Donor Name</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Blood Group</th>
                    <th className="pb-3">Units Offered</th>
                    <th className="pb-3">Estimated Arrival (ETA)</th>
                    <th className="pb-3">Ward / Bed</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Physical Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomingPledges.map((p) => {
                    const isCompleted = p.status.includes("Completed");

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 font-bold text-slate-900">
                          {p.donorName}
                          <span className="block text-[10px] text-slate-400 font-normal">{p.donorCity}</span>
                        </td>
                        <td className="py-3.5 text-slate-600 font-mono">{p.donorContactNumber}</td>
                        <td className="py-3.5">
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[11px]">
                            {p.bloodGroup}
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-slate-900">{p.unitsOffered} Unit(s)</td>
                        <td className="py-3.5 text-slate-700 font-medium">{p.estimatedArrival}</td>
                        <td className="py-3.5 text-slate-500 font-medium">{p.wardOrBedNumber}</td>
                        <td className="py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmModalPledge(p);
                                setClinicalNotes("");
                                setConfirmResult(null);
                                setConfirmError(null);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all"
                            >
                              Confirm Donation Received
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hospital's Broadcasted Requests Manager */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Your Broadcasted Emergency Needs</h3>
              <p className="text-xs text-slate-500">Monitor fulfillment progress and toggle active status.</p>
            </div>
            <Link
              href="/requests/new"
              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Broadcast
            </Link>
          </div>

          {myRequests.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <Droplet className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No Broadcasts Active</p>
              <p className="text-[11px] text-slate-500">
                You currently have no emergency blood requirements broadcasted.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((req) => {
                const urgencyInfo = URGENCY_LABELS[req.urgency] || URGENCY_LABELS[2];
                const percent = Math.min(100, Math.round((req.fulfilledUnits / req.requiredUnits) * 100));

                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-xl bg-rose-600 text-white font-black text-sm flex items-center justify-center">
                          {req.bloodGroup}
                        </span>
                        <div>
                          <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${urgencyInfo.badge}`}>
                            {urgencyInfo.label} Priority
                          </span>
                          <span className="text-xs font-bold text-slate-900 ml-2">
                            Ward: {req.wardOrBedNumber}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 font-medium italic">
                        "{req.patientDiagnosis}"
                      </p>

                      <div className="w-full bg-slate-100 rounded-full h-2 max-w-md overflow-hidden">
                        <div
                          className="bg-rose-600 h-2 rounded-full"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      <span className="text-[11px] text-slate-500 font-semibold block">
                        Fulfilled: {req.fulfilledUnits} / {req.requiredUnits} Units • {req.activePledgesCount} active pledge(s)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        req.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}>
                        {req.isActive ? "BROADCAST ACTIVE" : "CLOSED / INACTIVE"}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleRequestStatus(req.id, req.isActive)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          req.isActive
                            ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                            : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                        }`}
                      >
                        {req.isActive ? "Close Broadcast" : "Re-Activate"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hospital Action Modal: "Confirm Donation Received" */}
      {confirmModalPledge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 relative">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Physical Transfusion Verification
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Confirm Donation Received
              </h3>
              <p className="text-xs text-slate-500">
                Verify physical receipt of blood units from voluntary donor.
              </p>
            </div>

            {confirmError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{confirmError}</span>
              </div>
            )}

            {confirmResult ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">Donation Verified & Written to Immutable Log!</h4>
                    <p className="text-xs text-emerald-700">{confirmResult.message}</p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Certificate Verification Code:</span>
                    <strong className="font-mono text-emerald-800">{confirmResult.verificationCode}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Request Fulfillment Progress:</span>
                    <strong className="text-slate-900">
                      {confirmResult.requestFulfilledUnits} / {confirmResult.requestRequiredUnits} Units
                    </strong>
                  </div>
                  {confirmResult.isRequestAutoClosed && (
                    <p className="text-[11px] text-rose-600 font-bold pt-1">
                      Target quota met! This blood request has been automatically closed.
                    </p>
                  )}
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmModalPledge(null);
                      fetchHospitalData();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmDonation} className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Donor Name:</span>
                    <strong className="text-slate-900">{confirmModalPledge.donorName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Blood Group:</span>
                    <strong className="text-rose-600 font-black">{confirmModalPledge.bloodGroup}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Units Physically Donated:</span>
                    <strong className="text-slate-900">{confirmModalPledge.unitsOffered} Unit(s)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ward / Bed:</span>
                    <span className="text-slate-700">{confirmModalPledge.wardOrBedNumber}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Clinical Transfusion Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="e.g. Transfused to trauma patient in ICU 3B..."
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                  Executing this action permanently writes this verified donation to the donor's medical profile, issues a cryptographic certificate code, increments fulfilled units, and records an immutable entry into the system audit trail.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmModalPledge(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={confirming}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {confirming ? (
                      <span>Verifying & Recording...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Confirm & Write to Audit Trail</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
