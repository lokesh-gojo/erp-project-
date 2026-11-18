import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Upload, Sparkles, CheckCircle2, XCircle, AlertCircle, 
  ArrowRight, Award, Building2, Briefcase, RefreshCw, Check, Copy, TrendingUp
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

interface ScanResult {
  file_name: string;
  word_count: number;
  ats_score: number;
  ats_rating: string;
  section_audit: Record<string, boolean>;
  contact_audit: {
    has_email: boolean;
    has_phone: boolean;
    has_github: boolean;
    has_linkedin: boolean;
  };
  skills_found: string[];
  skills_count: number;
  tier_match: {
    tier_name: string;
    badge: string;
    color: string;
    target_companies: string[];
    verdict: string;
  };
  missing_keywords: {
    tier1_product: string[];
    tier2_specialist: string[];
  };
  action_verbs_used: string[];
  recommendations: string[];
}

export default function ResumeATSScannerUI() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("Software Engineer / SDE");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      handleScan(droppedFile);
    }
  };

  const handleScan = async (selectedFile?: File) => {
    const fileToScan = selectedFile || file;
    if (!fileToScan) return;

    setScanning(true);
    setErrorMsg("");

    try {
      const token = localStorage.getItem("jwt_token");
      const formData = new FormData();
      formData.append("file", fileToScan);
      formData.append("file_name", fileToScan.name);
      formData.append("target_role", targetRole);

      const res = await fetch(`${API_BASE}/ml/scan-resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.status === 401) {
        setErrorMsg("Session expired. Please log in again.");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setErrorMsg(data.error || "Failed to analyze resume.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error uploading resume. Check server connection.");
    } finally {
      setScanning(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 stroke-emerald-500";
    if (score >= 65) return "text-blue-500 stroke-blue-500";
    return "text-amber-500 stroke-amber-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 65) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 shadow-lg border border-indigo-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300 animate-pulse" /> AI Resume Intelligence
            </div>
            <h2 className="text-2xl font-bold tracking-tight">AI Resume & ATS Placement Scanner</h2>
            <p className="text-sm text-indigo-200/80 max-w-2xl">
              Upload your CV to audit ATS keyword compatibility, evaluate placement tier eligibility (Tier 1 Product to Tier 3 Mass), and receive actionable phrasing enhancements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="bg-white/10 text-white border border-white/20 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="Software Engineer / SDE" className="text-slate-900">Target: Software Engineer / SDE</option>
              <option value="Full Stack Developer" className="text-slate-900">Target: Full Stack Developer</option>
              <option value="Data Engineer / Analyst" className="text-slate-900">Target: Data Engineer / Analyst</option>
              <option value="Embedded / Core Systems" className="text-slate-900">Target: Embedded & Core Systems</option>
            </select>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer ${
              dragActive 
                ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]" 
                : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleFileDrop}
            onClick={() => document.getElementById("resume-input")?.click()}
          >
            <input
              id="resume-input"
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  handleScan(f);
                }
              }}
            />
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Upload className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {file ? file.name : "Drop your Resume here, or browse files"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
              Supports PDF, DOCX, and TXT documents up to 25MB. Instant ATS scoring and recruitment tier match.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button 
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                disabled={scanning}
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById("resume-input")?.click();
                }}
              >
                {scanning ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> Analyzing Resume...
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5 mr-2" /> Select Resume
                  </>
                )}
              </Button>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {result && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ATS Score Gauge */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ATS Compliance Score
                </CardDescription>
                <CardTitle className="text-2xl font-bold flex items-center justify-between">
                  <span>{result.ats_score} <span className="text-sm font-normal text-slate-400">/ 100</span></span>
                  <Badge variant="outline" className={`text-xs ${getScoreBg(result.ats_score)}`}>
                    {result.ats_rating}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      result.ats_score >= 80 ? "bg-emerald-500" : result.ats_score >= 65 ? "bg-blue-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${result.ats_score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Audited across formatting, section markers, contact verification, and keyword density.
                </p>
              </CardContent>
            </Card>

            {/* Placement Tier Match */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Recruitment Tier Match
                </CardDescription>
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  <span className="truncate">{result.tier_match?.tier_name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-2">
                  {result.tier_match?.target_companies.map((c, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-slate-50 border-slate-200 text-slate-700">
                      {c}
                    </Badge>
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {result.tier_match?.verdict}
                </p>
              </CardContent>
            </Card>

            {/* Skills & Action Verbs */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Identified Skill Density
                </CardDescription>
                <CardTitle className="text-2xl font-bold flex items-center justify-between text-slate-800">
                  <span>{result.skills_count} <span className="text-sm font-normal text-slate-400">Skills Detected</span></span>
                  <Award className="h-5 w-5 text-purple-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold">{result.action_verbs_used.length}</span> high-impact action verbs used ({result.action_verbs_used.slice(0, 4).join(", ")}...)
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Total document word count: <span className="font-medium">{result.word_count} words</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Audit Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Section & Contact Audit */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Essential Section & Contact Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  {Object.entries(result.section_audit).map(([sec, found]) => (
                    <div key={sec} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                      <span className="font-medium capitalize text-slate-700">{sec} Section</span>
                      {found ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <Check className="h-3.5 w-3.5" /> Detected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                          <XCircle className="h-3.5 w-3.5" /> Missing
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 block mb-2">Professional Links & Contact:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`p-2 rounded-lg border flex items-center gap-2 ${result.contact_audit.has_email ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" : "bg-red-50/50 border-red-200 text-red-800"}`}>
                      {result.contact_audit.has_email ? <Check className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />} Email Verified
                    </div>
                    <div className={`p-2 rounded-lg border flex items-center gap-2 ${result.contact_audit.has_phone ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" : "bg-red-50/50 border-red-200 text-red-800"}`}>
                      {result.contact_audit.has_phone ? <Check className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />} Phone Contact
                    </div>
                    <div className={`p-2 rounded-lg border flex items-center gap-2 ${result.contact_audit.has_github ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" : "bg-amber-50/50 border-amber-200 text-amber-800"}`}>
                      {result.contact_audit.has_github ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />} GitHub Profile
                    </div>
                    <div className={`p-2 rounded-lg border flex items-center gap-2 ${result.contact_audit.has_linkedin ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" : "bg-amber-50/50 border-amber-200 text-amber-800"}`}>
                      {result.contact_audit.has_linkedin ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />} LinkedIn Profile
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Skills Found & Missing Keywords */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                  <TrendingUp className="h-4 w-4 text-indigo-600" /> Keyword & Skill Gap Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-2">Verified Skills in Resume:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {result.skills_found.map((s, i) => (
                      <Badge key={i} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 block mb-1">
                    Missing Keywords to Unlock Tier 1 (Product Companies):
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {result.missing_keywords.tier1_product.map((k, i) => (
                      <Badge key={i} variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-xs font-mono">
                        + {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actionable Recommendations */}
          <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-indigo-50/30 to-purple-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-950">
                <Briefcase className="h-4 w-4 text-indigo-600" /> Strategic Recommendations for Campus Drives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-slate-700">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span dangerouslySetInnerHTML={{ __html: rec }} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
