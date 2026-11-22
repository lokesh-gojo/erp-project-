import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, CheckCircle, Target, Briefcase, BookOpen, AlertCircle, 
  Sparkles, TrendingUp, Building2, Zap, ArrowRight, ShieldAlert 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default function PlacementModeUI() {
  const [placementTests, setPlacementTests] = useState<any[]>([]);
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlacementData();
  }, []);

  const fetchPlacementData = async () => {
    try {
      const token = localStorage.getItem("jwt_token");
      const [testsRes, mlRes] = await Promise.all([
        fetch(`${API_BASE}/test/student/placement`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/ml/placement-intelligence`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn("AI intelligence fetch failed:", err);
          return null;
        })
      ]);

      const testsData = await testsRes.json();
      if (testsData.success) {
        setPlacementTests(testsData.tests);
      }

      if (mlRes && mlRes.ok) {
        const mlJson = await mlRes.json();
        if (mlJson.success) {
          setAiData(mlJson.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getReadinessScore = () => {
    if (placementTests.length === 0) return 0;
    const completed = placementTests.filter(t => t.status === 'completed');
    if (completed.length === 0) return 0;
    
    const totalPercentage = completed.reduce((acc, t) => {
      const maxScore = t.num_questions || 1;
      const score = t.score || 0;
      return acc + (score / maxScore) * 100;
    }, 0);
    
    return Math.round(totalPercentage / completed.length);
  };

  const getSkillBreakdown = () => {
    if (placementTests.length === 0) return [];
    
    const allSkillsMap: Record<string, { totalScore: number, maxScore: number }> = {};
    placementTests.forEach(t => {
      const skillName = t.subject || t.topic_title || 'General';
      if (!allSkillsMap[skillName]) {
        allSkillsMap[skillName] = { totalScore: 0, maxScore: 0 };
      }
      if (t.status === 'completed') {
        allSkillsMap[skillName].totalScore += (t.score || 0);
        allSkillsMap[skillName].maxScore += (t.num_questions || 1);
      }
    });

    const breakdown = Object.keys(allSkillsMap).map(skill => {
      const data = allSkillsMap[skill];
      const percentage = data.maxScore > 0 ? Math.round((data.totalScore / data.maxScore) * 100) : 0;
      return { skill, percentage };
    });
    
    return breakdown.sort((a, b) => b.percentage - a.percentage);
  };

  const readinessScore = getReadinessScore();
  const skillBreakdown = getSkillBreakdown();

  const pred = aiData?.placement_prediction;
  const tier = pred?.tier_details;
  const forecast = aiData?.performance_forecast;
  const weakDiag = aiData?.weak_area_diagnosis;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Readiness Overview */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-indigo-800">
              <Target className="h-5 w-5" /> Placement Readiness
            </CardTitle>
            <CardDescription>Your overall score based on placement modules.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-8 border-indigo-100 bg-white shadow-sm mb-3">
                <div 
                  className="absolute inset-0 rounded-full border-8 border-indigo-600"
                  style={{ 
                    clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`, 
                    opacity: readinessScore > 0 ? 1 : 0.1
                  }}
                ></div>
                <div className="text-3xl font-bold text-slate-800">{readinessScore}%</div>
              </div>
              <p className="text-xs font-semibold text-slate-600 text-center">
                {readinessScore >= 75 ? "Placement Ready! Excellent work." : "Complete all modules to boost hiring chances."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Company Tier & Placement Forecast Card */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-purple-50 via-white to-indigo-50 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" /> AI Company Tier Match
              </CardTitle>
              {tier && (
                <Badge className={`bg-${tier.badge_color === 'emerald' ? 'emerald' : (tier.badge_color === 'blue' ? 'blue' : 'purple')}-100 text-${tier.badge_color === 'emerald' ? 'emerald' : 'purple'}-700 border-0`}>
                  {tier.badge}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">Predictive ML model trained on recruitment cutoffs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Predicted Hiring Tier</p>
              <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{tier?.tier_name || "Evaluating Baseline..."}</h4>
              <p className="text-xs text-slate-600 font-medium mt-0.5">Est. CTC: <span className="text-purple-700 font-semibold">{tier?.ctc_range || "3.5 - 8.0 LPA"}</span></p>
            </div>

            {/* Target Companies Chips */}
            {tier?.target_companies && (
              <div className="space-y-1">
                <p className="text-[11px] text-slate-500 font-medium">Target Recruiters:</p>
                <div className="flex flex-wrap gap-1.5">
                  {tier.target_companies.slice(0, 4).map((comp: string) => (
                    <span key={comp} className="inline-flex items-center text-[10px] bg-white border border-purple-200 px-2 py-0.5 rounded-full font-medium text-slate-700 shadow-2xs">
                      <Building2 className="h-2.5 w-2.5 mr-1 text-purple-600" /> {comp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Forecast Momentum */}
            {forecast && forecast.has_data && (
              <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1 font-medium">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Momentum:
                </span>
                <span className="font-semibold text-slate-800">{forecast.momentum_badge}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skill Breakdown */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-slate-700" /> Skill Breakdown
            </CardTitle>
            <CardDescription className="text-xs">Performance across assessed core areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {skillBreakdown.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No skills data available yet.</p>
            ) : (
              skillBreakdown.map((item, index) => {
                const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-purple-500'];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div key={item.skill} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate max-w-[170px]">{item.skill}</span>
                      <span className="text-slate-500 font-semibold">{item.percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations & Weak-Area Remedial Banner */}
      {pred?.recommendations && pred.recommendations.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
          <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
                <Zap className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  AI Action Plan for Placement Selection
                </h4>
                <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                  {pred.recommendations[0]}
                </p>
              </div>
            </div>
            {weakDiag?.recommended_quiz && (
              <Button 
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-xs"
                onClick={() => {
                  if (placementTests.length > 0) {
                    const target = placementTests.find(t => t.status !== 'completed') || placementTests[0];
                    navigate(`/quiz/${target.test_id}`);
                  }
                }}
              >
                Start Remedial Sprint <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Placement Courses */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Placement Assessment Modules</h3>
            <p className="text-xs text-slate-500">Official campus recruitment practice modules aligned with national hiring standards.</p>
          </div>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading courses...</p>
        ) : placementTests.length === 0 ? (
          <Card className="bg-slate-50 border-dashed border-2 border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">No placement courses available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {placementTests.map((test) => (
              <Card key={test.test_id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={test.status === 'completed' ? "outline" : "default"} 
                           className={test.status === 'completed' ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}>
                      {test.status === 'completed' ? "Completed" : "Available"}
                    </Badge>
                    <span className="text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-xs">
                      {test.num_questions} Qs
                    </span>
                  </div>
                  <CardTitle className="text-base line-clamp-1">{test.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px]">
                    {test.subject || test.topic_title}
                  </p>
                  
                  {test.status === 'completed' ? (
                    <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-semibold text-xs">Score</span>
                      </div>
                      <span className="font-bold text-sm">{test.score} / {test.num_questions}</span>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                      onClick={() => navigate(`/quiz/${test.test_id}`)}
                    >
                      <Play className="h-4 w-4 mr-2" /> Start Course
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
