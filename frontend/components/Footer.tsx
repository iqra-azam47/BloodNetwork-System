import React from "react";
import Link from "next/link";
import { Droplet, Shield, Heart, PhoneCall, ExternalLink } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/30">
                <Droplet className="w-4 h-4 fill-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Blood<span className="text-rose-500">Network</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise clinical transfusion coordination and emergency blood mobilization network. Powered by AI donor triage and instantaneous facility inventory ledgers.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Transfusion Grid: 100% Operational
            </div>
          </div>

          {/* Col 2: Clinical Navigation */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Clinical Operations</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/requests" className="hover:text-rose-400 transition-colors">
                  Active Emergency Requests
                </Link>
              </li>
              <li>
                <Link href="/screening" className="hover:text-rose-400 transition-colors">
                  AI Medical Screening (Gemini)
                </Link>
              </li>
              <li>
                <Link href="/requests/new" className="hover:text-rose-400 transition-colors">
                  Broadcast Hospital Emergency Need
                </Link>
              </li>
              <li>
                <Link href="/inventory" className="hover:text-rose-400 transition-colors">
                  Depot Blood Inventory Ledger
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Role Isolation */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Access Portals</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Role 0: Verified Voluntary Blood Donors</li>
              <li>Role 1: Certified Hospital Transfusion Centers</li>
              <li>Role 2: Regional Blood Banks & Cryo Depots</li>
              <li>Role 3: Platform Super Administrator</li>
            </ul>
          </div>

          {/* Col 4: Emergency Assistance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Critical Trauma Support</h4>
            <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-900/50 text-rose-200">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 mb-1">
                <PhoneCall className="w-3.5 h-3.5" />
                24/7 Transfusion Dispatch
              </div>
              <p className="text-[11px] text-slate-300">
                Hospital emergency departments requiring urgent mass-casualty blood supplies call:
              </p>
              <p className="text-sm font-extrabold text-white mt-1">1-800-BLOOD-OPS</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} BloodNetwork Inc. Medical Transfusion Architecture. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <Shield className="w-3 h-3 text-emerald-400" /> HIPAA & Clinical Protocol Compliant
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
