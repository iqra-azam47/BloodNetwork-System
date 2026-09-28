"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Clock,
  Send,
  Building2,
  ShieldAlert,
  Droplet,
  RefreshCw,
  Search
} from "lucide-react";
import api from "@/lib/api";
import {
  INPUT_CLASSES,
  SELECT_CLASSES,
  BLOOD_GROUPS,
  URGENCY_LABELS
} from "@/lib/constants";

export default function InventoryLedgerPage() {
  const router = useRouter();
  const { user, isAuthenticated, isBloodBank, isAdmin, isDonor, isHospital } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  const [inventory, setInventory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [hospitalRequests, setHospitalRequests] = useState<any[]>([]);

  // Transaction Modal State (Intake / Dispatch)
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"Intake" | "Dispatch">("Intake");
  const [txBloodGroup, setTxBloodGroup] = useState<string>("O+");
  const [txUnits, setTxUnits] = useState<number>(5);
  const [txSourceOrRecipient, setTxSourceOrRecipient] = useState<string>("");
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  // Fulfill Hospital Request Modal State
  const [fulfillModalReq, setFulfillModalReq] = useState<any | null>(null);
  const [dispatchUnits, setDispatchUnits] = useState<number>(1);
  const [fulfilling, setFulfilling] = useState(false);
  const [fulfillError, setFulfillError] = useState<string | null>(null);
  const [fulfillSuccess, setFulfillSuccess] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!isBloodBank && !isAdmin) {
        router.push("/dashboard");
      } else {
        loadData();
      }
    }
  }, [isMounted, isAuthenticated, isBloodBank, isAdmin, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, reqRes] = await Promise.all([
        api.get("/api/bloodinventory"),
        api.get("/api/bloodrequests/active"),
      ]);
      setInventory(invRes.data);
      setHospitalRequests(reqRes.data?.value || reqRes.data || []);
    } catch (e) {
      console.error("Failed to load inventory data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxSubmitting(true);
    setTxError(null);

    try {
      await api.post("/api/bloodinventory/transaction", {
        type: txType,
        bloodGroup: txBloodGroup,
        units: Number(txUnits),
        sourceOrRecipient: txSourceOrRecipient.trim(),
      });
      setShowTxModal(false);
      setTxSourceOrRecipient("");
      loadData();
    } catch (err: any) {
      setTxError(err.response?.data?.message || "Failed to record transaction.");
    } finally {
      setTxSubmitting(false);
    }
  };

  const handleFulfillRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fulfillModalReq) return;

    setFulfilling(true);
    setFulfillError(null);
    setFulfillSuccess(null);

    try {
      const res = await api.post("/api/bloodinventory/fulfill-request", {
        requestId: fulfillModalReq.id,
        unitsToDispatch: Number(dispatchUnits),
        dispatchNotes: `Dispatched from regional cryo-depot by ${user?.fullName}`,
      });
      setFulfillSuccess(res.data?.message || "Reserve units successfully dispatched to hospital.");
      setTimeout(() => {
        setFulfillModalReq(null);
        loadData();
      }, 1500);
    } catch (err: any) {
      setFulfillError(err.response?.data?.message || "Failed to dispatch reserve stock.");
    } finally {
      setFulfilling(false);
    }
  };

  if (!isMounted || (!isBloodBank && !isAdmin)) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Restricted Depot Access</h2>
          <p className="text-xs text-slate-500">
            Stock matrices and reserve allocation tools are restricted to certified Regional Blood Banks and System Administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-purple-600/25 shrink-0">
              <Package className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase">
                <Package className="w-3 h-3" />
                Comprehensive Inventory Ledger
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {user?.fullName}
              </h1>
              <p className="text-xs text-slate-500">
                {user?.address}, {user?.city} • License: <strong>{user?.licenseOrRegNumber || "DEPOT-CERT-OK"}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setTxType("Intake");
                setShowTxModal(true);
                setTxError(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Record Inward Intake
            </button>

            <button
              type="button"
              onClick={() => {
                setTxType("Dispatch");
                setShowTxModal(true);
                setTxError(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4" />
              Record Outward Dispatch
            </button>

            <Link
              href="/requests/new"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-all flex items-center gap-1.5"
            >
              <Droplet className="w-4 h-4 text-rose-500" />
              Broadcast Shortage
            </Link>
          </div>
        </div>

        {/* Inventory Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Depot Reserve Units
            </span>
            <p className="text-3xl font-black text-slate-900 mt-2">
              {inventory?.totalUnits ?? 0} <span className="text-sm font-bold text-slate-500">Units</span>
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Across all 8 ABO/Rh blood groups</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Critical Shortage Alerts
            </span>
            <p className="text-3xl font-black text-rose-600 mt-2">
              {inventory?.criticalShortageTypesCount ?? 0} <span className="text-sm font-bold text-slate-500">Groups</span>
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Below minimum threshold of 5 units</p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Hospital Requests
            </span>
            <p className="text-3xl font-black text-blue-600 mt-2">
              {hospitalRequests.length} <span className="text-sm font-bold text-slate-500">Needs</span>
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Eligible for direct depot fulfillment</p>
          </div>
        </div>

        {/* 8-Blood Groups Grid Matrix */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Live Cryo-Storage Stock Matrix
              </h2>
              <p className="text-xs text-slate-500">Available reserve units and minimum safety thresholds per blood group.</p>
            </div>
            <button
              onClick={loadData}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            {(inventory?.items || []).map((item: any) => {
              const isShortage = item.isCriticalShortage;

              return (
                <div
                  key={item.bloodGroup}
                  className={`p-4 rounded-3xl border transition-all text-center flex flex-col justify-between ${
                    isShortage
                      ? "bg-rose-50/80 border-rose-300 shadow-sm shadow-rose-500/10"
                      : "bg-white border-slate-200/90 shadow-sm"
                  }`}
                >
                  <div className="space-y-2">
                    <span className="text-2xl font-black text-slate-900 block">
                      {item.bloodGroup}
                    </span>

                    <div>
                      <p className={`text-3xl font-black ${isShortage ? "text-rose-600" : "text-slate-900"}`}>
                        {item.availableUnits}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold block">Units in Cryo</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 mt-3 space-y-1">
                    <span className="text-[10px] text-slate-500 block">
                      Min: {item.minThresholdUnits} units
                    </span>
                    {isShortage ? (
                      <span className="inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded bg-rose-200 text-rose-800 animate-pulse">
                        Critical Shortage
                      </span>
                    ) : (
                      <span className="inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Adequate
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two Columns: Fulfill Hospital Requests & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Fulfill Hospital Requests Panel */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Directly Fulfill Hospital Requests</h3>
                <p className="text-xs text-slate-500">Dispatch reserve units directly to hospital trauma units.</p>
              </div>
              <Send className="w-5 h-5 text-purple-600" />
            </div>

            {hospitalRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Pending Hospital Requests</p>
                <p className="text-[11px] text-slate-500">All external hospital needs are satisfied.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {hospitalRequests.map((req) => {
                  const urgencyInfo = URGENCY_LABELS[req.urgency] || URGENCY_LABELS[2];
                  const remaining = req.requiredUnits - req.fulfilledUnits;

                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center">
                            {req.bloodGroup}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{req.creatorName}</span>
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${urgencyInfo.badge}`}>
                            {urgencyInfo.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                          "{req.patientDiagnosis}"
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Ward: {req.wardOrBedNumber} • Remaining: <strong>{remaining} units</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setFulfillModalReq(req);
                          setDispatchUnits(Math.min(remaining, 2));
                          setFulfillError(null);
                          setFulfillSuccess(null);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all shrink-0"
                      >
                        Dispatch Reserve
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Inventory Transactions Log */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Recent Inventory Ledger Transactions</h3>
                <p className="text-xs text-slate-500">Audit trail of blood inward intake and outward dispatch.</p>
              </div>
              <Clock className="w-5 h-5 text-slate-400" />
            </div>

            {(!inventory?.recentTransactions || inventory.recentTransactions.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Transactions Logged</p>
                <p className="text-[11px] text-slate-500">Inward and dispatch records will populate here.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {inventory.recentTransactions.map((tx: any) => {
                  const isIntake = tx.type.toLowerCase() === "intake";

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-white flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isIntake ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}>
                          {isIntake ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <span>{tx.type}</span>
                            <span className="text-rose-600 font-extrabold">{tx.units} Units ({tx.bloodGroup})</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{tx.sourceOrRecipient}</span>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Inward / Outward Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                txType === "Intake" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}>
                {txType === "Intake" ? "Blood Inward / Intake" : "Blood Outward / Dispatch"}
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Record Ledger Movement
              </h3>
            </div>

            {txError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{txError}</span>
              </div>
            )}

            <form onSubmit={handleRecordTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Movement Type</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className={SELECT_CLASSES}
                  >
                    <option value="Intake">Intake (Inward)</option>
                    <option value="Dispatch">Dispatch (Outward)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Blood Group</label>
                  <select
                    value={txBloodGroup}
                    onChange={(e) => setTxBloodGroup(e.target.value)}
                    className={SELECT_CLASSES}
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Quantity of Units</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={txUnits}
                  onChange={(e) => setTxUnits(parseInt(e.target.value) || 1)}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {txType === "Intake" ? "Source (Drive / Facility / Camp)" : "Recipient (Hospital / Trauma Emergency)"}
                </label>
                <input
                  type="text"
                  required
                  value={txSourceOrRecipient}
                  onChange={(e) => setTxSourceOrRecipient(e.target.value)}
                  placeholder={txType === "Intake" ? "e.g. City Mobile Drive #12" : "e.g. St. Jude Emergency Surgery Ward"}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={txSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 ${
                    txType === "Intake"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                  }`}
                >
                  {txSubmitting ? "Updating Ledger..." : `Record ${txType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fulfill Hospital Request Modal */}
      {fulfillModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                Direct Reserve Dispatch
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Dispatch to {fulfillModalReq.creatorName}
              </h3>
              <p className="text-xs text-slate-500">
                Patient Diagnosis: <em>"{fulfillModalReq.patientDiagnosis}"</em>
              </p>
            </div>

            {fulfillError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{fulfillError}</span>
              </div>
            )}

            {fulfillSuccess ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-slate-900">{fulfillSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleFulfillRequest} className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Blood Group:</span>
                    <strong className="text-rose-600 font-black">{fulfillModalReq.bloodGroup}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hospital Ward / Bed:</span>
                    <strong className="text-slate-900">{fulfillModalReq.wardOrBedNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remaining Needed:</span>
                    <span className="text-slate-900 font-bold">
                      {fulfillModalReq.requiredUnits - fulfillModalReq.fulfilledUnits} Units
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Units to Dispatch from Depot</label>
                  <input
                    type="number"
                    min={1}
                    max={fulfillModalReq.requiredUnits - fulfillModalReq.fulfilledUnits}
                    required
                    value={dispatchUnits}
                    onChange={(e) => setDispatchUnits(parseInt(e.target.value) || 1)}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillModalReq(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={fulfilling}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {fulfilling ? "Dispatching..." : "Execute Reserve Dispatch"}
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
