"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  UserCheck,
  ArrowRight,
  RefreshCw,
  Info,
  Heart,
  Droplet
} from "lucide-react";
import api from "@/lib/api";
import { INPUT_CLASSES, TEXTAREA_CLASSES } from "@/lib/constants";

export default function ScreeningPage() {
  const [screeningMode, setScreeningMode] = useState<"report" | "signs">("signs");

  // Inputs
  const [reportText, setReportText] = useState("");
  const [hemoglobinLevel, setHemoglobinLevel] = useState<number>(13.5);
  const [hasChronicIllness, setHasChronicIllness] = useState(false);
  const [recentTattoo, setRecentTattoo] = useState(false);
  const [malariaTravel, setMalariaTravel] = useState(false);

  // Physical signs for "Check Signs (No Report)"
  const [paleSigns, setPaleSigns] = useState(false);
  const [fatigueSigns, setFatigueSigns] = useState(false);
  const [breathShortness, setBreathShortness] = useState(false);

  // States
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (mode: "report" | "signs") => {
    setScreeningMode(mode);
    setResult(null);
    setError(null);
    if (mode === "signs") {
      // Per Section 4 rules: "If user selects 'Check Signs (No Report)', the frontend must send an estimated baseline (13.5 g/dL) unless physical anemia signs are flagged"
      setHemoglobinLevel(paleSigns || fatigueSigns ? 11.0 : 13.5);
    }
  };

  const handleSignToggle = (type: "pale" | "fatigue" | "breath", val: boolean) => {
    let p = paleSigns;
    let f = fatigueSigns;
    let b = breathShortness;

    if (type === "pale") {
      p = val;
      setPaleSigns(val);
    }
    if (type === "fatigue") {
      f = val;
      setFatigueSigns(val);
    }
    if (type === "breath") {
      b = val;
      setBreathShortness(val);
    }

    // Dynamic adjustment of estimated baseline Hb
    if (p || f) {
      setHemoglobinLevel(11.2);
    } else {
      setHemoglobinLevel(13.5);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true);
    setError(null);
    setResult(null);

    // Baseline calculation enforcement per rules
    let effectiveHb = hemoglobinLevel;
    if (screeningMode === "signs") {
      effectiveHb = (paleSigns || fatigueSigns) ? 11.2 : (hemoglobinLevel > 0 ? hemoglobinLevel : 13.5);
    }

    const payload = {
      reportTextOrSymptoms: screeningMode === "report" ? reportText : (
        `Physical check: Pale Signs=${paleSigns}, Chronic Fatigue=${fatigueSigns}, Shortness of Breath=${breathShortness}`
      ),
      hemoglobinLevel: effectiveHb,
      hasChronicIllness,
      recentTattooOrPiercingInLast6Months: recentTattoo,
      traveledToMalariaProneAreaRecently: malariaTravel,
      hasFatigueOrWeakness: fatigueSigns,
      hasPaleSkinOrGums: paleSigns,
      hasShortnessOfBreath: breathShortness,
    };

    try {
      const res = await api.post("/api/MedicalScreening/evaluate-donor", payload);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to communicate with medical screening engine. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            AI Hematology Triage
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Donor Medical Eligibility Screening
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Verify transfusion eligibility before traveling to donation centers. Powered by Google Gemini AI and international clinical blood banking guidelines.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto p-1.5 bg-slate-200/80 rounded-2xl">
          <button
            type="button"
            onClick={() => handleModeChange("signs")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              screeningMode === "signs"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Check Signs (No Report)
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("report")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              screeningMode === "report"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            CBC Lab Report / Text
          </button>
        </div>

        {/* Screening Form Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <form onSubmit={handleEvaluate} className="space-y-6">
            {/* Mode 1: Physical Signs Checklist */}
            {screeningMode === "signs" && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-rose-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Physical Anemia & Wellness Checklist
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Baseline: <strong className="text-slate-900">{hemoglobinLevel.toFixed(1)} g/dL</strong>
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  If you have not had a recent CBC lab test, our algorithm assumes a healthy baseline of 13.5 g/dL unless physical anemia indicators are observed below.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    paleSigns ? "bg-rose-50/70 border-rose-300" : "bg-white border-slate-200 hover:border-slate-300"
                  }`}>
                    <input
                      type="checkbox"
                      checked={paleSigns}
                      onChange={(e) => handleSignToggle("pale", e.target.checked)}
                      className="mt-1 w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Pale Skin / Gums</span>
                      <span className="text-[11px] text-slate-500">Noticeable pallor in conjunctiva or nails</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    fatigueSigns ? "bg-rose-50/70 border-rose-300" : "bg-white border-slate-200 hover:border-slate-300"
                  }`}>
                    <input
                      type="checkbox"
                      checked={fatigueSigns}
                      onChange={(e) => handleSignToggle("fatigue", e.target.checked)}
                      className="mt-1 w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Chronic Fatigue</span>
                      <span className="text-[11px] text-slate-500">Unexplained weakness or dizziness</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    breathShortness ? "bg-rose-50/70 border-rose-300" : "bg-white border-slate-200 hover:border-slate-300"
                  }`}>
                    <input
                      type="checkbox"
                      checked={breathShortness}
                      onChange={(e) => handleSignToggle("breath", e.target.checked)}
                      className="mt-1 w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Shortness of Breath</span>
                      <span className="text-[11px] text-slate-500">Dyspnea on mild physical exertion</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Mode 2: CBC Lab Report Text / Upload */}
            {screeningMode === "report" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 block">
                    CBC Diagnostic Report Findings or Symptoms Text
                  </label>
                  <button
                    type="button"
                    onClick={() => setReportText("Hemoglobin: 14.5 g/dL, Hematocrit: 43%, Platelets: 240,000/mcL, WBC: 6,800/mcL, No infection markers.")}
                    className="text-[11px] text-rose-600 font-bold hover:underline"
                  >
                    Paste Sample Normal CBC
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Paste laboratory notes, complete blood count values, or current physical health remarks..."
                  className={TEXTAREA_CLASSES}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Exact Hemoglobin Value (g/dL)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={25}
                      required
                      value={hemoglobinLevel}
                      onChange={(e) => setHemoglobinLevel(parseFloat(e.target.value) || 0)}
                      className={INPUT_CLASSES}
                    />
                  </div>
                  <div className="flex items-end gap-2 pb-1">
                    <button
                      type="button"
                      onClick={() => setHemoglobinLevel(13.8)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                    >
                      13.8 (Normal)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHemoglobinLevel(15.2)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                    >
                      15.2 (High)
                    </button>
                    <button
                      type="button"
                      onClick={() => setHemoglobinLevel(11.0)}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700"
                    >
                      11.0 (Low Anemic)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Contraindications Assessment (Mandatory for both modes) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Key Clinical Contraindications & Deferral Windows
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  hasChronicIllness ? "bg-rose-50 border-rose-300" : "bg-white border-slate-200 hover:border-slate-300"
                }`}>
                  <input
                    type="checkbox"
                    checked={hasChronicIllness}
                    onChange={(e) => setHasChronicIllness(e.target.checked)}
                    className="mt-1 w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Chronic Illness</span>
                    <span className="text-[11px] text-slate-500">Heart disease, diabetes with insulin, hepatitis, HIV</span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  recentTattoo ? "bg-rose-50 border-rose-300" : "bg-white border-slate-200 hover:border-slate-300"
                }`}>
                  <input
                    type="checkbox"
                    checked={recentTattoo}
                    onChange={(e) => setRecentTattoo(e.target.checked)}
                    className="mt-1 w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Tattoo / Piercing</span>
                    <span className="text-[11px] text-slate-500">Needle procedure within the last 6 months</span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  malariaTravel ? "bg-rose-50 border-rose-300" : "bg-white border-slate-200 hover:border-slate-300"
                }`}>
                  <input
                    type="checkbox"
                    checked={malariaTravel}
                    onChange={(e) => setMalariaTravel(e.target.checked)}
                    className="mt-1 w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Malaria Zone Travel</span>
                    <span className="text-[11px] text-slate-500">Travel to endemic malaria areas within past 3-12 months</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isEvaluating}
              className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/25 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Clinical Biomarkers with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute AI Medical Evaluation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Result Card */}
          {result && (
            <div className={`p-6 sm:p-8 rounded-3xl border transition-all shadow-md ${
              result.isEligible
                ? "bg-emerald-50/70 border-emerald-300/80"
                : "bg-amber-50/70 border-amber-300/80"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                    result.isEligible ? "bg-emerald-600 shadow-emerald-600/30" : "bg-amber-600 shadow-amber-600/30"
                  }`}>
                    {result.isEligible ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div>
                    <span className={`inline-block text-[11px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      result.isEligible
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}>
                      {result.isEligible ? "Eligible For Whole Blood Donation" : "Temporary Clinical Deferral"}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                      {result.eligibilitySummary}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Screening Engine</span>
                  <span className="text-xs font-bold text-slate-700">{result.screeningSource}</span>
                </div>
              </div>

              <div className="py-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Clinical Insights & Rationale:
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {result.clinicalInsights}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Evaluated at: {new Date(result.evaluatedAt).toLocaleString()}
                </span>

                {result.isEligible ? (
                  <Link
                    href="/requests"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Droplet className="w-3.5 h-3.5 fill-white" />
                    Browse Active Hospital Needs & Pledge
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPaleSigns(false);
                      setFatigueSigns(false);
                      setBreathShortness(false);
                      setRecentTattoo(false);
                      setMalariaTravel(false);
                      setHasChronicIllness(false);
                      setHemoglobinLevel(13.5);
                      setResult(null);
                    }}
                    className="text-xs font-bold text-amber-800 hover:underline"
                  >
                    Reset & Retest Parameters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
