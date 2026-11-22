import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, FileText, Upload, Bot, Send, HelpCircle, 
  CheckCircle2, RefreshCw, Trash2, BookOpen, Layers, 
  Check, X, Award, ChevronRight, ChevronLeft, AlertCircle, ArrowRight, Copy, Printer,
  Brain, Target, Zap, Clock, ChevronDown, ChevronUp, BarChart2, Calendar, ShieldCheck
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

interface Flashcard {
  id: number;
  category: string;
  front: string;
  back: string;
  keyword: string;
  source: string;
}

interface DocRecord {
  doc_id: string;
  file_name: string;
  doc_type: "syllabus" | "question_paper";
  page_count: number;
  chunk_count: number;
  char_count: number;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  sources?: Array<{
    doc_name: string;
    doc_type: string;
    page: number;
    snippet: string;
  }>;
  timestamp: string;
}

interface QuizQuestion {
  id: number;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  source: string;
}

interface AgentThoughtStep {
  step: number;
  thought: string;
  action?: string;
  action_input?: any;
  observation?: string;
}

interface AgentCitation {
  doc_name: string;
  doc_type: string;
  page: number;
  snippet: string;
}

interface AgentChallenge {
  text: string;
  type?: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
}

interface AgentTurn {
  id: string;
  sender: "user" | "agent";
  text: string;
  persona?: "strategy" | "tutor" | "crash_course";
  thought_steps?: AgentThoughtStep[];
  tools_called?: string[];
  citations?: AgentCitation[];
  diagnostic_challenge?: AgentChallenge;
  suggested_actions?: string[];
  timestamp: string;
  userAnswer?: string;
  showExplanation?: boolean;
}

export default function RAGStudyHubUI() {
  const [documents, setDocuments] = useState<DocRecord[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragSyllabus, setDragSyllabus] = useState(false);
  const [dragQP, setDragQP] = useState(false);
  const [activeTab, setActiveTab] = useState("agent");

  // Autonomous RAG Agent State
  const [agentPersona, setAgentPersona] = useState<"strategy" | "tutor" | "crash_course">("strategy");
  const [agentDaysLeft, setAgentDaysLeft] = useState(3);
  const [agentInput, setAgentInput] = useState("");
  const [agentThinking, setAgentThinking] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [agentTurns, setAgentTurns] = useState<AgentTurn[]>([
    {
      id: "agent-welcome",
      sender: "agent",
      persona: "strategy",
      text: "👋 Welcome to the **Autonomous RAG AI Agent**!\n\nI run an autonomous **ReAct (Reasoning + Tool-Use)** cognitive loop. Rather than just searching, I can independently **cross-reference syllabus modules with past exam papers**, **predict exam question frequency**, **estimate topic weightages**, and **synthesize targeted revision schedules**.\n\nSelect an operational persona above or pick a quick strategy action to begin!",
      suggested_actions: [
        "🎯 Predict high-yield topics & question patterns",
        "🔄 Cross-reference syllabus modules against exam paper",
        "📊 Calculate estimated topic weightage and marks",
        "⚡ Synthesize a 3-day sprint revision roadmap"
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const agentChatEndRef = useRef<HTMLDivElement>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "👋 Welcome to the **AI Study & RAG Hub**! Upload your **Course Syllabus** and **Previous Question Paper** above. I will ground my answers strictly in your coursework to resolve doubts, solve exam questions, and generate custom practice quizzes.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [chatting, setChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quiz Generator State
  const [quizCount, setQuizCount] = useState(5);
  const [quizFocus, setQuizFocus] = useState("hybrid");
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [savedTestId, setSavedTestId] = useState<number | null>(null);

  // Flashcards & Cheat Sheet State
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  const [cheatSheetMarkdown, setCheatSheetMarkdown] = useState<string>("");
  const [generatingCheatSheet, setGeneratingCheatSheet] = useState(false);
  const [copiedCheatSheet, setCopiedCheatSheet] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    agentChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentTurns, agentThinking]);

  const handleAgentSend = async (overridePrompt?: string) => {
    const query = (overridePrompt || agentInput).trim();
    if (!query || agentThinking) return;

    const userTurn: AgentTurn = {
      id: "user-" + Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAgentTurns(prev => [...prev, userTurn]);
    setAgentInput("");
    setAgentThinking(true);

    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/rag/agent/interact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: query,
          persona: agentPersona,
          days_left: agentDaysLeft
        })
      });

      const data = await res.json();
      const agentMsgId = "agent-" + Date.now();

      if (data && (data.final_response || data.error)) {
        const agentTurn: AgentTurn = {
          id: agentMsgId,
          sender: "agent",
          persona: agentPersona,
          text: data.final_response || data.error || "Completed reasoning.",
          thought_steps: data.thought_steps || [],
          tools_called: data.tools_called || [],
          citations: data.citations || [],
          diagnostic_challenge: data.diagnostic_challenge,
          suggested_actions: data.suggested_actions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        if (data.thought_steps && data.thought_steps.length > 0) {
          setExpandedThoughts(prev => ({ ...prev, [agentMsgId]: true }));
        }
        setAgentTurns(prev => [...prev, agentTurn]);
      } else {
        setAgentTurns(prev => [
          ...prev,
          {
            id: agentMsgId,
            sender: "agent",
            persona: agentPersona,
            text: "⚠️ Unable to complete autonomous reasoning. Please ensure your syllabus or question paper is uploaded above.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err: any) {
      console.error("Agent interact error:", err);
      setAgentTurns(prev => [
        ...prev,
        {
          id: "agent-err-" + Date.now(),
          sender: "agent",
          persona: agentPersona,
          text: `⚠️ Agent communication error: ${err?.message || "Service unavailable."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAgentThinking(false);
    }
  };

  const handleSelectChallengeAnswer = (turnId: string, option: string) => {
    setAgentTurns(prev => prev.map(t => {
      if (t.id === turnId) {
        return { ...t, userAnswer: option };
      }
      return t;
    }));
  };

  const handleToggleChallengeExplanation = (turnId: string) => {
    setAgentTurns(prev => prev.map(t => {
      if (t.id === turnId) {
        return { ...t, showExplanation: !t.showExplanation };
      }
      return t;
    }));
  };

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/rag/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data?.documents) {
        setDocuments(data.data.documents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const processFile = async (file: File, docType: "syllabus" | "question_paper") => {
    if (!file) return;

    // Check file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert("File size exceeds 25MB limit. Please upload a smaller document.");
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem("jwt_token");
      if (!token) {
        alert("Authentication session missing. Please log in again.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", docType);
      formData.append("file_name", file.name);

      const res = await fetch(`${API_BASE}/rag/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.status === 401) {
        alert("Your login session has expired. Please refresh the page and sign in again.");
        return;
      }

      const data = await res.json();
      if (data.success) {
        await fetchDocuments();
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "bot",
            text: `✅ Successfully ingested and indexed **${file.name}** (${docType === "syllabus" ? "Course Syllabus" : "Question Paper"}). Extracted **${data.document?.chunk_count || 1} semantic chunks**. You can now ask doubts or generate a quiz based on this material!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        alert(data.error || "Failed to process document. Please ensure the file contains readable text.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Error uploading document: " + (err?.message || "Please check that all services are running"));
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: "syllabus" | "question_paper") => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file, docType);
    }
    e.target.value = "";
  };

  const handleClearSession = async () => {
    if (!confirm("Are you sure you want to clear all uploaded syllabus and question paper documents?")) return;
    try {
      const token = localStorage.getItem("jwt_token");
      await fetch(`${API_BASE}/rag/documents`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments([]);
      setGeneratedQuiz([]);
      setQuizSubmitted(false);
      setAgentTurns([
        {
          id: "agent-welcome-" + Date.now(),
          sender: "agent",
          persona: "strategy",
          text: "🗑️ All session documents have been cleared. Upload a new syllabus or question paper above to restart autonomous analysis and prediction.",
          suggested_actions: [
            "Upload Course Syllabus",
            "Upload Question Paper"
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setMessages([
        {
          id: Date.now().toString(),
          sender: "bot",
          text: "🗑️ All session documents have been cleared. Upload new syllabus or question papers to start a fresh study session.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChat = async (overrideText?: string) => {
    const q = overrideText || inputQuery;
    if (!q.trim() || chatting) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery("");
    setChatting(true);

    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/rag/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: q.trim() })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: data.data.answer,
            sources: data.data.sources,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: "⚠️ I encountered an error while retrieving your documents. Please make sure your syllabus or question paper is uploaded properly.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatting(false);
    }
  };

  const handleGenerateQuiz = async (saveToTests = false) => {
    setGeneratingQuiz(true);
    setQuizSubmitted(false);
    setUserAnswers({});
    setSavedTestId(null);

    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/rag/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          num_questions: quizCount,
          focus: quizFocus,
          difficulty: quizDifficulty,
          save_to_tests: saveToTests,
          title: `RAG Quiz - ${quizFocus.toUpperCase()}`
        })
      });

      const data = await res.json();
      if (data.success && data.questions) {
        setGeneratedQuiz(data.questions);
        if (data.test_id) {
          setSavedTestId(data.test_id);
        }
      } else {
        alert(data.error || "Failed to generate quiz. Make sure you have uploaded documents.");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const calculateScore = () => {
    if (generatedQuiz.length === 0) return 0;
    let correct = 0;
    generatedQuiz.forEach(q => {
      if (userAnswers[q.id] === q.correct_option) {
        correct++;
      }
    });
    return correct;
  };

  const handleGenerateFlashcards = async () => {
    setLoadingFlashcards(true);
    setCurrentCardIndex(0);
    setIsFlipped(false);

    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/rag/flashcards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ count: 8 })
      });

      const data = await res.json();
      if (data.success && data.flashcards) {
        setFlashcards(data.flashcards);
      } else {
        alert(data.error || "Failed to generate flashcards. Upload documents first.");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating flashcards.");
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const toggleMastered = (cardId: number) => {
    setMasteredCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const handleGenerateCheatSheet = async () => {
    setGeneratingCheatSheet(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/rag/cheat-sheet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      const data = await res.json();
      if (data.success && data.markdown) {
        setCheatSheetMarkdown(data.markdown);
      } else {
        alert(data.error || "Failed to generate cheat sheet.");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating cheat sheet.");
    } finally {
      setGeneratingCheatSheet(false);
    }
  };

  const handleCopyCheatSheet = () => {
    if (!cheatSheetMarkdown) return;
    navigator.clipboard.writeText(cheatSheetMarkdown);
    setCopiedCheatSheet(true);
    setTimeout(() => setCopiedCheatSheet(false), 2000);
  };

  const syllabusDocs = documents.filter(d => d.doc_type === "syllabus");
  const qpDocs = documents.filter(d => d.doc_type === "question_paper");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-indigo-700/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-indigo-300 animate-pulse" /> RAG (Retrieval-Augmented Generation) System
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-200 text-xs font-semibold">
                <Brain className="h-3.5 w-3.5 text-amber-300 animate-pulse" /> ReAct Autonomous Agent v2.2.0 Active
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">AI Study & Question Paper Assistant</h2>
            <p className="text-sm text-indigo-200/80 max-w-2xl">
              Upload your official syllabus and question papers to clear conceptual doubts with page-level citations and auto-generate exam practice quizzes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {documents.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearSession}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear Material ({documents.length})
              </Button>
            )}
          </div>
        </div>

        {/* Dual Upload Zone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {/* Syllabus Drop Zone */}
          <div 
            className={`border rounded-xl p-4 transition-all duration-200 ${
              dragSyllabus 
                ? "bg-indigo-500/20 border-indigo-400 scale-[1.01] shadow-md" 
                : "bg-white/5 border-white/15 hover:bg-white/10"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragSyllabus(true); }}
            onDragLeave={() => setDragSyllabus(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragSyllabus(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processFile(file, "syllabus");
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-indigo-200 font-semibold text-sm">
                <BookOpen className="h-4 w-4 text-indigo-400" /> Upload Syllabus (PDF/TXT)
              </div>
              <Badge variant="outline" className="border-indigo-400/40 text-indigo-300 text-[10px]">
                {syllabusDocs.length} Uploaded
              </Badge>
            </div>
            <p className="text-xs text-indigo-200/70 mb-3">
              {dragSyllabus ? "Drop file here to ingest syllabus!" : "Course outline, modules, units & learning objectives"}
            </p>
            <label className="cursor-pointer inline-flex items-center justify-center w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2 px-3 rounded-lg shadow-sm transition-colors">
              <Upload className="h-3.5 w-3.5 mr-1.5" /> {uploading ? "Processing..." : "Select or Drop Syllabus File"}
              <input 
                type="file" 
                accept=".pdf,.txt,.doc,.docx" 
                className="hidden" 
                disabled={uploading}
                onChange={(e) => handleFileUpload(e, "syllabus")} 
              />
            </label>
          </div>

          {/* Question Paper Drop Zone */}
          <div 
            className={`border rounded-xl p-4 transition-all duration-200 ${
              dragQP 
                ? "bg-purple-500/20 border-purple-400 scale-[1.01] shadow-md" 
                : "bg-white/5 border-white/15 hover:bg-white/10"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragQP(true); }}
            onDragLeave={() => setDragQP(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragQP(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processFile(file, "question_paper");
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-purple-200 font-semibold text-sm">
                <FileText className="h-4 w-4 text-purple-400" /> Upload Question Paper (PDF/TXT)
              </div>
              <Badge variant="outline" className="border-purple-400/40 text-purple-300 text-[10px]">
                {qpDocs.length} Uploaded
              </Badge>
            </div>
            <p className="text-xs text-purple-200/70 mb-3">
              {dragQP ? "Drop file here to ingest question paper!" : "Previous year questions, model papers & mid-sem tests"}
            </p>
            <label className="cursor-pointer inline-flex items-center justify-center w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium py-2 px-3 rounded-lg shadow-sm transition-colors">
              <Upload className="h-3.5 w-3.5 mr-1.5" /> {uploading ? "Processing..." : "Select or Drop Question Paper"}
              <input 
                type="file" 
                accept=".pdf,.txt,.doc,.docx" 
                className="hidden" 
                disabled={uploading}
                onChange={(e) => handleFileUpload(e, "question_paper")} 
              />
            </label>
          </div>
        </div>

        {/* Uploaded Documents List */}
        {documents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
            <span className="text-xs text-indigo-300 font-medium self-center mr-1">Active Study Context:</span>
            {documents.map((doc) => (
              <Badge key={doc.doc_id} className="bg-white/15 hover:bg-white/20 text-white border-0 text-[11px] py-1 px-2.5 flex items-center gap-1.5">
                {doc.doc_type === "syllabus" ? <BookOpen className="h-3 w-3 text-indigo-300" /> : <FileText className="h-3 w-3 text-purple-300" />}
                <span className="truncate max-w-[180px]">{doc.file_name}</span>
                <span className="text-[10px] opacity-70">({doc.chunk_count} chunks)</span>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Main Tabs: Doubt Clearing Chatbot & Quiz Generator */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="agent" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-amber-700 font-semibold">
            <Brain className="h-4 w-4 text-amber-600 animate-pulse" /> 🤖 Autonomous RAG Agent
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-700 font-semibold">
            <Bot className="h-4 w-4" /> Doubt Clearing Chatbot
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-700 font-semibold">
            <Sparkles className="h-4 w-4 text-purple-600" /> RAG Quiz Generator
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-emerald-700 font-semibold">
            <Layers className="h-4 w-4 text-emerald-600" /> Smart Flashcards & Cheat Sheet
          </TabsTrigger>
        </TabsList>

        {/* TAB 0: AUTONOMOUS RAG AI AGENT */}
        <TabsContent value="agent" className="mt-4 space-y-4">
          <Card className="border-slate-200 shadow-sm flex flex-col min-h-[640px] bg-white">
            {/* Agent Header Ribbon */}
            <CardHeader className="py-3 px-6 border-b border-slate-100 bg-gradient-to-r from-amber-50/60 via-indigo-50/40 to-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                    <Brain className="h-5 w-5 text-amber-600" /> PREP-TRACK Autonomous RAG Agent
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] bg-amber-100/60 text-amber-800 border-amber-300 font-semibold">
                    ReAct Engine v2.2.0
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-600 mt-0.5">
                  Autonomous reasoning with curriculum cross-referencing, exam question forecasting & adaptive drills
                </CardDescription>
              </div>

              {/* Persona Selector Ribbon */}
              <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                {[
                  { id: "strategy", label: "🎯 Exam Strategy", title: "Question forecaster & weightage analyzer" },
                  { id: "tutor", label: "💡 Socratic Tutor", title: "Conceptual breakdowns & mechanics explanations" },
                  { id: "crash_course", label: "⚡ 24h Crash Course", title: "High-yield revision & formula cheat sheets" }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    title={p.title}
                    onClick={() => setAgentPersona(p.id as any)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      agentPersona === p.id 
                        ? "bg-amber-600 text-white shadow-2xs" 
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </CardHeader>

            {/* Quick Strategy Action Pills */}
            <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <Target className="h-3.5 w-3.5 text-amber-600" />
                <span>Autonomous Tools:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    icon: <BarChart2 className="h-3 w-3 text-amber-600" />,
                    label: "Exam Weightage Forecast",
                    prompt: "Calculate estimated mark distribution and frequency of topics across uploaded papers"
                  },
                  {
                    icon: <RefreshCw className="h-3 w-3 text-indigo-600" />,
                    label: "Curriculum Cross-Reference",
                    prompt: "Cross-reference uploaded syllabus modules against the question paper and identify tested vs untested topics"
                  },
                  {
                    icon: <Calendar className="h-3 w-3 text-emerald-600" />,
                    label: "3-Day Revision Roadmap",
                    prompt: "Synthesize a 3-day high-yield study schedule focusing on the most critical questions"
                  },
                  {
                    icon: <Award className="h-3 w-3 text-purple-600" />,
                    label: "Diagnostic Drill",
                    prompt: "Generate a challenging exam-grade diagnostic question to test my understanding"
                  }
                ].map((act, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={documents.length === 0 || agentThinking}
                    onClick={() => handleAgentSend(act.prompt)}
                    className="inline-flex items-center gap-1 text-[11px] bg-white hover:bg-amber-50/80 border border-slate-200 hover:border-amber-300 text-slate-700 px-2.5 py-1 rounded-lg transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {act.icon}
                    <span>{act.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Agent Message Stream */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
              {agentTurns.map((turn) => (
                <div
                  key={turn.id}
                  className={`flex ${turn.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 shadow-xs ${
                      turn.sender === "user"
                        ? "bg-amber-600 text-white rounded-tr-none"
                        : "bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none space-y-3"
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-4 text-[11px] opacity-75">
                      <div className="flex items-center gap-1.5 font-semibold">
                        {turn.sender === "user" ? (
                          <span>You</span>
                        ) : (
                          <>
                            <Brain className="h-3.5 w-3.5 text-amber-600" />
                            <span>
                              {turn.persona === "strategy" && "🎯 Exam Strategy Forecaster"}
                              {turn.persona === "tutor" && "💡 Socratic Academic Tutor"}
                              {turn.persona === "crash_course" && "⚡ 24h Crash Course Specialist"}
                              {!turn.persona && "🤖 Autonomous RAG Agent"}
                            </span>
                          </>
                        )}
                      </div>
                      <span>{turn.timestamp}</span>
                    </div>

                    {/* Reasoning Chain Trace Accordion */}
                    {turn.thought_steps && turn.thought_steps.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-2.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setExpandedThoughts(prev => ({ ...prev, [turn.id]: !prev[turn.id] }))}
                          className="flex items-center justify-between w-full font-semibold text-amber-900 text-left"
                        >
                          <span className="flex items-center gap-1.5">
                            <Brain className="h-3.5 w-3.5 text-amber-600" />
                            Autonomous Reasoning Trace ({turn.thought_steps.length} steps · {turn.tools_called?.length || 0} tools)
                          </span>
                          {expandedThoughts[turn.id] ? <ChevronUp className="h-4 w-4 text-amber-700" /> : <ChevronDown className="h-4 w-4 text-amber-700" />}
                        </button>

                        {expandedThoughts[turn.id] && (
                          <div className="mt-2.5 pt-2 border-t border-amber-200/60 space-y-2">
                            {turn.tools_called && turn.tools_called.length > 0 && (
                              <div className="flex flex-wrap gap-1 items-center pb-1">
                                <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Tools Executed:</span>
                                {turn.tools_called.map((tl, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px] bg-white border-amber-300 text-amber-900 py-0 px-1.5">
                                    ⚙️ {tl}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {turn.thought_steps.map((st, i) => (
                              <div key={i} className="bg-white/90 p-2 rounded-lg border border-amber-200/50 text-[11px] space-y-1">
                                <div className="flex items-center justify-between font-semibold text-amber-900">
                                  <span>Step {st.step || (i + 1)}</span>
                                  {st.action && (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">
                                      {st.action}
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-700 leading-snug">
                                  💭 <span className="italic">{st.thought}</span>
                                </div>
                                {st.observation && (
                                  <div className="text-slate-600 bg-slate-50 p-1.5 rounded font-mono text-[10px] border border-slate-100 truncate">
                                    👁️ Observation: {st.observation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Main Agent Response */}
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {turn.text}
                    </div>

                    {/* Verified Citations */}
                    {turn.citations && turn.citations.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 space-y-1">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-amber-600" /> Evidence Citations:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {turn.citations.map((c, i) => (
                            <span
                              key={i}
                              className="text-[11px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium shadow-2xs"
                              title={c.snippet}
                            >
                              📄 {c.doc_name} (Page {c.page})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Diagnostic Challenge */}
                    {turn.diagnostic_challenge && (
                      <div className="mt-3 p-3.5 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/60 to-white space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-purple-600" /> Diagnostic Challenge Drill
                          </span>
                          <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-700">
                            Knowledge Check
                          </Badge>
                        </div>
                        <p className="text-xs font-medium text-slate-800 leading-relaxed">
                          {turn.diagnostic_challenge.text}
                        </p>

                        {/* Interactive Options */}
                        {turn.diagnostic_challenge.options && turn.diagnostic_challenge.options.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {turn.diagnostic_challenge.options.map((opt, i) => {
                              const optLetter = opt.charAt(0);
                              const isSelected = turn.userAnswer === optLetter;
                              const isCorrect = turn.diagnostic_challenge?.correct_answer === optLetter;
                              let btnClass = "bg-white hover:bg-purple-50 text-slate-700 border-slate-200";

                              if (turn.userAnswer) {
                                if (isCorrect) {
                                  btnClass = "bg-emerald-50 text-emerald-800 border-emerald-400 font-semibold";
                                } else if (isSelected) {
                                  btnClass = "bg-rose-50 text-rose-800 border-rose-400 font-semibold";
                                }
                              }

                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handleSelectChallengeAnswer(turn.id, optLetter)}
                                  className={`w-full text-left text-xs p-2 rounded-lg border transition-all flex items-center justify-between ${btnClass}`}
                                >
                                  <span>{opt}</span>
                                  {turn.userAnswer && isCorrect && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                                  {turn.userAnswer && isSelected && !isCorrect && <X className="h-3.5 w-3.5 text-rose-600" />}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Reveal Explanation Toggle */}
                        {turn.diagnostic_challenge.explanation && (
                          <div className="pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleChallengeExplanation(turn.id)}
                              className="text-xs text-purple-700 hover:text-purple-800 hover:bg-purple-100/50 h-7 px-2"
                            >
                              {turn.showExplanation ? "Hide Detailed Explanation" : "Reveal Answer & Explanation"}
                            </Button>
                            {turn.showExplanation && (
                              <div className="mt-2 p-2.5 rounded-lg bg-white border border-purple-100 text-xs text-slate-700 leading-relaxed font-mono">
                                💡 <span className="font-semibold text-purple-900">Explanation:</span> {turn.diagnostic_challenge.explanation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggested Next Actions */}
                    {turn.suggested_actions && turn.suggested_actions.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Next:</span>
                        {turn.suggested_actions.map((act, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleAgentSend(act)}
                            disabled={agentThinking}
                            className="text-[11px] bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 px-2 py-0.5 rounded-md transition-colors"
                          >
                            {act}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Thinking Indicator */}
              {agentThinking && (
                <div className="flex justify-start">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl rounded-tl-none p-4 shadow-xs space-y-2 max-w-[80%]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                      <Brain className="h-4 w-4 text-amber-600 animate-spin" />
                      <span>Autonomous Agent Reasoning in progress...</span>
                    </div>
                    <p className="text-[11px] text-amber-800/80">
                      Cross-referencing curriculum modules, executing semantic retrieval tools, and computing weightages...
                    </p>
                  </div>
                </div>
              )}
              <div ref={agentChatEndRef} />
            </CardContent>

            {/* Agent Input Bar */}
            <div className="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                placeholder={documents.length === 0 ? "Upload a syllabus or question paper above first..." : "Ask the autonomous agent to predict questions, analyze weightage, or explain concepts..."}
                value={agentInput}
                disabled={documents.length === 0 || agentThinking}
                onChange={(e) => setAgentInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAgentSend(); }}
                className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
              />
              <Button
                onClick={() => handleAgentSend()}
                disabled={documents.length === 0 || agentThinking || !agentInput.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-5 shadow-sm font-semibold"
              >
                {agentThinking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 1: RAG CHATBOT */}
        <TabsContent value="chat" className="mt-4 space-y-4">
          <Card className="border-slate-200 shadow-sm flex flex-col h-[600px]">
            <CardHeader className="py-3 px-6 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                  <Bot className="h-5 w-5 text-indigo-600" /> Coursework Doubt Resolution
                </CardTitle>
                <CardDescription className="text-xs">
                  Answers cite exact sentences from your uploaded syllabus and question paper
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs text-slate-600">
                {documents.length} Docs Indexed
              </Badge>
            </CardHeader>

            {/* Chat Messages Feed */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 shadow-xs ${
                    m.sender === "user" 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-slate-100 text-slate-800 border border-slate-200/60 rounded-tl-none"
                  }`}>
                    <div className="flex items-center justify-between gap-4 mb-1 text-[11px] opacity-75">
                      <span className="font-semibold">{m.sender === "user" ? "You" : "Prep-Track AI Tutor"}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {m.text}
                    </div>

                    {/* Grounded Source Citations */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-indigo-600" /> Verified Document Citations:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {m.sources.map((src, i) => (
                            <span 
                              key={i} 
                              className="text-[11px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium shadow-2xs"
                              title={src.snippet}
                            >
                              📄 {src.doc_name} (Page {src.page})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </CardContent>

            {/* Quick Prompt Suggestions */}
            {documents.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-1.5">
                <span className="text-xs text-slate-500 font-medium self-center mr-1">Suggested:</span>
                {[
                  "Explain Unit 1 key concepts",
                  "Solve high-mark questions in the question paper",
                  "What topics appear in both syllabus and question paper?",
                  "Give me a formula revision sheet"
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendChat(prompt)}
                    className="text-[11px] bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                placeholder={documents.length === 0 ? "Upload a syllabus or question paper above first..." : "Ask any doubt, question solution, or concept explanation..."}
                value={inputQuery}
                disabled={documents.length === 0 || chatting}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
              <Button 
                onClick={() => handleSendChat()} 
                disabled={documents.length === 0 || chatting || !inputQuery.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 shadow-sm"
              >
                {chatting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: RAG QUIZ GENERATOR */}
        <TabsContent value="quiz" className="mt-4 space-y-6">
          {/* Quiz Configuration Panel */}
          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-purple-50/50 via-white to-slate-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-purple-900">
                <Sparkles className="h-5 w-5 text-purple-600" /> Generate Quiz from Coursework
              </CardTitle>
              <CardDescription>
                The RAG engine extracts key definitions, problem types, and questions from your uploaded files to synthesize practice MCQs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Source Focus</label>
                  <select 
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white"
                    value={quizFocus}
                    onChange={(e) => setQuizFocus(e.target.value)}
                  >
                    <option value="hybrid">Hybrid (Syllabus + Question Paper)</option>
                    <option value="syllabus">Syllabus Key Concepts Focus</option>
                    <option value="question_paper">Question Paper Exam Style</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Question Count</label>
                  <select 
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white"
                    value={quizCount}
                    onChange={(e) => setQuizCount(Number(e.target.value))}
                  >
                    <option value={3}>3 Questions (Quick Sprint)</option>
                    <option value={5}>5 Questions (Recommended)</option>
                    <option value={10}>10 Questions (Standard Quiz)</option>
                    <option value={15}>15 Questions (Full Test)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select 
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white"
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy (Definitions & Direct Recall)</option>
                    <option value="medium">Medium (Analytical & Conceptual)</option>
                    <option value="hard">Hard (Multi-step Problem Solving)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  {documents.length === 0 ? "⚠️ Upload at least 1 syllabus or question paper above to unlock generation." : `Ready to generate from ${documents.length} uploaded files.`}
                </span>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleGenerateQuiz(false)} 
                    disabled={documents.length === 0 || generatingQuiz}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generatingQuiz ? "Generating grounded MCQs..." : "Generate & Practice Here"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleGenerateQuiz(true)} 
                    disabled={documents.length === 0 || generatingQuiz}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Generate & Save to My Tests
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Quiz Player */}
          {generatedQuiz.length > 0 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Document Practice Quiz ({generatedQuiz.length} Questions)</h3>
                  <p className="text-xs text-slate-500">Select an answer for each question and submit to see instant scoring and explanations.</p>
                </div>
                {quizSubmitted && (
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl text-center">
                      <div className="text-xs font-semibold uppercase">Your Score</div>
                      <div className="text-xl font-bold">{calculateScore()} / {generatedQuiz.length} ({Math.round((calculateScore() / generatedQuiz.length) * 100)}%)</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {generatedQuiz.map((q, idx) => {
                  const selected = userAnswers[q.id];
                  const isCorrect = selected === q.correct_option;

                  return (
                    <Card key={q.id} className="border-slate-200 shadow-sm">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                            <span className="font-bold text-indigo-600 mr-2">Q{idx + 1}.</span>
                            {q.text}
                          </p>
                          <Badge variant="outline" className="text-[10px] shrink-0 text-slate-500 border-slate-200">
                            {q.source}
                          </Badge>
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {(['A', 'B', 'C', 'D'] as const).map(letter => {
                            const optText = letter === 'A' ? q.option_a : (letter === 'B' ? q.option_b : (letter === 'C' ? q.option_c : q.option_d));
                            const isSelected = selected === letter;
                            const isAnswer = q.correct_option === letter;

                            let btnStyle = "border-slate-200 hover:border-slate-300 bg-white text-slate-700";
                            if (quizSubmitted) {
                              if (isAnswer) {
                                btnStyle = "border-emerald-500 bg-emerald-50/80 text-emerald-900 font-semibold";
                              } else if (isSelected && !isCorrect) {
                                btnStyle = "border-rose-400 bg-rose-50 text-rose-900";
                              }
                            } else if (isSelected) {
                              btnStyle = "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold ring-1 ring-indigo-600";
                            }

                            return (
                              <button
                                key={letter}
                                type="button"
                                disabled={quizSubmitted}
                                onClick={() => setUserAnswers({ ...userAnswers, [q.id]: letter })}
                                className={`text-left p-3 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="font-bold text-slate-500">{letter}.</span>
                                  <span>{optText}</span>
                                </span>
                                {quizSubmitted && isAnswer && (
                                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                                )}
                                {quizSubmitted && isSelected && !isCorrect && (
                                  <X className="h-4 w-4 text-rose-500 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation Box */}
                        {quizSubmitted && (
                          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                              <HelpCircle className="h-3.5 w-3.5 text-indigo-600" /> Verified Explanation:
                            </p>
                            <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Submit / Reset Actions */}
              <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">
                  {Object.keys(userAnswers).length} of {generatedQuiz.length} questions answered
                </span>
                <div className="flex gap-2">
                  {!quizSubmitted ? (
                    <Button 
                      onClick={() => setQuizSubmitted(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      Submit & Grade Quiz
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => { setQuizSubmitted(false); setUserAnswers({}); }}
                      className="border-slate-300"
                    >
                      Retake Quiz
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 3: SMART FLASHCARDS & REVISION CHEAT SHEET */}
        <TabsContent value="flashcards" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Interactive 3D Flashcards */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                      <Layers className="h-5 w-5 text-emerald-600" /> Active Recall Flashcards
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Key formulas, theorems, and definitions auto-extracted from your uploaded files
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleGenerateFlashcards}
                    disabled={documents.length === 0 || loadingFlashcards}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs text-xs"
                  >
                    {loadingFlashcards ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {flashcards.length === 0 ? "Generate Flashcards" : "Regenerate Cards"}
                      </>
                    )}
                  </Button>
                </CardHeader>

                <CardContent className="p-6">
                  {flashcards.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-3">
                      <Layers className="h-12 w-12 mx-auto text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">
                        {documents.length === 0 
                          ? "Upload a syllabus or question paper above to unlock flashcards." 
                          : "Click 'Generate Flashcards' to create personalized active-recall cards."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Mastery Progress Bar */}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Card {currentCardIndex + 1} of {flashcards.length}</span>
                        <span>Mastery: {masteredCards.size} / {flashcards.length} ({Math.round((masteredCards.size / flashcards.length) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${(masteredCards.size / flashcards.length) * 100}%` }}
                        />
                      </div>

                      {/* 3D Flip Card Container */}
                      <div
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="cursor-pointer min-h-[260px] p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between shadow-xs select-none bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/30 border-slate-200 hover:border-emerald-300 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 text-[11px]">
                            {flashcards[currentCardIndex].category}
                          </Badge>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {isFlipped ? "Showing Answer (Back)" : "Click to Flip (Front)"}
                          </span>
                        </div>

                        <div className="my-auto py-4 text-center">
                          {!isFlipped ? (
                            <div className="space-y-2">
                              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 block">
                                Core Concept / Prompt
                              </span>
                              <p className="text-base font-bold text-slate-800 leading-relaxed max-w-lg mx-auto">
                                {flashcards[currentCardIndex].front}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 text-left">
                              <span className="text-xs uppercase tracking-wider font-semibold text-teal-700 block text-center">
                                Verified Definition & Solution
                              </span>
                              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
                                {flashcards[currentCardIndex].back}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                          <span>Source: {flashcards[currentCardIndex].source}</span>
                          <span className="text-emerald-600 font-semibold text-[11px]">Tap card to flip</span>
                        </div>
                      </div>

                      {/* Flashcard Navigation & Mastery Controls */}
                      <div className="flex items-center justify-between pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentCardIndex === 0}
                          onClick={() => {
                            setCurrentCardIndex(prev => prev - 1);
                            setIsFlipped(false);
                          }}
                          className="rounded-xl border-slate-200 text-xs"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleMastered(flashcards[currentCardIndex].id)}
                            className={`rounded-xl text-xs ${
                              masteredCards.has(flashcards[currentCardIndex].id)
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "border-slate-200 text-slate-700"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                            {masteredCards.has(flashcards[currentCardIndex].id) ? "Mastered" : "Mark Mastered"}
                          </Button>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentCardIndex === flashcards.length - 1}
                          onClick={() => {
                            setCurrentCardIndex(prev => prev + 1);
                            setIsFlipped(false);
                          }}
                          className="rounded-xl border-slate-200 text-xs"
                        >
                          Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Quick-Revision Smart Cheat Sheet */}
            <div className="space-y-4">
              <Card className="border-slate-200 shadow-sm flex flex-col h-full">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                        <FileText className="h-5 w-5 text-indigo-600" /> Smart Cheat Sheet
                      </CardTitle>
                      <CardDescription className="text-xs">
                        High-yield exam review notes
                      </CardDescription>
                    </div>
                    {cheatSheetMarkdown && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyCheatSheet}
                        className="rounded-xl border-slate-200 text-xs h-8 px-2.5"
                      >
                        {copiedCheatSheet ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        {copiedCheatSheet ? "Copied" : "Copy"}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  {cheatSheetMarkdown ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 font-mono overflow-y-auto max-h-[380px] whitespace-pre-wrap leading-relaxed">
                      {cheatSheetMarkdown}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <BookOpen className="h-10 w-10 mx-auto text-slate-300" />
                      <p className="text-xs text-slate-500">
                        Synthesize a 1-page condensed revision sheet from all active syllabus and exam papers.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Button
                      onClick={handleGenerateCheatSheet}
                      disabled={documents.length === 0 || generatingCheatSheet}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs text-xs"
                    >
                      {generatingCheatSheet ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Synthesizing Sheet...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate Cheat Sheet
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

