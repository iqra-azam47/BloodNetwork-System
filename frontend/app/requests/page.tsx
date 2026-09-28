"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Droplet,
  MapPin,
  Clock,
  Search,
  Filter,
  Heart,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  PlusCircle,
  Building2,
  Users
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  INPUT_CLASSES,
  SELECT_CLASSES,
  BLOOD_GROUPS,
  URGENCY_LABELS
} from "@/lib/constants";

export default function RequestsFeedPage() {
  const { user, isAuthenticated, isDonor, isHospital, isBloodBank, isAdmin } = useAuth();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("ALL");
  const [searchCity, setSearchCity] = useState("");

  // Pledge modal state
  const [activeModalRequest, setActiveModalRequest] = useState<any | null>(null);
  const [unitsOffered, setUnitsOffered] = useState<number>(1);
  const [estimatedArrival, setEstimatedArrival] = useState<string>("Within 45 minutes");
  const [donorPhone, setDonorPhone] = useState<string>("");
  const [isPledging, setIsPledging] = useState(false);
  const [pledgeSuccess, setPledgeSuccess] = useState<string | null>(null);
  const [pledgeError, setPledgeError] = useState<string | null>(null);

  const fetchActiveRequests = async () => {
    setLoading(true);
    try {
      let url = "/api/bloodrequests/active";
      const params = new URLSearchParams();
      if (selectedGroup !== "ALL") params.append("bloodGroup", selectedGroup);
      if (searchCity.trim()) params.append("city", searchCity.trim());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await api.get(url);
      let data = res.data?.value || res.data || [];
      if (selectedUrgency !== "ALL") {
        data = data.filter((r: any) => r.urgency === parseInt(selectedUrgency));
      }
      setRequests(data);
    } catch (e) {
      console.error("Failed to load requests", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRequests();
  }, [selectedGroup, selectedUrgency]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActiveRequests();
  };

  const handleOpenPledgeModal = (req: any) => {
    setActiveModalRequest(req);
    setUnitsOffered(1);
    setEstimatedArrival("Within 45 minutes");
    setDonorPhone(user?.phoneNumber || "");
    setPledgeSuccess(null);
    setPledgeError(null);
  };

  const handlePledgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setPledgeError("Please sign in or register as a blood donor before submitting a pledge.");
      return;
    }

    setIsPledging(true);
    setPledgeError(null);
    setPledgeSuccess(null);

    try {
      await api.post("/api/bloodpledges", {
        requestId: activeModalRequest.id,
        unitsOffered: unitsOffered,
        estimatedArrival: estimatedArrival,
        donorContactNumber: donorPhone || user?.phoneNumber || "+1-555-0000",
      });

      setPledgeSuccess(`Pledge confirmed! The hospital team at ${activeModalRequest.creatorName} has been alerted to expect you.`);
      // Refresh list
      setTimeout(() => {
        fetchActiveRequests();
      }, 1200);
    } catch (err: any) {
      setPledgeError(err.response?.data?.message || "Failed to submit pledge. Please check your details.");
    } finally {
      setIsPledging(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Active Emergency Transfusion Feed
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Live broadcast requests from accredited hospitals and regional blood depots.
            </p>
          </div>

          {(isHospital || isBloodBank || isAdmin) && (
            <Link
              href="/requests/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all self-start md:self-auto"
            >
              <PlusCircle className="w-4 h-4 text-rose-500" />
              Broadcast Emergency Need
            </Link>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Blood Group Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Blood Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="ALL">All Blood Groups</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Urgency Priority</label>
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className={SELECT_CLASSES}
              >
                <option value="ALL">All Priorities</option>
                <option value="0">Critical (Immediate)</option>
                <option value="1">Urgent (Within 6h)</option>
                <option value="2">Standard</option>
              </select>
            </div>

            {/* City Search */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">City / District</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="e.g. Metropolis"
                  className={INPUT_CLASSES}
                />
              </div>
            </div>

            {/* Submit Filter */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-3.5 h-3.5" />
                Filter Broadcasts
              </button>
            </div>
          </form>
        </div>

        {/* Requests Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 bg-white rounded-3xl border border-slate-200 animate-pulse p-6"></div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Matching Emergency Needs Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              There are currently no active emergency requests matching your chosen filters. Try selecting "All Blood Groups" or checking back shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((req) => {
              const urgencyInfo = URGENCY_LABELS[req.urgency] || URGENCY_LABELS[2];
              const remaining = req.requiredUnits - req.fulfilledUnits;
              const percent = Math.min(100, Math.round((req.fulfilledUnits / req.requiredUnits) * 100));

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-rose-300 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-rose-600/20 group-hover:scale-105 transition-transform">
                          {req.bloodGroup}
                        </div>
                        <div>
                          <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${urgencyInfo.badge}`}>
                            {urgencyInfo.label} Priority
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 mt-1 leading-tight line-clamp-1">
                            {req.creatorName}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {req.creatorType === "BloodBank" ? "Regional Cryo-Depot" : "Hospital Trauma Unit"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Patient Context & Location */}
                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="font-medium italic text-slate-800 line-clamp-2">
                          "{req.patientDiagnosis}"
                        </p>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-500 pt-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{req.creatorAddress}, {req.creatorCity}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Ward / Bed: <strong>{req.wardOrBedNumber}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Broadcast: {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">Fulfilled: {req.fulfilledUnits} / {req.requiredUnits} Units</span>
                        <span className="text-rose-600 font-bold">{remaining} units still needed</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-rose-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {req.activePledgesCount} active donor pledge(s)
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenPledgeModal(req)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:shadow-lg transition-all flex items-center gap-1.5"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      Pledge Blood
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Pledge Modal */}
      {activeModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 relative">
            <button
              onClick={() => setActiveModalRequest(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase">
                <Heart className="w-3 h-3 fill-rose-600" />
                Confirm Volunteer Donation Pledge
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Pledge for {activeModalRequest.bloodGroup} Transfusion
              </h3>
              <p className="text-xs text-slate-500">
                Facility: <strong>{activeModalRequest.creatorName}</strong> ({activeModalRequest.wardOrBedNumber})
              </p>
            </div>

            {pledgeError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{pledgeError}</span>
              </div>
            )}

            {pledgeSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Pledge Broadcasted to Facility!</h4>
                <p className="text-xs text-emerald-700">{pledgeSuccess}</p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalRequest(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                  >
                    Done & Return to Feed
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePledgeSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Units to Offer</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      required
                      value={unitsOffered}
                      onChange={(e) => setUnitsOffered(parseInt(e.target.value) || 1)}
                      className={INPUT_CLASSES}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Estimated Arrival (ETA)</label>
                    <select
                      value={estimatedArrival}
                      onChange={(e) => setEstimatedArrival(e.target.value)}
                      className={SELECT_CLASSES}
                    >
                      <option value="Within 30 minutes">Within 30 minutes</option>
                      <option value="Within 45 minutes">Within 45 minutes</option>
                      <option value="Within 1 hour">Within 1 hour</option>
                      <option value="Within 2 hours">Within 2 hours</option>
                      <option value="Today afternoon">Today afternoon</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Contact Phone (For Ward Confirmation)
                  </label>
                  <input
                    type="tel"
                    required
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                  By clicking confirm, your pledge is dispatched to the hospital's live arrival triage feed. Please ensure you satisfy medical resting intervals before donating.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalRequest(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isPledging}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isPledging ? (
                      <span>Broadcasting Pledge...</span>
                    ) : (
                      <>
                        <Heart className="w-3.5 h-3.5 fill-white" />
                        <span>Confirm Blood Pledge</span>
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
