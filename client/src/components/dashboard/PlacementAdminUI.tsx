import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, BookOpen, Layers, CheckCircle2, Upload, Download, Info, Sparkles } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default function PlacementAdminUI() {
  const [topics, setTopics] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Topic Modal State
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: "", description: "" });
  
  // Test Wizard State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    title: "", description: "", subject: "", topic_id: "", num_questions: 10, questions: [] as any[]
  });

  // Drag and drop states
  const [dragActive, setDragActive] = useState(false);

  // Questions modal states
  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    text: "", a: "", b: "", c: "", d: "", correct: ""
  });

  // AI Question Generator Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiDomain, setAiDomain] = useState("quant");
  const [aiCount, setAiCount] = useState(5);
  const [aiTargetCourseId, setAiTargetCourseId] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<any[]>([]);

  const handleGenerateAIQuestions = async () => {
    setAiGenerating(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/ml/generate-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          domain: aiDomain,
          count: aiCount,
          test_id: aiTargetCourseId ? Number(aiTargetCourseId) : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiGeneratedQuestions(data.questions);
        if (aiTargetCourseId) {
          alert(`Successfully generated and added ${data.questions.length} questions to the course!`);
          fetchTopicsAndCourses();
        }
      } else {
        alert(data.error || "Failed to generate questions");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating questions");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const downloadSampleCSV = () => {
    const headers = "question_text,option_a,option_b,option_c,option_d,correct_option,mark\n";
    const sampleRow = "What is the capital of France?,Paris,London,Berlin,Rome,A,1\n";
    const blob = new Blob([headers + sampleRow], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "placement_questions_sample.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewQuestions = async (course: any) => {
    setSelectedCourse(course);
    setQuestionsModalOpen(true);
    setLoadingQuestions(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/test/${course.test_id}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
      } else {
        alert(data.error || "Failed to fetch questions");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching questions");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSaveQuestion = async (questionId: number) => {
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/question/update/${questionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setEditingQuestionId(null);
        if (selectedCourse) {
          handleViewQuestions(selectedCourse);
        }
      } else {
        alert(data.error || "Failed to update question");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving question");
    }
  };

  function parseCSV(text: string) {
    const lines: string[] = [];
    let currentLine = "";
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentLine += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        lines.push(currentLine);
        currentLine = "";
      } else {
        currentLine += char;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    
    const cleanLines = lines.map(l => l.trim()).filter(Boolean);
    if (!cleanLines.length) return [];
    
    const parseCols = (line: string) => {
      const cols: string[] = [];
      let currentCol = "";
      let quoteActive = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (quoteActive && nextChar === '"') {
            currentCol += '"';
            i++;
          } else {
            quoteActive = !quoteActive;
          }
        } else if (char === ',' && !quoteActive) {
          cols.push(currentCol.trim());
          currentCol = "";
        } else {
          currentCol += char;
        }
      }
      cols.push(currentCol.trim());
      return cols;
    };
    
    const headers = parseCols(cleanLines[0]).map(h => h.toLowerCase().replace(/[\s_-]/g, ""));
    
    return cleanLines.slice(1).map((line) => {
      const cols = parseCols(line);
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] ?? "";
      });
      return obj;
    });
  }

  function handleFileUpload(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target?.result as string);
      const prepared = parsed.map((r, idx) => {
        const findVal = (keys: string[]) => {
          for (const key of Object.keys(r)) {
            if (keys.some(k => key.includes(k) || k.includes(key))) {
              return r[key];
            }
          }
          return "";
        };

        const text = r.questiontext || r.question || r.text || findVal(["question", "text", "qtext"]);
        const a = r.optiona || r.a || findVal(["optiona", "a", "optia"]);
        const b = r.optionb || r.b || findVal(["optionb", "b", "optib"]);
        const c = r.optionc || r.c || findVal(["optionc", "c", "optic"]);
        const d = r.optiond || r.d || findVal(["optiond", "d", "optid"]);
        const correct = r.correctoption || r.correct || r.answer || findVal(["correct", "ans"]);
        const mark = r.mark || r.marks || findVal(["mark", "score"]);

        return {
          id: Date.now() + idx,
          text: text || "",
          a: a || "",
          b: b || "",
          c: c || "",
          d: d || "",
          correct: correct || "A",
          subject: r.subject || r.category || "General",
          difficulty: r.difficulty || "Medium",
          mark: Number(mark) || 1
        };
      });
      setNewTest({ ...newTest, questions: prepared, num_questions: prepared.length || newTest.num_questions });
      alert(`Parsed ${prepared.length} questions from CSV.`);
    };
    reader.readAsText(file);
  }

  const fetchTopicsAndCourses = async () => {
    try {
      const token = localStorage.getItem("jwt_token");
      const [topicsRes, testsRes] = await Promise.all([
        fetch(`${API_BASE}/topic/topics-with-subtopics`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/test`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      const topicsData = await topicsRes.json();
      const testsData = await testsRes.json();

      if (topicsData.success) {
        setTopics(topicsData.topics.filter((t: any) => t.type === 'placement'));
      }
      if (testsData.success) {
        setCourses(testsData.tests.filter((t: any) => t.test_type === 'placement'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicsAndCourses();
  }, []);

  const handleCreateTopic = async () => {
    if (!newTopic.title) return alert("Title required");
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/topic/create-topics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...newTopic, type: "placement" })
      });
      const data = await res.json();
      if (data.success) {
        setTopicModalOpen(false);
        setNewTopic({ title: "", description: "" });
        fetchTopicsAndCourses();
      } else {
        alert(data.error || "Failed to create topic");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTest = async () => {
    if (!newTest.title || !newTest.topic_id) return alert("Title and Topic required");
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newTest,
          type: "placement",
          duration_minutes: 0,
          department_id: null,
          year: null,
          time_slot: null,
          date: null,
          is_active: 1
        })
      });
      const data = await res.json();
      if (data.success) {
        const testId = data.test_id || (data.test && data.test.test_id);
        
        if (testId && newTest.questions && newTest.questions.length > 0) {
          // Upload questions
          const uploadRes = await fetch(`${API_BASE}/test/${testId}/upload-questions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ questions: newTest.questions })
          });
          const uploadData = await uploadRes.json();
          if (!uploadData.success) {
            alert("Test created but failed to upload questions: " + uploadData.error);
          }
        }
        
        setTestModalOpen(false);
        setNewTest({ title: "", description: "", subject: "", topic_id: "", num_questions: 10, questions: [] });
        alert("Placement course created successfully!");
        fetchTopicsAndCourses();
      } else {
        alert(data.error || "Failed to create placement course");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating course.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Placement Mode Management</h2>
          <p className="text-slate-500">Create placement topics and courses that are always available to students.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAiModalOpen(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm">
            <Sparkles className="h-4 w-4 mr-2" /> AI Question Generator
          </Button>
          <Button onClick={() => setTopicModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> New Topic
          </Button>
          <Button onClick={() => setTestModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <CheckCircle2 className="h-4 w-4 mr-2" /> New Course
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <p>Loading placement data...</p>
        ) : topics.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
            No placement topics found. Create one to get started.
          </div>
        ) : (
          topics.map((topic) => {
            const topicCourses = courses.filter((c: any) => c.topic_id === topic.id);
            return (
              <Card key={topic.id} className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50">
                  <CardTitle className="text-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-800">
                      <BookOpen className="h-5 w-5" />
                      {topic.title}
                    </div>
                  </CardTitle>
                  {topic.description && (
                    <p className="text-sm text-slate-500 mt-1">{topic.description}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-6 bg-slate-50/30">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Courses</h4>
                  {topicCourses.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-6 bg-white rounded-lg border border-dashed border-slate-200">
                      No courses created for this topic yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topicCourses.map((course: any) => (
                        <Card key={course.test_id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
                          <CardHeader className="pb-2 border-b border-slate-50">
                            <CardTitle className="text-md flex items-center justify-between">
                              <div className="flex items-center gap-2 text-emerald-700">
                                <Layers className="h-4 w-4" />
                                {course.title}
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-3">
                            <p className="text-sm text-slate-600 mb-4 line-clamp-1">
                              {course.subject}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                {course.num_questions} Questions
                              </span>
                              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleViewQuestions(course)}>
                                View/Edit
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {topicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Create Placement Topic</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  placeholder="e.g. Aptitude, English Grammar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  value={newTopic.description}
                  onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setTopicModalOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreateTopic}>Create Topic</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Create Placement Course</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newTest.title}
                  onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                  placeholder="e.g. Basic Aptitude Course 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newTest.subject}
                  onChange={(e) => setNewTest({ ...newTest, subject: e.target.value })}
                  placeholder="e.g. General Aptitude"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Placement Topic</label>
                <select
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newTest.topic_id}
                  onChange={(e) => setNewTest({ ...newTest, topic_id: e.target.value })}
                >
                  <option value="">Select Topic</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Number of Questions</label>
                <input
                  type="number"
                  className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newTest.num_questions}
                  onChange={(e) => setNewTest({ ...newTest, num_questions: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700">Upload Questions (CSV)</label>
                  <button
                    type="button"
                    onClick={downloadSampleCSV}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium bg-transparent border-0 cursor-pointer p-0"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Template
                  </button>
                </div>
                
                <div 
                  className={`mt-1 border-2 border-dashed rounded-lg p-5 transition-colors duration-150 text-center ${
                    dragActive 
                      ? "border-blue-500 bg-blue-50/50" 
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/70"
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="placementQuestionsCSV"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  <div className="flex flex-col items-center justify-center">
                    <Upload className={`h-8 w-8 mb-2 ${dragActive ? "text-blue-500 animate-bounce" : "text-slate-400"}`} />
                    <p className="text-sm text-slate-600">
                      <label htmlFor="placementQuestionsCSV" className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                        Choose a CSV file
                      </label>
                      {" "}or drag and drop it here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Only CSV files are supported</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block mb-1">Expected CSV Headers:</span>
                      <code className="text-[10px] bg-slate-100 text-slate-800 p-1.5 rounded block whitespace-normal break-all font-mono leading-relaxed select-all">
                        question_text, option_a, option_b, option_c, option_d, correct_option, mark
                      </code>
                      <span className="text-[10px] text-slate-500 mt-1.5 block">
                        * Required: <code className="bg-slate-100 px-0.5 rounded">correct_option</code> value must be single letter: A, B, C, or D.
                      </span>
                    </div>
                  </div>
                </div>

                  {newTest.questions.length > 0 && (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between">
                      <p className="text-sm text-emerald-700 font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {newTest.questions.length} questions loaded successfully
                      </p>
                      <Button type="button" variant="outline" size="sm" className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100" onClick={() => {
                        setSelectedCourse({ title: newTest.title || "New Course Draft" });
                        setQuestions(newTest.questions);
                        setQuestionsModalOpen(true);
                      }}>
                        Preview Questions
                      </Button>
                    </div>
                  )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setTestModalOpen(false)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreateTest}>Create Course</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {questionsModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl border border-slate-100 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Questions for: {selectedCourse.title}</h3>
              <Button variant="ghost" onClick={() => setQuestionsModalOpen(false)}>Close</Button>
            </div>
            
            {loadingQuestions ? (
              <p>Loading questions...</p>
            ) : questions.length === 0 ? (
              <p className="text-slate-500">No questions found.</p>
            ) : (
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <Card key={q.question_id || `new-${idx}`} className="border-slate-200 shadow-sm mb-4">
                    <CardContent className="pt-4">
                      {editingQuestionId === q.question_id && q.question_id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-500">Question Text</label>
                            <textarea
                              className="w-full text-sm border-slate-300 rounded-md mt-1"
                              value={editForm.text}
                              onChange={e => setEditForm({ ...editForm, text: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-slate-500">Option A</label>
                              <input type="text" className="w-full text-sm border-slate-300 rounded-md mt-1" value={editForm.a} onChange={e => setEditForm({ ...editForm, a: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-500">Option B</label>
                              <input type="text" className="w-full text-sm border-slate-300 rounded-md mt-1" value={editForm.b} onChange={e => setEditForm({ ...editForm, b: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-500">Option C</label>
                              <input type="text" className="w-full text-sm border-slate-300 rounded-md mt-1" value={editForm.c} onChange={e => setEditForm({ ...editForm, c: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-500">Option D</label>
                              <input type="text" className="w-full text-sm border-slate-300 rounded-md mt-1" value={editForm.d} onChange={e => setEditForm({ ...editForm, d: e.target.value })} />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500">Correct Option (A, B, C, D)</label>
                            <input type="text" maxLength={1} className="w-full text-sm border-slate-300 rounded-md mt-1 uppercase" value={editForm.correct} onChange={e => setEditForm({ ...editForm, correct: e.target.value.toUpperCase() })} />
                          </div>
                          <div className="flex justify-end gap-2 mt-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingQuestionId(null)}>Cancel</Button>
                            <Button size="sm" onClick={() => handleSaveQuestion(q.question_id)}>Save</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-slate-800"><span className="mr-2 text-slate-400">{idx + 1}.</span>{q.text || q.question_text}</p>
                            {q.question_id && (
                              <Button size="sm" variant="ghost" onClick={() => {
                                setEditingQuestionId(q.question_id);
                                setEditForm({ text: q.text || q.question_text, a: q.a || q.option_a, b: q.b || q.option_b, c: q.c || q.option_c, d: q.d || q.option_d, correct: q.correct || q.correct_option });
                              }}>Edit</Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 pl-6">
                            <div className={(q.correct || q.correct_option) === 'A' ? 'font-bold text-emerald-600 bg-emerald-50 rounded px-2' : 'px-2'}>A: {q.a || q.option_a}</div>
                            <div className={(q.correct || q.correct_option) === 'B' ? 'font-bold text-emerald-600 bg-emerald-50 rounded px-2' : 'px-2'}>B: {q.b || q.option_b}</div>
                            <div className={(q.correct || q.correct_option) === 'C' ? 'font-bold text-emerald-600 bg-emerald-50 rounded px-2' : 'px-2'}>C: {q.c || q.option_c}</div>
                            <div className={(q.correct || q.correct_option) === 'D' ? 'font-bold text-emerald-600 bg-emerald-50 rounded px-2' : 'px-2'}>D: {q.d || q.option_d}</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Question Generator Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl border border-slate-100 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" /> AI Question & Distractor Generator
                </h3>
                <p className="text-xs text-slate-500">Automatically synthesize campus placement MCQs with verified distractors and explanations.</p>
              </div>
              <Button variant="ghost" onClick={() => setAiModalOpen(false)}>Close</Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Domain / Skill</label>
                  <select 
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white"
                    value={aiDomain}
                    onChange={(e) => setAiDomain(e.target.value)}
                  >
                    <option value="quant">Quantitative Aptitude</option>
                    <option value="reasoning">Logical Reasoning</option>
                    <option value="verbal">Verbal Ability & English</option>
                    <option value="technical">Technical CS & Coding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Questions</label>
                  <select 
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white"
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Course (Optional)</label>
                  <select 
                    className="w-full text-sm border border-slate-200 rounded-md p-2 bg-white"
                    value={aiTargetCourseId}
                    onChange={(e) => setAiTargetCourseId(e.target.value)}
                  >
                    <option value="">Preview Only (Do not save)</option>
                    {courses.map(c => (
                      <option key={c.test_id} value={c.test_id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button 
                  onClick={handleGenerateAIQuestions} 
                  disabled={aiGenerating}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {aiGenerating ? "Synthesizing AI Questions..." : "Generate MCQs"}
                </Button>
              </div>

              {/* Preview Generated Questions */}
              {aiGeneratedQuestions.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-sm font-bold text-slate-700">Generated MCQs Preview ({aiGeneratedQuestions.length})</h4>
                  {aiGeneratedQuestions.map((q, idx) => (
                    <Card key={idx} className="border-slate-200 bg-slate-50/50">
                      <CardContent className="p-4 space-y-2">
                        <p className="text-sm font-semibold text-slate-800">Q{idx + 1}. {q.text}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pl-2">
                          <span className={q.correct_option === 'A' ? 'font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded' : 'px-2 py-1'}>A: {q.option_a}</span>
                          <span className={q.correct_option === 'B' ? 'font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded' : 'px-2 py-1'}>B: {q.option_b}</span>
                          <span className={q.correct_option === 'C' ? 'font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded' : 'px-2 py-1'}>C: {q.option_c}</span>
                          <span className={q.correct_option === 'D' ? 'font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded' : 'px-2 py-1'}>D: {q.option_d}</span>
                        </div>
                        {q.explanation && (
                          <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                            💡 Explanation: {q.explanation}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
