"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Shield,
  Users,
  Building2,
  Package,
  Heart,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import api from "@/lib/api";
import {
  INPUT_CLASSES,
  SELECT_CLASSES,
  BLOOD_GROUPS,
  ROLE_NAMES
} from "@/lib/constants";

export default function AdminControlHubPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"pipeline" | "entities" | "audit">("pipeline");

  // Data
  const [stats, setStats] = useState<any | null>(null);
  const [pendingFacilities, setPendingFacilities] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User Filter & Search
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [userSearch, setUserSearch] = useState<string>("");

  // Audit Search
  const [auditSearch, setAuditSearch] = useState<string>("");

  // Add Facility Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFacilityName, setNewFacilityName] = useState("");
  const [newFacilityEmail, setNewFacilityEmail] = useState("");
  const [newFacilityPassword, setNewFacilityPassword] = useState("Password@123");
  const [newFacilityRole, setNewFacilityRole] = useState<number>(1);
  const [newFacilityPhone, setNewFacilityPhone] = useState("");
  const [newFacilityCity, setNewFacilityCity] = useState("");
  const [newFacilityAddress, setNewFacilityAddress] = useState("");
  const [newFacilityLicense, setNewFacilityLicense] = useState("");
  const [addingFacility, setAddingFacility] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Facility Modal
  const [editFacilityModal, setEditFacilityModal] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editLicense, setEditLicense] = useState("");
  const [editVerified, setEditVerified] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!isAdmin) {
        router.push("/dashboard");
      } else {
        loadAdminData();
      }
    }
  }, [isMounted, isAuthenticated, isAdmin, router]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, auditRes] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/admin/facilities/pending"),
        api.get("/api/admin/audit-logs?limit=50"),
      ]);
      setStats(statsRes.data);
      setPendingFacilities(pendingRes.data || []);
      setAuditLogs(auditRes.data || []);
      fetchUsers();
    } catch (e) {
      console.error("Failed to load admin data", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      let url = "/api/admin/users";
      const params = new URLSearchParams();
      if (userRoleFilter !== "ALL") params.append("role", userRoleFilter);
      if (userSearch.trim()) params.append("search", userSearch.trim());

      if (params.toString()) url += `?${params.toString()}`;
      const res = await api.get(url);
      setUsersList(res.data || []);
    } catch (e) {
      console.error("Failed to fetch users", e);
    }
  };

  const handleAuditSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.get(`/api/admin/audit-logs?search=${encodeURIComponent(auditSearch)}&limit=100`);
      setAuditLogs(res.data || []);
    } catch (e) {
      console.error("Failed to search logs", e);
    }
  };

  // Facility Approval Pipeline Actions
  const handleApproveFacility = async (facilityId: string, approve: boolean) => {
    try {
      await api.post("/api/admin/facilities/approve", {
        facilityId,
        approve,
        reason: approve ? "Clinical credentials and license verified" : "Failed verification audit",
      });
      loadAdminData();
    } catch (e) {
      console.error("Failed to process approval", e);
    }
  };

  // Delete Entity Action
  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently revoke and delete the account for "${name}"?`)) {
      return;
    }
    try {
      await api.delete(`/api/admin/users/${userId}`);
      loadAdminData();
    } catch (e) {
      console.error("Failed to delete user", e);
    }
  };

  // Add Facility Submit
  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingFacility(true);
    setAddError(null);

    try {
      await api.post("/api/admin/facilities", {
        fullName: newFacilityName.trim(),
        email: newFacilityEmail.trim(),
        password: newFacilityPassword,
        role: Number(newFacilityRole),
        phoneNumber: newFacilityPhone.trim(),
        city: newFacilityCity.trim(),
        address: newFacilityAddress.trim(),
        licenseOrRegNumber: newFacilityLicense.trim(),
        isVerified: true,
      });
      setShowAddModal(false);
      setNewFacilityName("");
      setNewFacilityEmail("");
      setNewFacilityPhone("");
      setNewFacilityCity("");
      setNewFacilityAddress("");
      setNewFacilityLicense("");
      loadAdminData();
    } catch (err: any) {
      setAddError(err.response?.data?.message || "Failed to create facility.");
    } finally {
      setAddingFacility(false);
    }
  };

  // Edit Facility Submit
  const handleUpdateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFacilityModal) return;

    setSavingEdit(true);
    try {
      await api.put(`/api/admin/facilities/${editFacilityModal.id}`, {
        fullName: editName.trim(),
        phoneNumber: editPhone.trim(),
        city: editCity.trim(),
        address: editAddress.trim(),
        licenseOrRegNumber: editLicense.trim(),
        isVerified: editVerified,
      });
      setEditFacilityModal(null);
      loadAdminData();
    } catch (e) {
      console.error("Failed to update facility", e);
    } finally {
      setSavingEdit(false);
    }
  };

  if (!isMounted || !isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-md text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Administrator Access Required</h2>
          <p className="text-xs text-slate-500">
            This control hub is strictly restricted to platform super administrators.
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
            <div className="w-16 h-16 rounded-2xl bg-amber-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-600/25 shrink-0">
              <Shield className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Dedicated Platform Governance Control Hub
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Super Administrator Terminal
              </h1>
              <p className="text-xs text-slate-500">
                Logged in as <strong>{user?.email}</strong> • Full Entity Lifecycle & Security Auditing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setShowAddModal(true);
                setAddError(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              Onboard Facility Manually
            </button>
            <button
              onClick={loadAdminData}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Stats KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Users</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.totalUsers ?? 0}</p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Donors</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{stats?.totalDonors ?? 0}</p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Hospitals</span>
            <p className="text-2xl font-black text-blue-600 mt-1">{stats?.totalHospitals ?? 0}</p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Banks</span>
            <p className="text-2xl font-black text-purple-600 mt-1">{stats?.totalBloodBanks ?? 0}</p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending Approvals</span>
            <p className={`text-2xl font-black mt-1 ${stats?.pendingFacilityApprovals > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {stats?.pendingFacilityApprovals ?? 0}
            </p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Needs</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.activeBloodRequests ?? 0}</p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Verified Donations</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.completedDonations ?? 0}</p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Dispatched Units</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats?.totalUnitsDispatched ?? 0}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("pipeline")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "pipeline"
                ? "bg-amber-100 text-amber-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Facility Approval Pipeline</span>
            {pendingFacilities.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-black">
                {pendingFacilities.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("entities")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "entities"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Full Entity Management (CRUD)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "audit"
                ? "bg-rose-100 text-rose-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Immutable Platform Audit Trail</span>
          </button>
        </div>

        {/* TAB 1: FACILITY APPROVAL PIPELINE */}
        {activeTab === "pipeline" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Facility Verification & Credentialing Queue
              </h3>
              <p className="text-xs text-slate-500">
                Newly registered hospitals and blood banks are quarantined until government medical licensing credentials are confirmed.
              </p>
            </div>

            {pendingFacilities.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Queue is Clear!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All registered hospital facilities and regional blood banks have been audited and verified.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingFacilities.map((fac) => (
                  <div
                    key={fac.id}
                    className="p-5 rounded-2xl border border-amber-200 bg-amber-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          fac.role === 1 ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                        }`}>
                          {fac.roleName}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{fac.fullName}</h4>
                      </div>

                      <div className="text-xs text-slate-600 space-y-0.5">
                        <p>Official Email: <strong>{fac.email}</strong> • Phone: {fac.phoneNumber}</p>
                        <p>Address: {fac.address}, {fac.city}</p>
                        <p>
                          Government License / Registration ID:{" "}
                          <strong className="font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                            {fac.licenseOrRegNumber || "NOT PROVIDED"}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <button
                        type="button"
                        onClick={() => handleApproveFacility(fac.id, false)}
                        className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproveFacility(fac.id, true)}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve Facility
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FULL ENTITY CRUD */}
        {activeTab === "entities" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Registered Entities Directory
                </h3>
                <p className="text-xs text-slate-500">
                  Manage all Donors, Hospitals, Blood Banks, and Administrators.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                  }}
                  className={SELECT_CLASSES}
                >
                  <option value="ALL">All Roles</option>
                  <option value="0">Donors (Role 0)</option>
                  <option value="1">Hospitals (Role 1)</option>
                  <option value="2">Blood Banks (Role 2)</option>
                  <option value="3">Administrators (Role 3)</option>
                </select>

                <button
                  type="button"
                  onClick={fetchUsers}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow"
                >
                  Filter
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Name & Entity</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Email & Phone</th>
                    <th className="pb-3">City / Address</th>
                    <th className="pb-3">License / Blood</th>
                    <th className="pb-3">Verification</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900">
                        {u.fullName}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 0 ? "bg-rose-100 text-rose-800" :
                          u.role === 1 ? "bg-blue-100 text-blue-800" :
                          u.role === 2 ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {u.roleName}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-600">
                        <div>{u.email}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.phoneNumber}</div>
                      </td>
                      <td className="py-3.5 text-slate-600">
                        <div>{u.city}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{u.address}</div>
                      </td>
                      <td className="py-3.5 font-mono text-[11px]">
                        {u.role === 0 ? (
                          <span className="font-bold text-rose-600">{u.bloodGroup || "O+"}</span>
                        ) : (
                          <span className="text-slate-700">{u.licenseOrRegNumber || "N/A"}</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        {u.role !== 3 && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditFacilityModal(u);
                                setEditName(u.fullName);
                                setEditPhone(u.phoneNumber);
                                setEditCity(u.city);
                                setEditAddress(u.address);
                                setEditLicense(u.licenseOrRegNumber || "");
                                setEditVerified(u.isVerified);
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                              title="Edit Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.fullName)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                              title="Delete Entity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: IMMUTABLE AUDIT TRAIL */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Searchable Platform Audit Trail
                </h3>
                <p className="text-xs text-slate-500">
                  Immutable record of every request creation, pledge dispatch, clinical verification, and admin approval.
                </p>
              </div>

              <form onSubmit={handleAuditSearch} className="flex items-center gap-2">
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search action or email..."
                  className={INPUT_CLASSES}
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Timestamp (UTC)</th>
                    <th className="pb-3">Action Identifier</th>
                    <th className="pb-3">Actor Email</th>
                    <th className="pb-3">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 text-slate-400 shrink-0">
                        {new Date(log.timestamp).toISOString().replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 font-sans font-medium">{log.actorEmail}</td>
                      <td className="py-3 text-slate-700 font-sans font-medium">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Facility Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Admin Privilege
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Onboard Medical Facility
              </h3>
            </div>

            {addError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateFacility} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Facility Type</label>
                  <select
                    value={newFacilityRole}
                    onChange={(e) => setNewFacilityRole(parseInt(e.target.value))}
                    className={SELECT_CLASSES}
                  >
                    <option value={1}>Hospital Facility</option>
                    <option value={2}>Regional Blood Bank</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Official Name</label>
                  <input
                    type="text"
                    required
                    value={newFacilityName}
                    onChange={(e) => setNewFacilityName(e.target.value)}
                    placeholder="e.g. City Trauma Center"
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newFacilityEmail}
                    onChange={(e) => setNewFacilityEmail(e.target.value)}
                    placeholder="admin@citytrauma.org"
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Default Password</label>
                  <input
                    type="text"
                    required
                    value={newFacilityPassword}
                    onChange={(e) => setNewFacilityPassword(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Emergency Phone</label>
                  <input
                    type="tel"
                    required
                    value={newFacilityPhone}
                    onChange={(e) => setNewFacilityPhone(e.target.value)}
                    placeholder="+1 (555) 0199"
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">City</label>
                  <input
                    type="text"
                    required
                    value={newFacilityCity}
                    onChange={(e) => setNewFacilityCity(e.target.value)}
                    placeholder="Metropolis"
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Address</label>
                <input
                  type="text"
                  required
                  value={newFacilityAddress}
                  onChange={(e) => setNewFacilityAddress(e.target.value)}
                  placeholder="Street campus address"
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Registration / License ID</label>
                <input
                  type="text"
                  required
                  value={newFacilityLicense}
                  onChange={(e) => setNewFacilityLicense(e.target.value)}
                  placeholder="e.g. CLINIC-ADM-2026"
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={addingFacility}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
                >
                  {addingFacility ? "Onboarding..." : "Onboard Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Facility Modal */}
      {editFacilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-5">
            <h3 className="text-xl font-black text-slate-900">
              Edit {editFacilityModal.roleName} Details
            </h3>

            <form onSubmit={handleUpdateFacility} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phone</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">City</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Address</label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">License / Reg Number</label>
                <input
                  type="text"
                  value={editLicense}
                  onChange={(e) => setEditLicense(e.target.value)}
                  className={INPUT_CLASSES}
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editVerified}
                  onChange={(e) => setEditVerified(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-xs font-bold text-slate-900">Entity is Approved & Verified</span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditFacilityModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
