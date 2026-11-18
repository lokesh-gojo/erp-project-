import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, Send, Sparkles, CheckCircle2, RefreshCw, Trophy, 
  HelpCircle, ArrowRight, Clock, Award, ShieldAlert, ChevronRight, MessageSquare
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

interface Question {
  id: string;
  topic: string;
  text: string;
  question_number?: number;
}

interface Evaluation {
  overall_score: number;
  rating: string;
  breakdown: {
    technical_accuracy: number;
    communication_clarity: number;
    depth_of_knowledge: number;
  };
  matched_keywords: string[];
  strengths: string[];
  improvements: string[];
  model_answer: string;
  next_question: Question | null;
  is_complete: boolean;
}

export default function MockInterviewUI() {
  const [domain, setDomain] = useState("tech_cs");
  const [roleTitle, setRoleTitle] = useState("Software Engineer");
  const [inSession, setInSession] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Current Question & Answer State
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(4);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  // Completed Session History
  const [sessionHistory, setSessionHistory] = useState<Array<{
    question: string;
    answer: string;
    score: number;
  }>>([]);
  const [interviewFinished, setInterviewFinished] = useState(false);

  const startInterviewSession = async () => {
    setLoading(true);
    setInterviewFinished(false);
    setSessionHistory([]);
    setEvaluation(null);
    setStudentAnswer("");

    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/ml/interview/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ domain, role_title: roleTitle })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCurrentQuestion(data.data.question);
        setQuestionIndex(data.data.current_index || 1);
        setTotalQuestions(data.data.total_questions || 4);
        setInSession(true);
      } else {
        alert(data.error || "Failed to start interview session.");
      }
    } catch (err) {
      console.error(err);
      alert("Error starting interview session.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!studentAnswer.trim() || !currentQuestion) return;

    setEvaluating(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/ml/interview/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          domain,
          question_id: currentQuestion.id,
          student_answer: studentAnswer.trim(),
          question_index: questionIndex
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setEvaluation(data.data);
        setSessionHistory(prev => [
          ...prev,
          {
            question: currentQuestion.text,
            answer: studentAnswer.trim(),
            score: data.data.overall_score
          }
        ]);

        if (data.data.is_complete) {
          setInterviewFinished(true);
        }
      } else {
        alert(data.error || "Failed to evaluate response.");
      }
    } catch (err) {
      console.error(err);
      alert("Error evaluating response.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (evaluation?.next_question) {
      setCurrentQuestion(evaluation.next_question);
      setQuestionIndex(prev => prev + 1);
      setStudentAnswer("");
      setEvaluation(null);
      setShowModelAnswer(false);
    } else {
      setInterviewFinished(true);
    }
  };

  const getRatingBadgeClass = (rating: string) => {
    if (rating === "Strong Hire") return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (rating === "Hire") return "bg-blue-100 text-blue-800 border-blue-300";
    if (rating === "Borderline") return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-rose-100 text-rose-800 border-rose-300";
  };

  const calculateFinalAverage = () => {
    if (sessionHistory.length === 0) return 0;
    const sum = sessionHistory.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round((sum / sessionHistory.length) * 10) / 10;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-teal-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-teal-300 animate-pulse" /> AI Placement Interviewer
            </div>
            <h2 className="text-2xl font-bold tracking-tight">AI Technical & HR Mock Interview Simulator</h2>
            <p className="text-sm text-teal-200/80 max-w-2xl">
              Simulate realistic one-on-one technical screening rounds. Receive instant rubric scoring (1-10), architectural depth critique, and ideal model answers.
            </p>
          </div>
          {inSession && !interviewFinished && (
            <Badge className="bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs py-1 px-3 self-start md:self-center">
              Question {questionIndex} of {totalQuestions}
            </Badge>
          )}
        </div>
      </div>

      {/* Setup View (When not in session or restart) */}
      {!inSession && !interviewFinished && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800">Customize Interview Profile</CardTitle>
            <CardDescription className="text-xs">
              Select your targeted domain and specialization to tailor question difficulty.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Interview Domain</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-white"
                >
                  <option value="tech_cs">Technical CS (Data Structures, OS, DBMS, Networks)</option>
                  <option value="hr_behavioral">HR & Behavioral (STAR Method, Teamwork, Leadership)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Job Title</label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Software Engineer, Backend Developer"
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-white"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 space-y-1">
              <span className="font-semibold text-slate-800 block">💡 Interview Preparation Tips:</span>
              <p>• Structure technical answers with definitions, complexity analysis (Big O), and concrete architectural trade-offs.</p>
              <p>• For behavioral questions, apply the <strong>STAR Method</strong> (Situation, Task, Action, Result).</p>
            </div>

            <Button
              onClick={startInterviewSession}
              disabled={loading}
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs px-6 py-2.5"
            >
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
              Begin Live Mock Interview
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Interview Arena */}
      {inSession && !interviewFinished && currentQuestion && (
        <div className="space-y-6">
          {/* Question Card */}
          <Card className="border-teal-200 shadow-sm bg-gradient-to-br from-teal-50/40 via-white to-slate-50">
            <CardHeader className="pb-3 border-b border-teal-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  Q{questionIndex}
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800">
                    {currentQuestion.topic}
                  </CardTitle>
                  <CardDescription className="text-[11px] text-teal-700 font-medium">
                    Target Role: {roleTitle}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="text-[11px] border-teal-300 text-teal-800">
                Question {questionIndex} / {totalQuestions}
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              <div className="text-base font-semibold text-slate-900 leading-relaxed mb-4">
                "{currentQuestion.text}"
              </div>

              {/* Answer Input */}
              {!evaluation && (
                <div className="space-y-3">
                  <textarea
                    rows={6}
                    value={studentAnswer}
                    disabled={evaluating}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                    placeholder="Type your technical or behavioral answer here in detail. Cite core mechanics, complexity, and trade-offs..."
                    className="w-full text-sm border border-slate-300 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Word Count: {studentAnswer.trim() ? studentAnswer.trim().split(/\s+/).length : 0} words</span>
                    <Button
                      onClick={submitAnswer}
                      disabled={evaluating || !studentAnswer.trim()}
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs px-5"
                    >
                      {evaluating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Evaluating Answer...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" /> Submit Answer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instant Evaluation Feedback Card */}
          {evaluation && (
            <Card className="border-slate-200 shadow-md animate-in slide-in-from-bottom-3 duration-300 overflow-hidden">
              <CardHeader className="bg-slate-900 text-white py-4 px-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-400" /> AI Evaluator Performance Scorecard
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-300">
                    Multi-dimensional review of your submitted response
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-400">{evaluation.overall_score}</span>
                    <span className="text-xs text-slate-400"> / 10</span>
                  </div>
                  <Badge variant="outline" className={`text-xs font-semibold py-1 px-2.5 ${getRatingBadgeClass(evaluation.rating)}`}>
                    {evaluation.rating}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                {/* Score Rubric Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <span className="text-[11px] text-slate-500 font-semibold block uppercase">Technical Accuracy</span>
                    <span className="text-xl font-bold text-slate-800">{evaluation.breakdown.technical_accuracy} / 10</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <span className="text-[11px] text-slate-500 font-semibold block uppercase">Communication Clarity</span>
                    <span className="text-xl font-bold text-slate-800">{evaluation.breakdown.communication_clarity} / 10</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <span className="text-[11px] text-slate-500 font-semibold block uppercase">Depth of Knowledge</span>
                    <span className="text-xl font-bold text-slate-800">{evaluation.breakdown.depth_of_knowledge} / 10</span>
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Key Strengths:
                    </span>
                    <ul className="text-xs text-emerald-950 space-y-1 pl-4 list-disc">
                      {evaluation.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 space-y-2">
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4 text-amber-600" /> What to Improve:
                    </span>
                    <ul className="text-xs text-amber-950 space-y-1 pl-4 list-disc">
                      {evaluation.improvements.map((imp, idx) => (
                        <li key={idx} dangerouslySetInnerHTML={{ __html: imp }} />
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Model Answer Toggle */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModelAnswer(!showModelAnswer)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                    {showModelAnswer ? "Hide Ideal Model Answer" : "View Industry Benchmark Model Answer"}
                  </button>

                  {showModelAnswer && (
                    <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line animate-in fade-in">
                      {evaluation.model_answer}
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button
                    onClick={handleNextQuestion}
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs px-6"
                  >
                    {evaluation.is_complete ? "Complete Interview & View Summary" : "Next Question"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Interview Summary Card (When Session Completes) */}
      {interviewFinished && (
        <Card className="border-slate-200 shadow-md animate-in zoom-in-95 duration-300">
          <CardHeader className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-t-xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-amber-400">
              <Trophy className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-black">Mock Interview Completed!</CardTitle>
            <CardDescription className="text-teal-200">
              You finished {sessionHistory.length} interview questions for {roleTitle}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-center">
            <div>
              <span className="text-xs uppercase font-semibold text-slate-500 block mb-1">Average Session Performance</span>
              <span className="text-4xl font-extrabold text-slate-900">{calculateFinalAverage()} <span className="text-lg font-normal text-slate-400">/ 10</span></span>
            </div>

            <div className="text-left space-y-3 max-w-xl mx-auto">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Question-by-Question Breakdown:</span>
              {sessionHistory.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="truncate max-w-md text-slate-800 font-medium">Q{idx + 1}: {item.question}</span>
                  <Badge variant="outline" className="font-bold text-slate-700 shrink-0 ml-2">
                    {item.score} / 10
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <Button
                onClick={() => {
                  setInSession(false);
                  setInterviewFinished(false);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs px-6"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Start Another Interview Round
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
