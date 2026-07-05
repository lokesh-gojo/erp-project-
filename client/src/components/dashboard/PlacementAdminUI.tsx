import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, BookOpen, Layers, CheckCircle2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export default function PlacementAdminUI() {
  const [topics, setTopics] = useState<any[]>([]);
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

  const fetchTopics = async () => {
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/topic/topics-with-subtopics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Filter to only placement topics
        setTopics(data.topics.filter((t: any) => t.type === 'placement'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
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
        fetchTopics();
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading placement data...</p>
        ) : topics.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
            No placement topics found. Create one to get started.
          </div>
        ) : (
          topics.map((topic) => (
            <Card key={topic.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    {topic.title}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {topic.description || "No description provided."}
                </p>
                <div className="flex justify-between items-center text-sm font-medium text-slate-700">
                  <span className="flex items-center gap-1">
                    <Layers className="h-4 w-4 text-slate-400" /> 
                    {topic.subtopics?.length || 0} Subtopics
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Questions (CSV)</label>
                <input
                  type="file"
                  accept=".csv"
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                {newTest.questions.length > 0 && (
                  <p className="text-xs text-emerald-600 mt-2 font-medium">
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
    </div>
  );
}
