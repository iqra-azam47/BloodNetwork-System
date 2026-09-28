"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Droplet,
  Activity,
  PlusCircle,
  Package,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  Heart,
  ChevronDown
} from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isDonor, isHospital, isBloodBank, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getRoleBadge = (role?: number) => {
    switch (role) {
      case 0:
        return { label: "Donor", bg: "bg-rose-100 text-rose-700 border-rose-200" };
      case 1:
        return { label: "Hospital", bg: "bg-blue-100 text-blue-700 border-blue-200" };
      case 2:
        return { label: "Blood Bank", bg: "bg-purple-100 text-purple-700 border-purple-200" };
      case 3:
        return { label: "Super Admin", bg: "bg-amber-100 text-amber-700 border-amber-200" };
      default:
        return { label: "Guest", bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const navLinks = [
    { href: "/requests", label: "Emergency Feed", icon: Droplet, show: true },
    { href: "/screening", label: "AI Screening", icon: Activity, show: true },
    { href: "/dashboard", label: isHospital ? "Hospital Operations" : isDonor ? "Donor Portal" : "Dashboard", icon: Heart, show: isAuthenticated && (isDonor || isHospital) },
    { href: "/requests/new", label: "Broadcast Need", icon: PlusCircle, show: isAuthenticated && (isHospital || isBloodBank || isAdmin) },
    { href: "/inventory", label: "Blood Ledger", icon: Package, show: isAuthenticated && (isBloodBank || isAdmin) },
    { href: "/admin", label: "Admin Hub", icon: Shield, show: isAuthenticated && isAdmin },
  ];

  const roleInfo = getRoleBadge(user?.role);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <Droplet className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                Blood<span className="text-rose-600">Network</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 block -mt-1 uppercase">
                Enterprise Transfusion Grid
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.filter(l => l.show).map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-rose-50 text-rose-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-rose-600" : "text-slate-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Action Profile / Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[130px]">
                      {user.fullName}
                    </p>
                    <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded border ${roleInfo.bg}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-400">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                      <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded border ${roleInfo.bg}`}>
                        {roleInfo.label} {user.bloodGroup ? `• (${user.bloodGroup})` : ""}
                      </span>
                    </div>

                    <div className="py-1">
                      {isDonor && (
                        <Link
                          href="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-rose-600"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          My Donation History & Badges
                        </Link>
                      )}
                      {isHospital && (
                        <Link
                          href="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          Incoming Pledges & Requests
                        </Link>
                      )}
                      {(isBloodBank || isAdmin) && (
                        <Link
                          href="/inventory"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-purple-600"
                        >
                          <Package className="w-3.5 h-3.5" />
                          Blood Bank Inventory Ledger
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-600"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Admin Approval Hub
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 transition-all hover:shadow-lg"
                >
                  Register Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2">
          {navLinks.filter(l => l.show).map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive ? "bg-rose-50 text-rose-600" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}

          <div className="border-t border-slate-100 pt-3">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-slate-50 rounded-xl">
                  <p className="text-xs font-bold text-slate-900">{user.fullName}</p>
                  <p className="text-[11px] text-slate-500">{user.email}</p>
                  <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${roleInfo.bg}`}>
                    {roleInfo.label}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
