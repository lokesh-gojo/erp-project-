import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle, Target, Briefcase, BookOpen, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default function PlacementModeUI() {
  const [placementTests, setPlacementTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlacementTests();
  }, []);

  const fetchPlacementTests = async () => {
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/test/student/placement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPlacementTests(data.tests);
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
    
    // Average score percentage of completed tests
    const totalPercentage = completed.reduce((acc, t) => {
      // Assuming score is out of num_questions, or we just calculate an estimated percentage
      const maxScore = t.num_questions;
      const score = t.score || 0;
      return acc + (score / maxScore) * 100;
    }, 0);
    
    return Math.round(totalPercentage / completed.length);
  };

  const readinessScore = getReadinessScore();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Readiness Overview */}
        <Card className="flex-1 border-slate-200 shadow-sm bg-gradient-to-br from-indigo-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-indigo-800">
              <Target className="h-5 w-5" /> Placement Readiness
            </CardTitle>
            <CardDescription>Your overall score based on placement modules.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative flex items-center justify-center h-32 w-32 rounded-full border-8 border-indigo-100 bg-white shadow-sm mb-4">
                <div 
                  className="absolute inset-0 rounded-full border-8 border-indigo-600"
                  style={{ 
                    clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`, 
                    // This is a simple visual hack, a real circular progress would use SVG
                    opacity: readinessScore > 0 ? 1 : 0.1
                  }}
                ></div>
                <div className="text-4xl font-bold text-slate-800">{readinessScore}%</div>
              </div>
              <p className="text-sm font-medium text-slate-600">
                {readinessScore >= 75 ? "Placement Ready! Excellent work." : "Keep practicing to improve your score."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Skill Breakdown (Mocked for UI as per requirement) */}
        <Card className="flex-1 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-slate-700" /> Skill Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">Aptitude</span>
                <span className="text-slate-500">82%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">SQL</span>
                <span className="text-slate-500">90%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">Python</span>
                <span className="text-slate-500">74%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '74%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">React</span>
                <span className="text-slate-500">65%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Placement Courses</h3>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {placementTests.map((test) => (
              <Card key={test.test_id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={test.status === 'completed' ? "outline" : "default"} 
                           className={test.status === 'completed' ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}>
                      {test.status === 'completed' ? "Completed" : "Available"}
                    </Badge>
                    <span className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-200 shadow-sm">
                      {test.num_questions} Qs
                    </span>
                  </div>
                  <CardTitle className="text-lg line-clamp-1">{test.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm text-slate-600 line-clamp-2 min-h-[40px]">
                    {test.subject} - {test.topic_title}
                  </p>
                  
                  {test.status === 'completed' ? (
                    <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold text-sm">Completed</span>
                      </div>
                      <span className="font-bold">{test.score} / {test.num_questions}</span>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                      onClick={() => navigate(`/test/instructions/${test.test_id}`)}
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
