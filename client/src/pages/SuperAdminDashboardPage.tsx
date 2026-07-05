import React, { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import college_logo from "../assets/main/College_logo.png";
import naac_logo from "../assets/main/NAAC-Logo-250x250-1.png";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import icon from "../assets/main/College_logo.png";
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  BarChart3,
  Key,
  LogOut,
  Plus,
  Search,
  Trash2,
  Edit,
  Calendar,
  Clock,
  CheckCircle2,
  Download,
  Upload,
  ChevronRight,
  RefreshCw,
  X,
  AlertCircle,
  Menu,
  Briefcase
} from "lucide-react";
import PlacementAdminUI from "../components/dashboard/PlacementAdminUI";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// Client-side CSV parser helper
function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const obj: any = {};
    headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
    return obj;
  });
}

// Client-side CSV exporter helper
function exportToCSV(filename: string, rows: any[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Premium Light Modal Component
const Modal = ({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// Premium Table Component
const Table = ({
  columns,
  rows,
  actions,
}: {
  columns: { key: string; title: string; render?: (r: any) => React.ReactNode }[];
  rows: any[];
  actions?: (r: any) => React.ReactNode;
}) => {
  return (
    <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left table-auto border-collapse">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {c.title}
              </th>
            ))}
            {actions && (
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-8 text-center text-slate-400 text-sm">
                No records found
              </td>
            </tr>
          )}
          {rows.map((r, idx) => (
            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
              {columns.map((c) => (
                <td key={c.key} className="px-5 py-4 text-sm text-slate-700">
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
              {actions && <td className="px-5 py-3 text-right">{actions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Default initial data fallbacks
const initialQuestions = [
  { id: 1, text: "What is React?", a: "Library", b: "Database", c: "Protocol", d: "Language", correct: "A", subject: "Web", difficulty: "Easy", approved: true },
];
const initialTests = [
  { id: 1, title: "CSE Midterm 1", department: "CSE", scheduledFor: "2025-09-30T10:00:00", duration: 60, status: "Published", active: false },
];

export default function SuperAdminDashboardPage() {
  const [view, setView] = useState("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  // Decode JWT on mount to find admin user id
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const userId = decoded?.user_id || decoded?.id;
        if (userId) {
          setAdminUserId(userId);
        }
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }
  }, []);

  // State definitions
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>(initialQuestions);
  const [tests, setTests] = useState<any[]>(initialTests);
  const [topics, setTopics] = useState<any[]>([]);
  const [subTopics, setSubTopics] = useState<any[]>([]);
  const [subTopicsWithQuestions, setSubTopicsWithQuestions] = useState<any[]>([]);

  function fetchStudentsList() {
    fetch(`${API_BASE}/users/list`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(
          data.map((s: any) => ({
            id: s.id,
            roll: s.roll_no,
            name: s.name,
            email: s.email,
            department: s.department_name,
            year: s.year,
          }))
        );
      })
      .catch(() => setStudents([]));
  }

  // Fetch initial data
  useEffect(() => {
    fetch(`${API_BASE}/dept/departments`)
      .then((res) => res.json())
      .then((data) => {
        setDepartments(
          data.map((d: any) => ({
            id: d.id,
            code: d.short_name,
            name: d.full_name,
            hodName: d.hod_name,
          }))
        );
      })
      .catch(() => setDepartments([]));

    fetch(`${API_BASE}/users/faculty-list`)
      .then((res) => res.json())
      .then((data) => {
        setFaculty(
          data.map((f: any) => ({
            id: f.id,
            roll: f.roll_no,
            name: f.name,
            email: f.email,
            department: f.department_name,
          }))
        );
      })
      .catch(() => setFaculty([]));

    fetchStudentsList();

    fetch(`${API_BASE}/question/topics`)
      .then((res) => res.json())
      .then((data) => setTopics(data.topics || []))
      .catch(() => setTopics([]));

    fetch(`${API_BASE}/question/sub-topics`)
      .then((res) => res.json())
      .then((data) => setSubTopics(data.sub_topics || []))
      .catch(() => setSubTopics([]));

    fetch(`${API_BASE}/question/sub-topics-with-questions`)
      .then((res) => res.json())
      .then((data) => {
        const subTopicsList = data.sub_topics || [];
        setSubTopicsWithQuestions(subTopicsList);
        const allQuestions = subTopicsList.flatMap((st: any) =>
          (st.questions || []).map((q: any) => ({
            id: q.question_id,
            text: q.text,
            a: q.a,
            b: q.b,
            c: q.c,
            d: q.d,
            correct: q.correct
          }))
        );
        setQuestions(allQuestions);
      })
      .catch(() => {
        setSubTopicsWithQuestions([]);
        setQuestions([]);
      });

    fetchTestsList();
  }, []);

  // Filter States
  const [facultyFilters, setFacultyFilters] = useState({ roll: "", name: "", department: "" });
  const [studentFilters, setStudentFilters] = useState({ roll: "", name: "", department: "", year: "" });
  const [topicFilter, setTopicFilter] = useState("");
  const [subTopicFilter, setSubTopicFilter] = useState("");
  const [testFilters, setTestFilters] = useState({ title: "", department: "", date: "" });
  const [testTab, setTestTab] = useState<"all" | "live" | "upcoming" | "completed">("all");

  // Memos for Filtered Lists
  const filteredFaculty = useMemo(() => {
    return faculty.filter(
      (f) =>
        (!facultyFilters.roll || f.roll?.toLowerCase().includes(facultyFilters.roll.toLowerCase())) &&
        (!facultyFilters.name || f.name?.toLowerCase().includes(facultyFilters.name.toLowerCase())) &&
        (!facultyFilters.department || f.department === facultyFilters.department)
    );
  }, [faculty, facultyFilters]);

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        (!studentFilters.roll || s.roll?.toLowerCase().includes(studentFilters.roll.toLowerCase())) &&
        (!studentFilters.name || s.name?.toLowerCase().includes(studentFilters.name.toLowerCase())) &&
        (!studentFilters.department || s.department === studentFilters.department) &&
        (!studentFilters.year || String(s.year) === String(studentFilters.year))
    );
  }, [students, studentFilters]);

  // Resolving missing filteredTestsList variable
  const filteredTestsList = useMemo(() => {
    return tests.filter((t) => {
      if (testFilters.title && !t.title.toLowerCase().includes(testFilters.title.toLowerCase())) {
        return false;
      }
      if (testFilters.department && t.department !== testFilters.department) {
        return false;
      }
      if (testFilters.date) {
        if (!t.scheduledFor) return false;
        const d = new Date(t.scheduledFor);
        if (isNaN(d.getTime())) return false;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const testLocalDateStr = `${year}-${month}-${day}`;
        if (testFilters.date !== testLocalDateStr) return false;
      }
      const isLive = t.active;
      const isUpcoming = !t.active && t.scheduledFor && new Date(t.scheduledFor) > new Date();
      const isCompleted = !t.active && (!t.scheduledFor || new Date(t.scheduledFor) <= new Date());

      if (testTab === "live" && !isLive) return false;
      if (testTab === "upcoming" && !isUpcoming) return false;
      if (testTab === "completed" && !isCompleted) return false;

      return true;
    });
  }, [tests, testFilters, testTab]);

  // Modal and wizard states
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);

  const [facultyModalOpen, setFacultyModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);

  const [addStaffModalOpen, setAddStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ roll_no: "", name: "", email: "", department_id: "" });
  const [addStaffLoading, setAddStaffLoading] = useState(false);

  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({ roll_no: "", name: "", email: "", department_id: "", year: "" });
  const [addStudentLoading, setAddStudentLoading] = useState(false);

  const [studentEditModalOpen, setStudentEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvDept, setCsvDept] = useState("");
  const [csvYear, setCsvYear] = useState("");
  const [csvRole, setCsvRole] = useState("1");
  const [csvEditRows, setCsvEditRows] = useState<any[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [subTopicModalOpen, setSubTopicModalOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<any>(null);
  const [filteredSubTopics, setFilteredSubTopics] = useState<any[]>([]);
  const [activeSubTopicQuestions, setActiveSubTopicQuestions] = useState<any[]>([]);
  const [activeSubTopicTitle, setActiveSubTopicTitle] = useState("");

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  const [testWizardOpen, setTestWizardOpen] = useState(false);
  const [activeTestMonitor, setActiveTestMonitor] = useState<any[]>([]);

  const [adminPwdModalOpen, setAdminPwdModalOpen] = useState(false);
  const [adminPwdValue, setAdminPwdValue] = useState("");
  const [adminPwdLoading, setAdminPwdLoading] = useState(false);

  const stats = useMemo(
    () => ({
      departments: departments.length,
      faculty: faculty.length,
      students: students.length,
      activeTests: tests.filter((t) => t.active).length,
      reports: 0,
    }),
    [departments, faculty, students, tests]
  );

  // Active tests monitoring simulation (real app uses sockets/polling)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestMonitor(tests.filter((t) => t.active));
    }, 5000);
    return () => clearInterval(interval);
  }, [tests]);

  // Keep student modal reset in sync
  useEffect(() => {
    if (view !== "students") {
      setStudentEditModalOpen(false);
      setEditingStudent(null);
    }
  }, [view]);

  // Action methods
  function handleLogout() {
    localStorage.removeItem("jwt_token");
    window.location.href = "/";
  }

  /* -------------------- Departments CRUD -------------------- */
  function openAddDept() {
    setEditingDept({ code: "", name: "", hodId: null });
    setDeptModalOpen(true);
  }

  function saveDepartment(data: any) {
    if (!data.name || !data.code) return alert("Please enter department name and code");
    setDeptLoading(true);
    const payload = {
      short_name: data.code,
      full_name: data.name,
      hod_id: data.hodId || null,
    };
    
    // Find the HOD name from the faculty list
    const facultyMember = faculty.find((f) => String(f.id) === String(data.hodId));
    const hodName = facultyMember ? facultyMember.name : null;

    if (data.id) {
      fetch(`${API_BASE}/dept/update-department/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((result) => {
          setDeptLoading(false);
          if (result.success) {
            setDepartments((d) => d.map((x) => (x.id === data.id ? { ...x, ...data, hodName } : x)));
            setDeptModalOpen(false);
            alert("Department updated successfully.");
          } else {
            alert(result.error || "Failed to update department");
          }
        })
        .catch((err) => {
          setDeptLoading(false);
          alert("Error updating department: " + (err?.message || "Unknown error"));
        });
    } else {
      fetch(`${API_BASE}/dept/add-department`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((result) => {
          setDeptLoading(false);
          if (result.success) {
            setDepartments((d) => [...d, { ...data, id: result.insertedId, hodName }]);
            setDeptModalOpen(false);
            alert("Department created successfully.");
          } else {
            alert(result.error || "Failed to add department");
          }
        })
        .catch((err) => {
          setDeptLoading(false);
          alert("Error adding department: " + (err?.message || "Unknown error"));
        });
    }
  }

  function removeDepartment(id: number) {
    if (!confirm("Delete department? This will not delete faculty/students automatically.")) return;
    fetch(`${API_BASE}/dept/delete-department/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setDepartments((d) => d.filter((x) => x.id !== id));
          alert("Department deleted successfully.");
        } else {
          alert(result.error || "Failed to delete department.");
        }
      })
      .catch((err) => alert("Error deleting department: " + (err?.message || "Unknown error")));
  }

  /* -------------------- Faculty CRUD -------------------- */
  async function handleAddStaff() {
    if (!newStaff.roll_no || !newStaff.name || !newStaff.email || !newStaff.department_id) {
      return alert("Please fill all staff details");
    }
    setAddStaffLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/add-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const deptObj = departments.find((d) => d.id == newStaff.department_id);
        setFaculty((f) => [
          {
            id: result.insertedId,
            roll: newStaff.roll_no,
            name: newStaff.name,
            email: newStaff.email,
            department: deptObj ? deptObj.code : "",
          },
          ...f,
        ]);
        setAddStaffModalOpen(false);
        setNewStaff({ roll_no: "", name: "", email: "", department_id: "" });
        alert("Staff added successfully.");
      } else {
        alert(result.error || "Failed to add staff.");
      }
    } catch (err: any) {
      alert("Error adding staff: " + (err?.message || "Unknown error"));
    }
    setAddStaffLoading(false);
  }

  function openAddFaculty() {
    setEditingFaculty({ id: null, name: "", email: "", department: "" });
    setFacultyModalOpen(true);
  }

  function saveFaculty(data: any) {
    if (!data.name || !data.email || !data.roll || !data.department) {
      return alert("Please provide name, email, roll number, and department");
    }
    const deptObj = departments.find((d) => d.code === data.department);
    if (!deptObj) {
      return alert("Please select a valid department");
    }
    const payload = {
      roll_no: data.roll,
      name: data.name,
      email: data.email,
      department_id: deptObj.id,
    };
    if (data.id) {
      fetch(`${API_BASE}/users/update-faculty/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setFaculty((f) => f.map((x) => (x.id === data.id ? { ...x, ...data, department: deptObj.code } : x)));
            setFacultyModalOpen(false);
            alert("Faculty profile updated successfully.");
          } else {
            alert(result.error || "Failed to update faculty");
          }
        })
        .catch((err) => alert("Error updating faculty: " + (err?.message || "Unknown error")));
    } else {
      fetch(`${API_BASE}/users/add-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setFaculty((f) => [
              {
                id: result.insertedId,
                roll: data.roll,
                name: data.name,
                email: data.email,
                department: deptObj.code,
              },
              ...f,
            ]);
            setFacultyModalOpen(false);
            alert("Faculty added successfully.");
          } else {
            alert(result.error || "Failed to add faculty.");
          }
        })
        .catch((err) => alert("Error adding faculty: " + (err?.message || "Unknown error")));
    }
  }

  function resetFacultyPassword(id: number) {
    if (!confirm("Reset password for this staff member?")) return;
    fetch(`${API_BASE}/users/reset-password-faculty/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          alert("Password reset successfully.");
        } else {
          alert(result.error || "Failed to reset password.");
        }
      })
      .catch((err) => alert("Error resetting password: " + (err?.message || "Unknown error")));
  }

  function deleteFaculty(id: number) {
    if (!confirm("Remove faculty profile?")) return;
    fetch(`${API_BASE}/users/delete-faculty/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setFaculty((f) => f.filter((x) => x.id !== id));
          alert("Faculty deleted successfully.");
        } else {
          alert(result.error || "Failed to delete faculty.");
        }
      })
      .catch((err) => alert("Error deleting faculty: " + (err?.message || "Unknown error")));
  }

  /* -------------------- Students CRUD & CSV -------------------- */
  async function handleAddStudent() {
    if (!newStudent.roll_no || !newStudent.name || !newStudent.email || !newStudent.department_id || !newStudent.year) {
      return alert("Please fill all student details");
    }
    setAddStudentLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const deptObj = departments.find((d) => d.id == newStudent.department_id);
        setStudents((s) => [
          {
            id: result.insertedId,
            roll: newStudent.roll_no,
            name: newStudent.name,
            email: newStudent.email,
            department: deptObj ? deptObj.code : "",
            year: parseInt(newStudent.year, 10),
          },
          ...s,
        ]);
        setAddStudentModalOpen(false);
        setNewStudent({ roll_no: "", name: "", email: "", department_id: "", year: "" });
        alert("Student added successfully.");
      } else {
        alert(result.error || "Failed to add student.");
      }
    } catch (err: any) {
      alert("Error adding student: " + (err?.message || "Unknown error"));
    }
    setAddStudentLoading(false);
  }

  function handleStudentCSVUpload(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setCsvPreview(parsed);
      setCsvEditRows(parsed.map((row) => ({ ...row })));
      setCsvHeaders(parsed.length ? Object.keys(parsed[0]) : []);
      setCsvDept("");
      setCsvYear("");
      setCsvRole("1");
      setStudentsModalOpen(true);
    };
    reader.readAsText(file);
  }

  async function commitCsvStudents() {
    if (!csvEditRows.length) return alert("No CSV data to import");
    if (!csvDept) return alert("Please select department");
    if (!csvYear) return alert("Please select year");
    const newStudents = csvEditRows.map((r, idx) => ({
      roll: r.roll || r.roll_no || r.roll_number || r.Roll || `R${Date.now() + idx}`,
      name: r.name || r.fullname || r.Name || "Unknown",
      email: r.email || r.Email || "",
      department: csvDept,
      year: parseInt(csvYear, 10),
      role: 1,
    }));
    try {
      const res = await fetch(`${API_BASE}/users/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: newStudents }),
      });
      const result = await res.json();
      if (result.success) {
        fetchStudentsList();
        setCsvPreview([]);
        setCsvEditRows([]);
        setStudentsModalOpen(false);
        setCsvDept("");
        setCsvYear("");
        setCsvRole("1");
        alert(`Imported ${newStudents.length} students successfully.`);
      } else {
        alert(`Import failed: ${result.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    }
  }

  async function removeStudent(id: number) {
    if (!confirm("Remove student?")) return;
    try {
      const res = await fetch(`${API_BASE}/users/delete/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setStudents((s) => s.filter((x) => x.id !== id));
        alert("Student deleted successfully.");
      } else {
        alert(result.error || "Failed to delete student.");
      }
    } catch (err: any) {
      alert("Error deleting student: " + (err?.message || "Unknown error"));
    }
  }

  async function resetStudentPassword(id: number) {
    if (!confirm("Reset password for this student?")) return;
    try {
      const res = await fetch(`${API_BASE}/users/reset-password/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (result.success) {
        alert("Password reset successfully.");
      } else {
        alert(result.error || "Failed to reset password.");
      }
    } catch (err: any) {
      alert("Error resetting password: " + err.message);
    }
  }

  function openStudentEditModal(r: any): void {
    setEditingStudent(r);
    setStudentEditModalOpen(true);
  }

  /* -------------------- Questions CRUD -------------------- */
  function openAddQuestion(q?: any) {
    setEditingQuestion(
      q ?? { text: "", a: "", b: "", c: "", d: "", correct: "A", subject: "", difficulty: "Medium", approved: false }
    );
    setQuestionModalOpen(true);
  }

  function saveQuestion(q: any) {
    if (!q.text) return alert("Question text required");
    if (q.id) {
      setQuestions((qs) => qs.map((x) => (x.id === q.id ? { ...x, ...q } : x)));
    } else {
      const id = Math.max(0, ...questions.map((x) => x.id)) + 1;
      setQuestions((qs) => [...qs, { ...q, id }]);
    }
    setQuestionModalOpen(false);
  }

  function bulkUploadQuestions(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target?.result as string);
      const prepared = parsed.map((r, idx) => ({
        id: Date.now() + idx,
        text: r.question_text || r.text,
        a: r.option_a,
        b: r.option_b,
        c: r.option_c,
        d: r.option_d,
        correct: r.correct_option || r.correct,
        subject: r.subject || r.category,
        difficulty: r.difficulty || "Medium",
        approved: false,
      }));
      setQuestions((q) => [...prepared, ...q]);
      alert(`Parsed ${prepared.length} questions - pending review.`);
    };
    reader.readAsText(file);
  }

  /* -------------------- Tests Wizard -------------------- */
  const testWizardInit = {
    facultyId: "",
    facultyName: "",
    title: "",
    subject: "",
    department: "",
    scheduledFor: "",
    duration: 30,
    topicId: "",
    subTopicId: "",
    numQuestions: "",
  };
  const [testDraft, setTestDraft] = useState<any>(testWizardInit);
  const [testStep, setTestStep] = useState(1);
  // Faculty topics loaded on-demand when faculty is selected
  const [wizardFacultyTopics, setWizardFacultyTopics] = useState<any[]>([]);
  const [wizardFacultyTopicsLoading, setWizardFacultyTopicsLoading] = useState(false);
  const [wizardSubTopics, setWizardSubTopics] = useState<any[]>([]);
  const [wizardQuestionCount, setWizardQuestionCount] = useState(0);

  async function fetchFacultyTopics(facultyId: string) {
    if (!facultyId) { setWizardFacultyTopics([]); return; }
    setWizardFacultyTopicsLoading(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/users/faculty/${facultyId}/topics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setWizardFacultyTopics(data.topics || []);
    } catch { setWizardFacultyTopics([]); }
    finally { setWizardFacultyTopicsLoading(false); }
  }

  function openTestWizard() {
    setTestDraft(testWizardInit);
    setTestStep(1);
    setWizardFacultyTopics([]);
    setWizardSubTopics([]);
    setWizardQuestionCount(0);
    setTestWizardOpen(true);
  }

  function fetchTestsList() {
    const token = localStorage.getItem("jwt_token");
    fetch(`${API_BASE}/test`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTests(
            (data.tests || []).map((t: any) => ({
              id: t.test_id,
              title: t.title,
              department: t.dept_short_name || t.department_name || "All",
              scheduledFor: t.date,
              duration: t.duration_minutes,
              active: t.is_active === 1 || t.is_active === true,
              subject: t.subject
            }))
          );
        }
      })
      .catch(() => setTests([]));
  }

  async function publishTest() {
    if (!testDraft.facultyId || !testDraft.title || !testDraft.subject || !testDraft.department || !testDraft.scheduledFor) {
      return alert("Please fill all required fields (Faculty, Title, Subject, Department, Date)");
    }
    if (!testDraft.subTopicId || !testDraft.numQuestions) {
      return alert("Please select a topic/subtopic and specify question count");
    }
    const token = localStorage.getItem("jwt_token");
    const deptObj = departments.find((d) => d.code === testDraft.department);
    const bodyPayload = {
      title: testDraft.title,
      subject: testDraft.subject,
      description: "",
      department_id: deptObj ? deptObj.id : null,
      year: "1",
      date: testDraft.scheduledFor,
      duration_minutes: testDraft.duration,
      num_questions: parseInt(testDraft.numQuestions, 10),
      is_active: 0,
      topic_id: testDraft.topicId,
      sub_topic_id: testDraft.subTopicId,
      faculty_id: testDraft.facultyId,
    };

    try {
      const res = await fetch(`${API_BASE}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (data.success) {
        // Assign questions from the subtopic automatically
        const testId = data.test?.test_id || data.testId;
        if (testId) {
          await fetch(`${API_BASE}/test/${testId}/assign-questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ sub_topic_id: testDraft.subTopicId, num_questions: parseInt(testDraft.numQuestions, 10) })
          });
        }
        alert("Test scheduled and published successfully.");
        setTestWizardOpen(false);
        fetchTestsList();
      } else {
        alert(data.error || "Failed to schedule test");
      }
    } catch (err: any) {
      alert("Error publishing test: " + err.message);
    }
  }

  async function toggleTestActive(id: number) {
    const token = localStorage.getItem("jwt_token");
    try {
      const res = await fetch(`${API_BASE}/test/${id}/toggle-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        fetchTestsList();
      } else {
        alert(data.error || "Failed to toggle test status");
      }
    } catch (err: any) {
      alert("Error toggling test status: " + err.message);
    }
  }

  async function deleteTest(id: number) {
    if (!confirm("Are you sure you want to delete this test?")) return;
    const token = localStorage.getItem("jwt_token");
    try {
      const res = await fetch(`${API_BASE}/test/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert("Test deleted successfully.");
        fetchTestsList();
      } else {
        alert(data.error || "Failed to delete test");
      }
    } catch (err: any) {
      alert("Error deleting test: " + err.message);
    }
  }

  /* -------------------- Reports -------------------- */
  const [reportSubView, setReportSubView] = useState<"overview" | "testpdf" | "students">("overview");
  // Test-wise PDF states (reusing faculty report pattern)
  const [reportTests, setReportTests] = useState<any[]>([]);
  const [reportTestsLoading, setReportTestsLoading] = useState(false);
  const [reportSelectedTest, setReportSelectedTest] = useState<any>(null);
  const [reportTestAnalysis, setReportTestAnalysis] = useState<any>(null);
  const [reportAnalysisLoading, setReportAnalysisLoading] = useState(false);
  const [reportPdfUrl, setReportPdfUrl] = useState<string>("");
  const [reportPdfLoading, setReportPdfLoading] = useState(false);
  const [reportFilterDate, setReportFilterDate] = useState("");
  const [reportFilterSearch, setReportFilterSearch] = useState("");

  const filteredReportTests = useMemo(() => {
    return reportTests.filter((t) => {
      if (reportFilterDate) {
        if (!t.date) return false;
        const d = new Date(t.date);
        if (isNaN(d.getTime())) return false;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const testLocalDateStr = `${year}-${month}-${day}`;
        if (testLocalDateStr !== reportFilterDate) return false;
      }
      if (reportFilterSearch) {
        const query = reportFilterSearch.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(query);
        const matchFaculty = t.facultyName?.toLowerCase().includes(query);
        if (!matchTitle && !matchFaculty) return false;
      }
      return true;
    });
  }, [reportTests, reportFilterDate, reportFilterSearch]);


  useEffect(() => {
    let active = true;
    let localUrl = "";
    if (reportSelectedTest && reportTestAnalysis) {
      setReportPdfLoading(true);
      generatePDFBlobUrl(reportSelectedTest, reportTestAnalysis)
        .then((url) => {
          if (active) {
            setReportPdfUrl(url);
            localUrl = url;
          } else {
            URL.revokeObjectURL(url);
          }
        })
        .catch((err) => {
          console.error("Error generating PDF preview:", err);
        })
        .finally(() => {
          if (active) setReportPdfLoading(false);
        });
    } else {
      setReportPdfUrl("");
    }
    return () => {
      active = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [reportSelectedTest, reportTestAnalysis]);

  async function fetchReportTests() {
    setReportTestsLoading(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/reports/tests`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const data = await res.json();
      setReportTests(data.tests || []);
    } catch { setReportTests([]); }
    finally { setReportTestsLoading(false); }
  }

  async function fetchReportTestAnalysis(testId: number) {
    setReportAnalysisLoading(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE}/reports/test-analysis/${testId}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const data = await res.json();
      setReportTestAnalysis(data.testAnalysis || null);
    } catch { setReportTestAnalysis(null); }
    finally { setReportAnalysisLoading(false); }
  }
  const [reportFilter, setReportFilter] = useState({ department: "", testId: "", from: "", to: "" });
  function generateReportCSV() {
    const rows = students.map((s) => ({
      roll: s.roll,
      name: s.name,
      department: s.department,
      avg: Math.floor(Math.random() * 50) + 50,
    }));
    exportToCSV("iqarena_report_students.csv", rows);
  }

  async function buildPDFDoc(selectedTest: any, testAnalysis: any): Promise<jsPDF> {
    const { testInfo, stats, presentStudents, absentStudents, topPerformers } = testAnalysis;
    const doc = new jsPDF();

    const loadImageAsDataUrl = (src: string): Promise<string | null> =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) { ctx.drawImage(img, 0, 0); resolve(canvas.toDataURL("image/png")); } else resolve(null);
        };
        img.onerror = () => resolve(null);
        img.src = src;
      });

    const collegeLogoData = await loadImageAsDataUrl(college_logo);
    const naacLogoData = await loadImageAsDataUrl(naac_logo);

    // Header
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 55, "F");
    if (collegeLogoData) doc.addImage(collegeLogoData, "PNG", 15, 12, 25, 25);
    doc.setTextColor(26, 54, 93); doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("Easa College of Engineering and Technology", 105, 18, { align: "center" });
    doc.setTextColor(80, 80, 80); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("Navakkarai (p.o), NH - 47, Palakkad Main Road, Coimbatore, Tamil Nadu - 641105", 105, 24, { align: "center" });
    doc.setTextColor(26, 54, 93); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("Department of ECE", 105, 30, { align: "center" });
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(26, 54, 93);
    doc.text("TEST ANALYSIS REPORT", 105, 37, { align: "center" });
    doc.setDrawColor(26, 54, 93); doc.setLineWidth(0.7); doc.line(15, 41, 195, 41);
    if (naacLogoData) doc.addImage(naacLogoData, "PNG", 172, 14, 20, 20);
    doc.setTextColor(0, 0, 0); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(testInfo?.title || selectedTest.title, 15, 48);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Date: ${testInfo?.date ? new Date(testInfo.date).toLocaleDateString() : "-"} | Duration: ${testInfo?.duration || "-"} min | Questions: ${testInfo?.totalQuestions || "-"}`, 15, 54);
    if (testInfo?.facultyName) doc.text(`Faculty: ${testInfo.facultyName}`, 195, 54, { align: "right" });

    // Stats Row
    const startY = 62; const boxWidth = 45; const boxHeight = 22;
    const drawStatBox = (x: number, label: string, value: string, color: number[]) => {
      doc.setDrawColor(220, 220, 220); doc.rect(x, startY, boxWidth, boxHeight);
      doc.setTextColor(color[0], color[1], color[2]); doc.setFontSize(16); doc.setFont("helvetica", "bold");
      doc.text(value, x + boxWidth / 2, startY + 10, { align: "center" });
      doc.setTextColor(100, 100, 100); doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text(label, x + boxWidth / 2, startY + 18, { align: "center" });
    };
    drawStatBox(15, "Average Percentage", `${stats.avgPercentage}%`, [33, 47, 61]);
    drawStatBox(65, "Highest Score", `${stats.highestScore}`, [40, 167, 69]);
    drawStatBox(115, "Lowest Score", `${stats.lowestScore}`, [220, 53, 69]);
    drawStatBox(165, "Pass Rate", `${stats.passRate}%`, [26, 54, 93]);

    const attendanceY = 96;
    doc.setTextColor(0, 0, 0); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text(`Attended: ${(presentStudents || []).length} students`, 15, attendanceY);
    doc.text(`Not Attended: ${(absentStudents || []).length} students`, 115, attendanceY);

    // Top Performers
    const performersY = 104;
    doc.setFillColor(26, 54, 93); doc.rect(15, performersY, 4, 4, "F");
    doc.setTextColor(26, 54, 93); doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("Top Performers", 22, performersY + 3.5);
    autoTable(doc, {
      startY: performersY + 8,
      head: [["Rank", "Name", "Score"]],
      body: (topPerformers || []).slice(0, 10).map((s: any) => [s.rank || "-", s.name, `${s.score} / ${testInfo?.totalQuestions}`]),
      headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255] },
      margin: { left: 15, right: 15 }, styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: "auto" }, 2: { cellWidth: 40, halign: "right" } }
    });

    // Attended Students
    const presentedY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFillColor(44, 62, 80); doc.rect(15, presentedY, 4, 4, "F");
    doc.setTextColor(44, 62, 80); doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("List of Students - Attended", 22, presentedY + 3.5);
    autoTable(doc, {
      startY: presentedY + 8,
      head: [["Si.No", "Register No", "Name", "Department", "Year", "Score"]],
      body: (presentStudents || []).map((s: any, i: number) => [i + 1, s.rollNo, s.name, s.department || "-", s.year || "-", `${s.score} / ${testInfo?.totalQuestions}`]),
      headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] }, margin: { left: 15, right: 15 }, styles: { fontSize: 9 }
    });

    // Absent Students
    if ((absentStudents || []).length > 0) {
      let absentTableY = (doc as any).lastAutoTable.finalY + 12;
      if (absentTableY > 260) { doc.addPage(); absentTableY = 25; }
      doc.setFillColor(231, 76, 60); doc.rect(15, absentTableY, 4, 4, "F");
      doc.setTextColor(231, 76, 60); doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text("List of Students - Not Attended", 22, absentTableY + 3.5);
      autoTable(doc, {
        startY: absentTableY + 8,
        head: [["Si.No", "Register No", "Name", "Department", "Year"]],
        body: (absentStudents || []).map((s: any, i: number) => [i + 1, s.rollNo, s.name, s.department || "-", s.year || "-"]),
        headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] }, margin: { left: 15, right: 15 }, styles: { fontSize: 9 }
      });
    }

    // Signatures
    const lastTableBottom = (doc as any).lastAutoTable.finalY || 150;
    const footerLineY = 282;
    if (lastTableBottom > 250) {
      doc.addPage();
      doc.setTextColor(0,0,0); doc.setFontSize(10); doc.setFont("helvetica", "bold");
      doc.line(15, 140, 75, 140); doc.text("Department Advisior", 15, 146);
      doc.line(135, 140, 195, 140); doc.text("Head Of The Department", 195, 146, { align: "right" });
    } else {
      const signatureLineY = lastTableBottom + (footerLineY - lastTableBottom) / 2;
      doc.setTextColor(0,0,0); doc.setFontSize(10); doc.setFont("helvetica", "bold");
      doc.line(15, signatureLineY, 75, signatureLineY); doc.text("Department Advisior", 15, signatureLineY + 6);
      doc.line(135, signatureLineY, 195, signatureLineY); doc.text("Head Of The Department", 195, signatureLineY + 6, { align: "right" });
    }

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(26, 54, 93); doc.setLineWidth(0.2); doc.line(15, 282, 195, 282);
      doc.setTextColor(150, 150, 150); doc.setFontSize(8); doc.setFont("helvetica", "italic");
      doc.text("Developed by Thichana Moorthy IV Year ECE of EASA", 105, 288, { align: "center" });
      doc.text(`Page ${i} of ${pageCount}`, 195, 288, { align: "right" });
    }

    return doc;
  }

  async function exportSuperAdminTestReportPDF(selectedTest: any, testAnalysis: any) {
    try {
      const doc = await buildPDFDoc(selectedTest, testAnalysis);
      const title = testAnalysis?.testInfo?.title || selectedTest.title;
      doc.save(`Test_Report_${title.replace(/\s+/g, "_")}.pdf`);
    } catch (err: any) {
      alert("Error exporting PDF: " + err.message);
    }
  }

  async function generatePDFBlobUrl(selectedTest: any, testAnalysis: any): Promise<string> {
    const doc = await buildPDFDoc(selectedTest, testAnalysis);
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  }

  /* -------------------- Password Update -------------------- */
  async function handleSuperAdminResetPassword() {
    if (!adminUserId) return alert("Super Admin ID not found. Cannot reset password.");
    if (!adminPwdValue) return alert("Please enter a password.");
    setAdminPwdLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/reset-password-admin/${adminUserId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPwdValue }),
      });
      const result = await res.ok ? await res.json() : null;
      if (result && result.success) {
        alert("Password reset successfully.");
        setAdminPwdModalOpen(false);
        setAdminPwdValue("");
      } else {
        alert(result?.error || "Failed to reset password.");
      }
    } catch (err: any) {
      alert("Error resetting password: " + (err?.message || "Unknown error"));
    }
    setAdminPwdLoading(false);
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Left Sidebar (Desktop) */}
      <aside className="w-64 bg-white border-r border-slate-100 shadow-sm hidden md:flex flex-col justify-between">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 cursor-pointer group">
            <div className="bg-purple-600 p-2.5 rounded-xl shadow-md shadow-purple-600/10 group-hover:scale-105 transition-transform duration-200">
              <img src={icon} alt="Logo" className="h-6 w-6 invert object-contain" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl tracking-tight text-slate-800">PREP TRACK</h2>
              <span className="text-[10px] text-cyan-600 font-semibold tracking-wider uppercase">Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <SidebarLink icon={<LayoutDashboard className="h-4.5 w-4.5" />} active={view === "dashboard"} onClick={() => setView("dashboard")}>
              Dashboard
            </SidebarLink>
            <SidebarLink icon={<Building2 className="h-4.5 w-4.5" />} active={view === "departments"} onClick={() => setView("departments")}>
              Departments
            </SidebarLink>
            <SidebarLink icon={<Users className="h-4.5 w-4.5" />} active={view === "staff"} onClick={() => setView("staff")}>
              Faculty & Staff
            </SidebarLink>
            <SidebarLink icon={<GraduationCap className="h-4.5 w-4.5" />} active={view === "students"} onClick={() => setView("students")}>
              Students
            </SidebarLink>
            <SidebarLink icon={<BookOpen className="h-4.5 w-4.5" />} active={view === "questions"} onClick={() => setView("questions")}>
              Question Bank
            </SidebarLink>
            <SidebarLink icon={<FileText className="h-4.5 w-4.5" />} active={view === "tests"} onClick={() => setView("tests")}>
              Tests Management
            </SidebarLink>
            <SidebarLink icon={<BarChart3 className="h-4.5 w-4.5" />} active={view === "reports"} onClick={() => setView("reports")}>
              Reports & Analytics
            </SidebarLink>
            <SidebarLink icon={<Briefcase className="h-4.5 w-4.5" />} active={view === "placement"} onClick={() => setView("placement")}>
              Placement Mode
            </SidebarLink>
          </nav>
        </div>

        {/* Bottom logout section */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-500 hover:bg-purple-50 hover:text-purple-700 transition-all font-medium"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Navigation Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Drawer container */}
          <aside className="relative flex flex-col justify-between w-64 max-w-[80vw] h-full bg-white border-r border-slate-150 shadow-xl z-50 animate-in slide-in-from-left duration-300">
            <div className="p-6">
              {/* Header inside drawer */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="bg-purple-600 p-2 rounded-xl">
                    <img src={icon} alt="Logo" className="h-5 w-5 invert object-contain" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-lg text-slate-800">PREP TRACK</h2>
                    <span className="text-[9px] text-cyan-600 font-semibold uppercase">Portal</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Links inside drawer */}
              <nav className="flex flex-col gap-1.5">
                {[
                  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
                  { id: "departments", label: "Departments", icon: <Building2 className="h-4.5 w-4.5" /> },
                  { id: "staff", label: "Faculty & Staff", icon: <Users className="h-4.5 w-4.5" /> },
                  { id: "students", label: "Students", icon: <GraduationCap className="h-4.5 w-4.5" /> },
                  { id: "questions", label: "Question Bank", icon: <BookOpen className="h-4.5 w-4.5" /> },
                  { id: "tests", label: "Tests Management", icon: <FileText className="h-4.5 w-4.5" /> },
                  { id: "reports", label: "Reports & Analytics", icon: <BarChart3 className="h-4.5 w-4.5" /> },
                  { id: "placement", label: "Placement Mode", icon: <Briefcase className="h-4.5 w-4.5" /> }
                ].map((item) => (
                  <SidebarLink
                    key={item.id}
                    icon={item.icon}
                    active={view === item.id}
                    onClick={() => {
                      setView(item.id);
                      setMobileSidebarOpen(false);
                    }}
                  >
                    {item.label}
                  </SidebarLink>
                ))}
              </nav>
            </div>

            {/* Bottom Section in drawer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-500 hover:bg-purple-50 hover:text-purple-700 transition-all font-medium"
              >
                <LogOut className="h-4.5 w-4.5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 sm:px-8 py-5 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-50 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 capitalize tracking-tight">
              {view === "dashboard" ? "System Overview" : view}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8.5 w-8.5 bg-gradient-to-tr from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md shadow-purple-600/10">
                SA
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-800">Super Admin</div>
                <div className="text-[10px] text-slate-400 font-medium">Full Access</div>
              </div>
            </div>

            <span className="w-px h-6 bg-slate-200" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdminPwdModalOpen(true)}
                className="p-2.5 rounded-lg border border-slate-150 hover:bg-slate-50 text-slate-500 hover:text-cyan-600 transition-colors"
                title="Change Credentials"
              >
                <Key className="h-4 w-4" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-lg border border-slate-150 hover:bg-slate-50 text-slate-500 hover:text-purple-700 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Workspace Main Area */}
        <main className="p-4 sm:p-8 flex-1 overflow-y-auto">
          {/* Dashboard View */}
          {view === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Welcome Alert */}
              <div className="bg-gradient-to-r from-purple-600/5 to-cyan-500/5 border border-slate-200/60 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800">Welcome to PREP TRACK Management Suite</h3>
                  <p className="text-sm text-slate-500">Configure departments, process student data imports, administer tests, and track real-time analytics.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider">Systems Nominal</span>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <MetricCard title="Total Departments" value={stats.departments} icon={<Building2 className="h-5 w-5 text-purple-600" />} color="purple" />
                <MetricCard title="Total Faculty" value={stats.faculty} icon={<Users className="h-5 w-5 text-cyan-500" />} color="cyan" />
                <MetricCard title="Total Students" value={stats.students} icon={<GraduationCap className="h-5 w-5 text-purple-600" />} color="purple" />
                <MetricCard title="Active Tests" value={stats.activeTests} icon={<CheckCircle2 className="h-5 w-5 text-cyan-500" />} color="cyan" />
                <MetricCard title="Reports Exported" value={stats.reports} icon={<BarChart3 className="h-5 w-5 text-purple-600" />} color="purple" />
              </div>

              {/* Actions & Live Monitor */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side actions panel */}
                <div className="lg:col-span-1 space-y-6">
                  <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                      <CardTitle className="text-base font-bold text-slate-800">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3.5">
                      <Button onClick={openAddDept} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <Plus className="h-4 w-4" /> Add Department
                      </Button>
                      <Button onClick={openTestWizard} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <Calendar className="h-4 w-4" /> Create & Schedule Test
                      </Button>
                      <input
                        id="bulkQ"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && bulkUploadQuestions(e.target.files[0])}
                      />
                      <label htmlFor="bulkQ" className="block w-full">
                        <Button asChild className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer">
                          <span><Upload className="h-4 w-4" /> Upload Question Bank</span>
                        </Button>
                      </label>
                      <Button onClick={() => setView("reports")} className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Live Test Monitor (Right side, spans 2 columns) */}
                <div className="lg:col-span-2">
                  <Card className="border-slate-100 shadow-sm rounded-2xl h-full flex flex-col">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-800">Active Test Monitor</CardTitle>
                        <CardDescription className="text-xs text-slate-400">Updates dynamically every 5s</CardDescription>
                      </div>
                      <span className="text-[10px] bg-cyan-50 text-cyan-600 font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                        Live Tracking
                      </span>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 overflow-auto">
                      <Table
                        columns={[
                          { key: "title", title: "Title" },
                          { key: "department", title: "Department" },
                          {
                            key: "scheduledFor",
                            title: "Scheduled For",
                            render: (r) => (
                              <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                {new Date(r.scheduledFor).toLocaleString()}
                              </span>
                            ),
                          },
                          {
                            key: "duration",
                            title: "Duration",
                            render: (r) => (
                              <span className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {r.duration} mins
                              </span>
                            ),
                          },
                        ]}
                        rows={activeTestMonitor}
                        actions={(r) => (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleTestActive(r.id)}
                            className="text-xs border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                          >
                            {r.active ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Departments View */}
          {view === "departments" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Departments Directory</h2>
                  <p className="text-xs text-slate-400 mt-1">Manage institutional departments and HOD staff profiles.</p>
                </div>
                <Button onClick={openAddDept} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Department
                </Button>
              </div>

              {/* Total staff/student panel banner */}
              <div className="bg-slate-100/50 p-4 rounded-xl border border-slate-200/40 text-sm font-medium text-slate-600 flex gap-6">
                <div>Total Registered Faculty: <span className="text-slate-800 font-bold">{faculty.length}</span></div>
                <span className="text-slate-300">|</span>
                <div>Total Enrolled Students: <span className="text-slate-800 font-bold">{students.length}</span></div>
              </div>

              <Table
                columns={[
                  { key: "code", title: "Code", render: (r) => <span className="font-bold text-purple-700">{r.code}</span> },
                  { key: "name", title: "Name" },
                  { key: "hodName", title: "Head of Department", render: (r) => r.hodName || <span className="text-slate-400 italic">None Assigned</span> },
                  { key: "facultyCount", title: "Faculty Members" },
                  { key: "studentCount", title: "Students Enrolled" },
                ]}
                rows={departments.map((dept) => ({
                  ...dept,
                  facultyCount: faculty.filter((f) => f.department === dept.code || f.department === dept.name).length,
                  studentCount: students.filter((s) => s.department === dept.code || s.department === dept.name).length,
                }))}
                actions={(r) => (
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setEditingDept(r);
                        setDeptModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border hover:bg-slate-50 text-slate-500 hover:text-cyan-600 transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeDepartment(r.id)}
                      className="p-1.5 rounded-lg border hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              />
            </div>
          )}

          {/* Faculty / Staff View */}
          {view === "staff" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Faculty & Staff Members</h2>
                  <p className="text-xs text-slate-400 mt-1">Configure user accounts and assignments for lecturers and HODs.</p>
                </div>
                <Button onClick={() => setAddStaffModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Staff Profile
                </Button>
              </div>

              {/* Filtering Panel */}
              <Card className="border-slate-100 shadow-sm p-5 rounded-2xl bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Roll No..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                      value={facultyFilters.roll}
                      onChange={(e) => setFacultyFilters((f) => ({ ...f, roll: e.target.value }))}
                    />
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Name..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                      value={facultyFilters.name}
                      onChange={(e) => setFacultyFilters((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
                    value={facultyFilters.department}
                    onChange={(e) => setFacultyFilters((f) => ({ ...f, department: e.target.value }))}
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.code}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </Card>

              {/* Total items badge */}
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                {facultyFilters.department ? `Staff in ${facultyFilters.department}: ` : "Total Matching Staff: "}
                <span className="text-cyan-600">{filteredFaculty.length} records</span>
              </div>

              <Table
                columns={[
                  { key: "roll", title: "Roll No", render: (r) => <span className="font-bold text-slate-700">{r.roll}</span> },
                  { key: "name", title: "Name" },
                  { key: "email", title: "Email" },
                  { key: "department", title: "Department", render: (r) => <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">{r.department}</span> },
                ]}
                rows={filteredFaculty}
                actions={(r) => (
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setEditingFaculty(r);
                        setFacultyModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border hover:bg-slate-50 text-slate-500 hover:text-cyan-600 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => resetFacultyPassword(r.id)}
                      className="p-1.5 rounded-lg border hover:bg-slate-50 text-slate-500 hover:text-cyan-600 transition-colors"
                      title="Reset Security Password"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteFaculty(r.id)}
                      className="p-1.5 rounded-lg border hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete Staff User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              />
            </div>
          )}

          {/* Students View */}
          {view === "students" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Student Profiles Registry</h2>
                  <p className="text-xs text-slate-400 mt-1">Upload cohorts using spreadsheets or add candidates manually.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setAddStudentModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5">
                    <Plus className="h-4 w-4" /> Add Student
                  </Button>
                  <label htmlFor="studentsCSV" className="cursor-pointer">
                    <Button asChild className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold cursor-pointer flex items-center gap-1.5">
                      <span><Upload className="h-4 w-4" /> Import CSV</span>
                    </Button>
                  </label>
                  <a href="/files/users.csv" download>
                    <Button variant="outline" className="border border-slate-250 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5">
                      <Download className="h-4 w-4" /> Template
                    </Button>
                  </a>
                </div>
              </div>

              {/* Filtering Container */}
              <Card className="border-slate-100 shadow-sm p-5 rounded-2xl bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Roll No..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                      value={studentFilters.roll}
                      onChange={(e) => setStudentFilters((f) => ({ ...f, roll: e.target.value }))}
                    />
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Name..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                      value={studentFilters.name}
                      onChange={(e) => setStudentFilters((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
                    value={studentFilters.department}
                    onChange={(e) => setStudentFilters((f) => ({ ...f, department: e.target.value }))}
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.code}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Filter Year (1-4)..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                    value={studentFilters.year}
                    onChange={(e) => setStudentFilters((f) => ({ ...f, year: e.target.value }))}
                  />
                </div>
              </Card>

              {/* CSV Upload Element */}
              <input
                id="studentsCSV"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleStudentCSVUpload(e.target.files[0])}
              />

              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Matching Student Registry: <span className="text-cyan-600">{filteredStudents.length} entries</span>
              </div>

              <Table
                columns={[
                  { key: "roll", title: "Roll No", render: (r) => <span className="font-bold text-slate-700">{r.roll}</span> },
                  { key: "name", title: "Name" },
                  { key: "email", title: "Email" },
                  { key: "department", title: "Department", render: (r) => <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">{r.department}</span> },
                  { key: "year", title: "Year", render: (r) => <span className="font-medium text-slate-600">Year {r.year}</span> },
                ]}
                rows={filteredStudents}
                actions={(r) => (
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => openStudentEditModal(r)}
                      className="p-1.5 rounded-lg border hover:bg-slate-50 text-slate-500 hover:text-cyan-600 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => resetStudentPassword(r.id)}
                      className="p-1.5 rounded-lg border hover:bg-slate-50 text-slate-500 hover:text-cyan-600 transition-colors"
                      title="Reset Security Password"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeStudent(r.id)}
                      className="p-1.5 rounded-lg border hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Remove Student"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              />
            </div>
          )}

          {/* Topics & Questions View */}
          {view === "questions" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Syllabus Topics & Questions</h2>
                  <p className="text-xs text-slate-400 mt-1">Review active syllabus modules, subtopics, and underlying questions.</p>
                </div>
              </div>

              <Card className="border-slate-100 shadow-sm p-5 rounded-2xl bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                    placeholder="Search topics by title or description details..."
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                  />
                </div>
              </Card>

              {/* Topics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topics
                  .filter(
                    (t) =>
                      (t.title || '').toLowerCase().includes(topicFilter.toLowerCase()) ||
                      (t.description || '').toLowerCase().includes(topicFilter.toLowerCase())
                  )
                  .map((topic) => (
                    <div
                      key={topic.topic_id}
                      onClick={() => {
                        setActiveTopic(topic);
                        setFilteredSubTopics(subTopics.filter((st) => st.topic_id === topic.topic_id));
                        setSubTopicModalOpen(true);
                      }}
                      className="p-6 bg-white border border-slate-150 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Topic Module
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-purple-700 transition-colors">
                          {topic.title}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                          {topic.description}
                        </p>
                      </div>
                      <div className="border-t border-slate-100 pt-4 mt-4 space-y-1 text-[11px] text-slate-400">
                        <div>Added by: {topic.user_name || "System"}</div>
                        <div>Created: {new Date(topic.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                {topics.filter(
                  (t) =>
                    (t.title || '').toLowerCase().includes(topicFilter.toLowerCase()) ||
                    (t.description || '').toLowerCase().includes(topicFilter.toLowerCase())
                ).length === 0 && (
                  <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl col-span-full">
                    No topics match the search filter criteria.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tests Management View */}
          {view === "tests" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Tests Scheduler & Monitoring</h2>
                  <p className="text-xs text-slate-400 mt-1">Configure parameters, schedule active session launches, and review rosters.</p>
                </div>
                <Button onClick={openTestWizard} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-2 self-start sm:self-auto">
                  <Plus className="h-4 w-4" /> Create Test
                </Button>
              </div>

              {/* Segmented Category Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "All Tests" },
                  { id: "live", label: "Currently Live" },
                  { id: "upcoming", label: "Upcoming" },
                  { id: "completed", label: "Completed" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTestTab(tab.id as any)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                      testTab === tab.id
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/10"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tests Filter Panel (solving missingFiltered tests logic) */}
              <Card className="border-slate-100 shadow-sm p-5 rounded-2xl bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter by Test Title..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
                      value={testFilters.title}
                      onChange={(e) => setTestFilters((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
                    value={testFilters.department}
                    onChange={(e) => setTestFilters((f) => ({ ...f, department: e.target.value }))}
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <div>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white text-slate-600"
                      value={testFilters.date}
                      onChange={(e) => setTestFilters((f) => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                </div>
              </Card>

              {/* Table rendering using filteredTestsList */}
              <Table
                columns={[
                  { key: "title", title: "Test Title", render: (r) => <span className="font-semibold text-slate-800">{r.title}</span> },
                  { key: "department", title: "Assigned Department", render: (r) => <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">{r.department}</span> },
                  { key: "scheduledFor", title: "Scheduled Date & Time", render: (r) => r.scheduledFor ? new Date(r.scheduledFor).toLocaleString() : "Not Scheduled" },
                  { key: "duration", title: "Duration", render: (r) => <span>{r.duration} minutes</span> },
                  {
                    key: "status",
                    title: "Status",
                    render: (r) => {
                      const isUpcoming = !r.active && r.scheduledFor && new Date(r.scheduledFor) > new Date();
                      const isCompleted = !r.active && (!r.scheduledFor || new Date(r.scheduledFor) <= new Date());
                      let statusText = "Active Now";
                      let statusClass = "bg-cyan-50 text-cyan-600";
                      if (isUpcoming) {
                        statusText = "Upcoming";
                        statusClass = "bg-purple-50 text-purple-700";
                      } else if (isCompleted) {
                        statusText = "Completed";
                        statusClass = "bg-slate-100 text-slate-500";
                      }
                      return (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusClass}`}>
                          {statusText}
                        </span>
                      );
                    },
                  },
                ]}
                rows={filteredTestsList}
                actions={(r) => (
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => toggleTestActive(r.id)} className="text-xs">
                      {r.active ? "Stop" : "Start"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteTest(r.id)} className="text-xs bg-red-50 border-red-100 text-red-600 hover:bg-red-100">
                      Remove
                    </Button>
                  </div>
                )}
              />
            </div>
          )}

          {/* Reports & Analytics View */}
          {view === "reports" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Analytical Reports Dashboard</h2>
                  <p className="text-xs text-slate-400 mt-1">Review campus benchmarks, download PDF test reports, and evaluate stats.</p>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                {(["overview", "testpdf"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setReportSubView(tab);
                      if (tab === "testpdf" && reportTests.length === 0) fetchReportTests();
                    }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      reportSubView === tab
                        ? "bg-white shadow text-purple-700"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab === "overview" ? "Overview" : "Test-Wise PDF"}
                  </button>
                ))}
              </div>

              {/* OVERVIEW TAB */}
              {reportSubView === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard title="Average Performance (30d)" value="72%" icon={<CheckCircle2 className="h-5 w-5 text-purple-600" />} color="purple" />
                    <MetricCard title="Roster Pass Rate" value="88%" icon={<Users className="h-5 w-5 text-cyan-500" />} color="cyan" />
                    <MetricCard title="Top Candidate Avg" value="94%" icon={<GraduationCap className="h-5 w-5 text-purple-600" />} color="purple" />
                    <MetricCard title="Total Tests" value={tests.length} icon={<BarChart3 className="h-5 w-5 text-cyan-500" />} color="cyan" />
                  </div>
                  <Card className="border-slate-100 shadow-sm p-6 rounded-2xl bg-white">
                    <h4 className="font-bold text-slate-800 text-sm mb-3">Export Student CSV Report</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        className="border border-slate-200 px-3 py-2 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all w-full sm:w-64"
                        onChange={(e) => setReportFilter((p) => ({ ...p, department: e.target.value }))}
                      >
                        <option value="">All Departments</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.code}>{d.name}</option>
                        ))}
                      </select>
                      <Button onClick={generateReportCSV} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5">
                        <Download className="h-4 w-4" /> Export CSV
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* TEST-WISE PDF TAB */}
              {reportSubView === "testpdf" && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Test List */}
                  <div className="lg:col-span-1">
                    <Card className="border-slate-100 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold text-slate-700">Select Test</CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-4 space-y-3">
                        {/* Search and Date filter inputs */}
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Search title/faculty..."
                            value={reportFilterSearch}
                            onChange={(e) => setReportFilterSearch(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                          />
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="date"
                              value={reportFilterDate}
                              onChange={(e) => setReportFilterDate(e.target.value)}
                              className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 text-slate-600"
                            />
                            {reportFilterDate && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReportFilterDate("")}
                                className="px-2 py-1 h-auto text-xs shrink-0 text-slate-500 hover:text-slate-700"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </div>

                        {reportTestsLoading ? (
                          <div className="text-center text-slate-400 text-xs py-4">Loading tests...</div>
                        ) : filteredReportTests.length === 0 ? (
                          <div className="text-center text-slate-400 text-xs py-4">No matching tests found</div>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {filteredReportTests.map((t: any) => (
                              <div
                                key={t.id}
                                onClick={async () => {
                                  setReportSelectedTest(t);
                                  setReportTestAnalysis(null);
                                  await fetchReportTestAnalysis(t.id);
                                }}
                                className={`p-3 border rounded-xl cursor-pointer transition-colors ${
                                  reportSelectedTest?.id === t.id
                                    ? "bg-purple-50 border-purple-300"
                                    : "hover:bg-slate-50 border-slate-100"
                                }`}
                              >
                                <div className="font-semibold text-slate-800 text-xs leading-tight">{t.title}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{t.date ? new Date(t.date).toLocaleDateString() : "—"}</div>
                                {t.facultyName && <div className="text-xs text-purple-500 mt-0.5">{t.facultyName}</div>}
                                <div className="text-xs text-slate-400">{t.students} students</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Test Analysis */}
                  <div className="lg:col-span-3">
                    {reportAnalysisLoading || reportPdfLoading ? (
                      <Card className="border-slate-100 shadow-sm">
                        <CardContent className="flex items-center justify-center h-[650px]">
                          <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                            <div className="text-slate-400 text-sm font-semibold">Generating Live PDF Preview...</div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : reportSelectedTest && reportPdfUrl ? (
                      <div className="space-y-4">
                        {/* Header + Download Button */}
                        <Card className="border-slate-100 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <div className="font-bold text-slate-800 text-sm">{reportSelectedTest.title}</div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  Faculty: {reportTestAnalysis?.testInfo?.facultyName || "—"} · Date: {reportSelectedTest.date ? new Date(reportSelectedTest.date).toLocaleDateString() : "—"} · Questions: {reportTestAnalysis?.testInfo?.totalQuestions || "—"}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  Attended: {reportTestAnalysis?.presentStudents?.length || 0} · Absent: {reportTestAnalysis?.absentStudents?.length || 0}
                                </div>
                              </div>
                              <Button
                                onClick={() => exportSuperAdminTestReportPDF(reportSelectedTest, reportTestAnalysis)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-2 shrink-0"
                              >
                                <Download className="h-4 w-4" /> Download PDF Report
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Interactive PDF IFrame Preview */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner bg-slate-50 p-2">
                          <iframe src={reportPdfUrl} className="w-full h-[650px] rounded-lg border-0 bg-white" title="PDF Preview" />
                        </div>
                      </div>
                    ) : (
                      <Card className="border-slate-100 shadow-sm">
                        <CardContent className="flex items-center justify-center h-64">
                          <div className="text-center text-slate-400">
                            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Select a test from the list to view analysis and preview the PDF report.</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {view === "placement" && (
            <div className="animate-in fade-in duration-300">
              <PlacementAdminUI />
            </div>
          )}
        </main>
      </div>

      {/* -------------------- OVERLAY MODALS -------------------- */}

      {/* Super Admin own reset password */}
      <Modal open={adminPwdModalOpen} title="Reset Super Admin Password" onClose={() => setAdminPwdModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Password Key</label>
            <input
              type="password"
              value={adminPwdValue}
              onChange={(e) => setAdminPwdValue(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
              placeholder="Enter new credential key..."
              disabled={adminPwdLoading}
            />
          </div>
          <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
            <Button onClick={handleSuperAdminResetPassword} disabled={adminPwdLoading} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              Save Password
            </Button>
            <Button variant="outline" onClick={() => setAdminPwdModalOpen(false)} disabled={adminPwdLoading}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit Department Modal */}
      <Modal open={deptModalOpen} title={editingDept?.id ? "Edit Department" : "Add Department"} onClose={() => setDeptModalOpen(false)}>
        <DeptForm initial={editingDept} onCancel={() => setDeptModalOpen(false)} onSave={(data) => saveDepartment(data)} faculties={faculty} loading={deptLoading} />
      </Modal>

      {/* Add / Edit Faculty Modal */}
      <Modal open={facultyModalOpen} title={editingFaculty?.id ? "Edit Faculty Profile" : "Add Faculty"} onClose={() => setFacultyModalOpen(false)}>
        <FacultyForm initial={editingFaculty} onCancel={() => setFacultyModalOpen(false)} onSave={(data) => saveFaculty(data)} departments={departments} />
      </Modal>

      {/* Add Staff Modal */}
      <Modal open={addStaffModalOpen} title="Create Staff Account" onClose={() => setAddStaffModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Roll No / Identity ID</label>
            <input
              value={newStaff.roll_no}
              onChange={(e) => setNewStaff((s) => ({ ...s, roll_no: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
              placeholder="Enter Staff ID..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              value={newStaff.name}
              onChange={(e) => setNewStaff((s) => ({ ...s, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
              placeholder="Enter full name..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              value={newStaff.email}
              onChange={(e) => setNewStaff((s) => ({ ...s, email: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
              placeholder="name@nscet.edu"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assigned Department</label>
            <select
              value={newStaff.department_id}
              onChange={(e) => setNewStaff((s) => ({ ...s, department_id: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
            >
              <option value="">-- select department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
            <Button onClick={handleAddStaff} disabled={addStaffLoading} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              Create Staff Account
            </Button>
            <Button variant="outline" onClick={() => setAddStaffModalOpen(false)} disabled={addStaffLoading}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Student Modal */}
      <Modal open={addStudentModalOpen} title="Create Student Profile" onClose={() => setAddStudentModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Roll No / Identity ID</label>
            <input
              value={newStudent.roll_no}
              onChange={(e) => setNewStudent((s) => ({ ...s, roll_no: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
              placeholder="e.g. CSE1020"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              value={newStudent.name}
              onChange={(e) => setNewStudent((s) => ({ ...s, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
              placeholder="Enter full name..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              value={newStudent.email}
              onChange={(e) => setNewStudent((s) => ({ ...s, email: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
              placeholder="studentname@nscet.edu"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
              <select
                value={newStudent.department_id}
                onChange={(e) => setNewStudent((s) => ({ ...s, department_id: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
              >
                <option value="">-- select department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Year of Study</label>
              <input
                type="number"
                value={newStudent.year}
                onChange={(e) => setNewStudent((s) => ({ ...s, year: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
                placeholder="1, 2, 3, or 4..."
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
            <Button onClick={handleAddStudent} disabled={addStudentLoading} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              Create Student Profile
            </Button>
            <Button variant="outline" onClick={() => setAddStudentModalOpen(false)} disabled={addStudentLoading}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Student Modal */}
      {view === "students" && (
        <Modal open={studentEditModalOpen} title={editingStudent?.id ? "Edit Student Profile" : "Student Info Details"} onClose={() => setStudentEditModalOpen(false)}>
          {editingStudent && (
            <StudentEditForm
              initial={editingStudent}
              departments={departments}
              onCancel={() => setStudentEditModalOpen(false)}
              onSave={async (data: any) => {
                const payload = {
                  roll_no: data.roll,
                  name: data.name,
                  email: data.email,
                  department_id: departments.find((d) => d.code === data.department)?.id || data.department,
                  year: data.year,
                };
                const res = await fetch(`${API_BASE}/users/update/${editingStudent.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                if (res.ok) {
                  setStudents((ss) => ss.map((s) => (s.id === editingStudent.id ? { ...s, ...data } : s)));
                  setStudentEditModalOpen(false);
                } else {
                  alert("Failed to update student info");
                }
              }}
            />
          )}
        </Modal>
      )}

      {/* Student CSV Bulk Import Modal */}
      <Modal open={studentsModalOpen} title="Import Cohort CSV Spreadsheet" onClose={() => setStudentsModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select CSV Spreadsheet File</label>
            <input
              type="file"
              accept=".csv"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setCsvPreview([]);
                  setCsvEditRows([]);
                  setCsvHeaders([]);
                  setCsvFile(e.target.files[0]);
                }
              }}
            />
            <Button
              className="mt-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700"
              onClick={() => {
                if (csvFile) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const text = e.target?.result as string;
                    const parsed = parseCSV(text);
                    setCsvPreview(parsed);
                    setCsvEditRows(parsed.map((row) => ({ ...row })));
                    setCsvHeaders(parsed.length ? Object.keys(parsed[0]) : []);
                  };
                  reader.readAsText(csvFile);
                } else {
                  alert("Please upload a CSV file first.");
                }
              }}
            >
              Preview Spreadsheet Rows
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Override Department</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={csvDept}
                onChange={(e) => setCsvDept(e.target.value)}
              >
                <option value="">-- select department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Override Year</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={csvYear}
                onChange={(e) => setCsvYear(e.target.value)}
              >
                <option value="">-- select year --</option>
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={String(y)}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Target Portal Role</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={csvRole}
                onChange={(e) => setCsvRole(e.target.value)}
              >
                <option value="1">Student candidate</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Roster Preview</label>
            <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-48">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-slate-500 font-semibold">Roll No</th>
                    <th className="px-3 py-2 text-slate-500 font-semibold">Name</th>
                    <th className="px-3 py-2 text-slate-500 font-semibold">Email</th>
                    <th className="px-3 py-2 text-slate-500 font-semibold">Dept</th>
                    <th className="px-3 py-2 text-slate-500 font-semibold">Year</th>
                    <th className="px-3 py-2 text-slate-500 font-semibold text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {csvEditRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3 py-1.5">
                        <input
                          className="border border-slate-200 px-2 py-0.5 rounded text-xs focus:ring-1 focus:ring-cyan-500"
                          value={row.roll_no || row.roll_number || row.Roll || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCsvEditRows((rows) => rows.map((r, i) => (i === idx ? { ...r, roll: val } : r)));
                          }}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          className="border border-slate-200 px-2 py-0.5 rounded text-xs focus:ring-1 focus:ring-cyan-500"
                          value={row.name || row.fullname || row.Name || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCsvEditRows((rows) => rows.map((r, i) => (i === idx ? { ...r, name: val } : r)));
                          }}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          className="border border-slate-200 px-2 py-0.5 rounded text-xs focus:ring-1 focus:ring-cyan-500"
                          value={row.email || row.Email || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCsvEditRows((rows) => rows.map((r, i) => (i === idx ? { ...r, email: val } : r)));
                          }}
                        />
                      </td>
                      <td className="px-3 py-1.5 font-semibold text-slate-600">{csvDept || row.department || "-"}</td>
                      <td className="px-3 py-1.5 text-slate-500">Year {csvYear || row.year || "-"}</td>
                      <td className="px-3 py-1.5 text-right">
                        <button
                          onClick={() => setCsvEditRows((rows) => rows.filter((_, i) => i !== idx))}
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!csvEditRows.length && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No cohort rows parsed. Select a CSV file and press "Preview Spreadsheet Rows".
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
            <Button onClick={commitCsvStudents} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              Commit Students List
            </Button>
            <Button variant="outline" onClick={() => setStudentsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Subtopics Listing Modal */}
      <Modal open={subTopicModalOpen} title={activeTopic ? `Subtopics of ${activeTopic.title}` : "Subtopics"} onClose={() => setSubTopicModalOpen(false)}>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
              placeholder="Search subtopics..."
              value={subTopicFilter}
              onChange={(e) => setSubTopicFilter(e.target.value)}
            />
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {filteredSubTopics
              .filter(
                (sub) =>
                  (sub.title || '').toLowerCase().includes(subTopicFilter.toLowerCase()) ||
                  (sub.description || '').toLowerCase().includes(subTopicFilter.toLowerCase())
              )
              .map((sub) => (
                <div
                  key={sub.sub_topic_id}
                  onClick={() => {
                    const subWithQ = subTopicsWithQuestions.find((st) => st.sub_topic_id === sub.sub_topic_id);
                    setActiveSubTopicQuestions(subWithQ?.questions || []);
                    setActiveSubTopicTitle(sub.title);
                    setQuestionModalOpen(true);
                  }}
                  className="p-4 border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50/20 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm group-hover:text-cyan-600 transition-colors">
                      {sub.title}
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">{sub.description}</p>
                    <div className="flex gap-4 mt-2 text-[10px] text-slate-400">
                      <span>Added by: {sub.user_name || "System"}</span>
                      <span>Created: {new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            {filteredSubTopics.filter(
              (sub) =>
                (sub.title || '').toLowerCase().includes(subTopicFilter.toLowerCase()) ||
                (sub.description || '').toLowerCase().includes(subTopicFilter.toLowerCase())
            ).length === 0 && (
              <div className="text-center p-8 text-slate-400 text-xs">
                No subtopics discovered matching filter parameters.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Subtopic Questions Modal */}
      <Modal open={questionModalOpen} title={`Questions Bank: ${activeSubTopicTitle}`} onClose={() => setQuestionModalOpen(false)}>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {activeSubTopicQuestions.map((q) => (
            <div key={q.question_id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-2">
              <div className="font-bold text-slate-800 text-sm leading-relaxed">{q.text}</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="bg-white border border-slate-100 p-2 rounded-lg">A: {q.a}</div>
                <div className="bg-white border border-slate-100 p-2 rounded-lg">B: {q.b}</div>
                <div className="bg-white border border-slate-100 p-2 rounded-lg">C: {q.c}</div>
                <div className="bg-white border border-slate-100 p-2 rounded-lg">D: {q.d}</div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-2">
                <span className="text-xs text-cyan-600 font-bold bg-cyan-50 px-2 py-0.5 rounded">
                  Correct Option: {q.correct}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingQuestion(q)}
                  className="text-xs hover:bg-slate-100"
                >
                  Edit Question
                </Button>
              </div>
            </div>
          ))}
          {!activeSubTopicQuestions.length && (
            <div className="text-center p-8 text-slate-400 text-xs">
              No questions found for this subtopic category.
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Question Modal */}
      <Modal open={!!editingQuestion} title="Edit Question Bank Record" onClose={() => setEditingQuestion(null)}>
        {editingQuestion && (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch(`${API_BASE}/question/sub-topics-with-questions/${editingQuestion.question_id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(editingQuestion),
                });
                const result = await res.json();
                if (result.success) {
                  setActiveSubTopicQuestions((prevQuestions) =>
                    prevQuestions.map((q) =>
                      q.question_id === editingQuestion.question_id ? { ...q, ...editingQuestion } : q
                    )
                  );
                  setSubTopicsWithQuestions((prevSubTopics) =>
                    prevSubTopics.map((st) => ({
                      ...st,
                      questions: st.questions.map((q) =>
                        q.question_id === editingQuestion.question_id ? { ...q, ...editingQuestion } : q
                      ),
                    }))
                  );
                  alert("Question updated successfully.");
                } else {
                  alert(result.error || "Failed to update question.");
                }
              } catch (err: any) {
                alert("Error updating question: " + err.message);
              }
              setEditingQuestion(null);
            }}
          >
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Question Text</label>
              <textarea
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all bg-white"
                rows={3}
                value={editingQuestion.text}
                onChange={(e) => setEditingQuestion((q: any) => ({ ...q, text: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Option A</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={editingQuestion.a}
                  onChange={(e) => setEditingQuestion((q: any) => ({ ...q, a: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Option B</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={editingQuestion.b}
                  onChange={(e) => setEditingQuestion((q: any) => ({ ...q, b: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Option C</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={editingQuestion.c}
                  onChange={(e) => setEditingQuestion((q: any) => ({ ...q, c: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Option D</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  value={editingQuestion.d}
                  onChange={(e) => setEditingQuestion((q: any) => ({ ...q, d: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Correct Answer</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                value={editingQuestion.correct}
                onChange={(e) => setEditingQuestion((q: any) => ({ ...q, correct: e.target.value }))}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditingQuestion(null)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Test modal */}
      <Modal open={testWizardOpen} title="Create New Test" onClose={() => setTestWizardOpen(false)}>
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          <div className="bg-purple-50 text-purple-700 border border-purple-100 p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Choose the faculty member and enter the test details. Selecting a faculty member dynamically loads their specific topic and sub-topic options.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Faculty selection */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Faculty Member *</label>
              <select
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={testDraft.facultyId}
                onChange={async (e) => {
                  const fac = faculty.find((f: any) => f.id.toString() === e.target.value);
                  setTestDraft((t: any) => ({ ...t, facultyId: e.target.value, facultyName: fac?.name || "", topicId: "", subTopicId: "", numQuestions: "" }));
                  setWizardSubTopics([]);
                  setWizardQuestionCount(0);
                  await fetchFacultyTopics(e.target.value);
                }}
              >
                <option value="">— Select Faculty —</option>
                {faculty.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.department || "—"})</option>
                ))}
              </select>
            </div>

            {/* Topic selection */}
            {testDraft.facultyId && (
              <div className="sm:col-span-2 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Topic *</label>
                <select
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                  value={testDraft.topicId}
                  onChange={(e) => {
                    const topic = wizardFacultyTopics.find((t: any) => t.id.toString() === e.target.value);
                    setWizardSubTopics(topic?.subtopics || []);
                    setWizardQuestionCount(0);
                    setTestDraft((t: any) => ({ ...t, topicId: e.target.value, subTopicId: "", numQuestions: "" }));
                  }}
                >
                  <option value="">— Select Topic —</option>
                  {wizardFacultyTopics.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Subtopic selection */}
            {testDraft.topicId && (
              <div className="sm:col-span-2 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Sub-Topic *</label>
                <select
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                  value={testDraft.subTopicId}
                  onChange={(e) => {
                    const sub = wizardSubTopics.find((s: any) => s.id.toString() === e.target.value);
                    setWizardQuestionCount(sub?.question_count || 0);
                    setTestDraft((t: any) => ({ ...t, subTopicId: e.target.value, numQuestions: "" }));
                  }}
                >
                  <option value="">— Select Sub-Topic —</option>
                  {wizardSubTopics.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.title} ({s.question_count} questions)</option>
                  ))}
                </select>
              </div>
            )}

            {/* Question count input */}
            {testDraft.subTopicId && (
              <div className="sm:col-span-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-3 text-xs text-cyan-700 font-semibold">
                  📋 {wizardQuestionCount} questions available in this sub-topic
                </div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Number of Questions *</label>
                <input
                  type="number"
                  min="1"
                  max={wizardQuestionCount}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                  placeholder={`Max ${wizardQuestionCount} questions`}
                  value={testDraft.numQuestions}
                  onChange={(e) => setTestDraft((t: any) => ({ ...t, numQuestions: e.target.value }))}
                />
              </div>
            )}

            {/* Test parameters */}
            <div className="sm:col-span-2 border-t border-slate-100 pt-3 mt-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Test Title *</label>
              <input
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="e.g. Term final final exam"
                value={testDraft.title}
                onChange={(e) => setTestDraft((t: any) => ({ ...t, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject *</label>
              <input
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="e.g. Core Java Programming"
                value={testDraft.subject}
                onChange={(e) => setTestDraft((t: any) => ({ ...t, subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Department *</label>
              <select
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={testDraft.department}
                onChange={(e) => setTestDraft((t: any) => ({ ...t, department: e.target.value }))}
              >
                <option value="">Select department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Scheduled Date & Time *</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={testDraft.scheduledFor}
                onChange={(e) => setTestDraft((t: any) => ({ ...t, scheduledFor: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Duration (Minutes) *</label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={testDraft.duration}
                onChange={(e) => setTestDraft((t: any) => ({ ...t, duration: parseInt(e.target.value || "0", 10) }))}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-3">
            <Button
              onClick={publishTest}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5"
            >
              🚀 Publish & Schedule Test
            </Button>
            <Button variant="outline" onClick={() => setTestWizardOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Sidebar Link Item Subcomponent ---------- */
function SidebarLink({
  children,
  active,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 py-3 px-4 rounded-xl text-left text-sm transition-all duration-200 font-semibold ${
        active
          ? "bg-purple-600 text-white shadow-md shadow-purple-600/10 scale-[1.01]"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <div className={`${active ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`}>
        {icon}
      </div>
      {children}
    </button>
  );
}

/* ---------- Metric Card Component ---------- */
function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "purple" | "cyan";
}) {
  return (
    <Card className="border-slate-100 shadow-sm rounded-2xl bg-white hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</div>
          <div className="text-2xl font-black text-slate-800">{value}</div>
        </div>
        <div className={`p-3.5 rounded-2xl ${color === "purple" ? "bg-purple-50" : "bg-cyan-50"}`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Department CRUD Form Subcomponent ---------- */
function DeptForm({
  initial,
  onSave,
  onCancel,
  faculties,
  loading = false,
}: {
  initial: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  faculties: any[];
  loading?: boolean;
}) {
  const [data, setData] = useState(initial || { code: "", name: "", hodId: null });
  useEffect(() => setData(initial || { code: "", name: "", hodId: null }), [initial]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department Code</label>
        <input
          value={data.code}
          onChange={(e) => setData((d: any) => ({ ...d, code: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          placeholder="e.g. CSE"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department Name</label>
        <input
          value={data.name}
          onChange={(e) => setData((d: any) => ({ ...d, name: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          placeholder="e.g. Computer Science"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assign Head of Department (HOD)</label>
        <select
          value={data.hodId || ""}
          onChange={(e) => setData((d: any) => ({ ...d, hodId: e.target.value || null }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
        >
          <option value="">-- unassigned --</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.department || "Independent"})
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
        <Button disabled={loading} onClick={() => onSave(data)} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
          {loading ? "Saving..." : "Save Department"}
        </Button>
        <Button disabled={loading} variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ---------- Faculty Form Subcomponent ---------- */
function FacultyForm({
  initial,
  onSave,
  onCancel,
  departments,
}: {
  initial: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  departments: any[];
}) {
  const [data, setData] = useState(initial || { roll: "", name: "", email: "", department: "" });
  useEffect(() => setData(initial || { roll: "", name: "", email: "", department: "" }), [initial]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Roll / Identity Number</label>
        <input
          value={data.roll || ""}
          onChange={(e) => setData((d: any) => ({ ...d, roll: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          placeholder="e.g. ST1029"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Faculty Name</label>
        <input
          value={data.name || ""}
          onChange={(e) => setData((d: any) => ({ ...d, name: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          placeholder="Enter name..."
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
        <input
          value={data.email || ""}
          onChange={(e) => setData((d: any) => ({ ...d, email: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          placeholder="email@nscet.edu"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department Assignment</label>
        <select
          value={data.department || ""}
          onChange={(e) => setData((d: any) => ({ ...d, department: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
        >
          <option value="">-- select department --</option>
          {departments.map((d) => (
            <option key={d.id} value={d.code}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
        <Button onClick={() => onSave(data)} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold">
          Save Faculty
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ---------- Student Edit Form Subcomponent ---------- */
function StudentEditForm({
  initial,
  onSave,
  onCancel,
  departments,
}: {
  initial: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  departments: any[];
}) {
  const [data, setData] = useState(initial || { roll: "", name: "", email: "", department: "", year: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => setData(initial || { roll: "", name: "", email: "", department: "", year: "" }), [initial]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Roll No</label>
        <input
          value={data.roll}
          onChange={(e) => setData((d: any) => ({ ...d, roll: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
        <input
          value={data.name}
          onChange={(e) => setData((d: any) => ({ ...d, name: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
        <input
          value={data.email}
          onChange={(e) => setData((d: any) => ({ ...d, email: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
          <select
            value={data.department}
            onChange={(e) => setData((d: any) => ({ ...d, department: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          >
            <option value="">-- select department --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Year of Study</label>
          <input
            type="number"
            value={data.year}
            onChange={(e) => setData((d: any) => ({ ...d, year: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-xs font-semibold ${message.startsWith("Success") ? "bg-cyan-50 text-cyan-600" : "bg-red-50 text-red-600"}`}>
          {message}
        </div>
      )}

      <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
        <Button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setMessage("");
            try {
              await onSave(data);
              setMessage("Success: Student details updated successfully.");
            } catch (err: any) {
              setMessage("Error: " + (err?.message || "Failed to update details."));
            }
            setLoading(false);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
        >
          Save Changes
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
