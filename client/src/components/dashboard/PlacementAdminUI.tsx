import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, BookOpen, Layers, CheckCircle2, Upload, Download, Info } from "lucide-react";

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

  function parseCSV(text: string) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      // Handle commas inside quotes properly if needed, but for simplicity split by comma
      // This simple split is fine if the CSV is basic, or we can use a more robust regex
      const cols = line.split(",").map((c) => c.trim());
      const obj: any = {};
      headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
      return obj;
    });
  }

  function handleFileUpload(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target?.result as string);
      const prepared = parsed.map((r, idx) => ({
        id: Date.now() + idx,
        text: r.question_text || r.text,
        a: r.option_a || r.a,
        b: r.option_b || r.b,
        c: r.option_c || r.c,
        d: r.option_d || r.d,
        correct: r.correct_option || r.correct,
        subject: r.subject || r.category,
        difficulty: r.difficulty || "Medium",
        mark: r.mark || 1
      }));
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
                  <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ✓ {newTest.questions.length} questions loaded from CSV
                  </p>
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
                  <Card key={q.question_id} className="border-slate-200 shadow-sm">
                    <CardContent className="pt-4">
                      {editingQuestionId === q.question_id ? (
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
                            <p className="font-medium text-slate-800"><span className="mr-2 text-slate-400">{idx + 1}.</span>{q.text}</p>
                            <Button size="sm" variant="ghost" onClick={() => {
                              setEditingQuestionId(q.question_id);
                              setEditForm({ text: q.text, a: q.a, b: q.b, c: q.c, d: q.d, correct: q.correct });
                            }}>Edit</Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 pl-6">
                            <div className={q.correct === 'A' ? 'font-bold text-emerald-600' : ''}>A: {q.a}</div>
                            <div className={q.correct === 'B' ? 'font-bold text-emerald-600' : ''}>B: {q.b}</div>
                            <div className={q.correct === 'C' ? 'font-bold text-emerald-600' : ''}>C: {q.c}</div>
                            <div className={q.correct === 'D' ? 'font-bold text-emerald-600' : ''}>D: {q.d}</div>
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

    </div>
  );
}
