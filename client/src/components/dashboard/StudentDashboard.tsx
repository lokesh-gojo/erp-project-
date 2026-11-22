import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "./stats-card";
import { BookOpen, Clock, Trophy, User, Play, Pause, CheckCircle, Users, BarChart3, Eye, Edit, FileText, Target, Calendar, Briefcase, Activity, Sparkles, Bot, ArrowRight, Layers, FileCheck, Brain } from "lucide-react";
import Header from "./student/Header";
import PlacementModeUI from "./PlacementModeUI";
import RAGStudyHubUI from "./RAGStudyHubUI";
import ResumeATSScannerUI from "./ResumeATSScannerUI";
import MockInterviewUI from "./MockInterviewUI";
import { IEEECognitiveHubUI } from "./IEEECognitiveHubUI";
import SidebarLayout from "../layout/SidebarLayout";
import { StudentReportsSection } from "./student/StudentReportsSection";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Leaderboard } from "../leaderboard/leaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// StudentTest interface matching API response
interface StudentTest {
  test_id: number;
  title: string;
  description: string;
  subject: string;
  num_questions: number;
  duration_minutes: number;
  status: string;
  is_active: number;
  created_at?: string;
  faculty_name?: string;
  department_name?: string;
  dept_short_name?: string;
  year?: string;
  date?: string;
  time_slot?: string;
  topic_title?: string;
  sub_topic_title?: string;
  score?: number;
}

// Dynamic stats will be calculated from tests array

const getStatusBadge = (status: string) => {
  const variants = {
    available: "default",
    "in-progress": "secondary",
    "started": "secondary",
    completed: "outline"
  } as const;

  const colors = {
    available: "bg-primary text-primary-foreground",
    "in-progress": "bg-warning text-warning-foreground",
    "started": "bg-warning text-warning-foreground",
    completed: "bg-success text-success-foreground"
  };

  return (
    <Badge variant={variants[status as keyof typeof variants] || "secondary"} className={colors[status as keyof typeof colors]}>
      {(status === "in-progress" || status === "started" || status === "in_progress") ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const getDifficultyLevel = (totalQuestions: number) => {
  if (totalQuestions <= 20) return 'Beginner';
  if (totalQuestions <= 35) return 'Medium';
  return 'Advanced';
};

const formatDuration = (timeLimit: number) => {
  if (timeLimit >= 60) {
    const hours = Math.floor(timeLimit / 60);
    const minutes = timeLimit % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${timeLimit}m`;
};

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <BarChart3 className="h-5 w-5" /> },
  { id: "quizzes", label: "My Quizzes", icon: <BookOpen className="h-5 w-5" /> },
  { id: "ieee-cognitive", label: "IEEE Cognitive Suite", icon: <Brain className="h-5 w-5 text-blue-600" /> },
  { id: "placement", label: "Placement Mode", icon: <Briefcase className="h-5 w-5 text-amber-600" /> },
  { id: "resume-scanner", label: "AI Resume & ATS", icon: <FileCheck className="h-5 w-5 text-indigo-600" /> },
  { id: "mock-interview", label: "AI Mock Interview", icon: <Bot className="h-5 w-5 text-teal-600" /> },
  { id: "rag-study", label: "AI Study & RAG Hub", icon: <Sparkles className="h-5 w-5 text-purple-600" /> },
  { id: "leaderboard", label: "Leaderboard", icon: <Trophy className="h-5 w-5" /> },
  { id: "reports", label: "Reports", icon: <FileText className="h-5 w-5" /> },
  { id: "profile", label: "Profile", icon: <User className="h-5 w-5" /> },
];

const studentTestsSection = ({ tests, navigate, isMissedView = false }: { tests: StudentTest[]; navigate: (path: string) => void; isMissedView?: boolean }) => (
  <div className="space-y-4">
    {tests.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No tests available in this section.</p>
      </div>
    ) : (
      tests.map((test, idx) => {
        const isCompleted = test.status === 'completed';
        return (
          <div key={test.test_id + '-' + idx} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b border-gray-100 last:border-0 rounded-2xl bg-white hover:bg-gray-50 transition-colors shadow-sm mb-4">
            <div className="flex-1 w-full md:w-auto">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-bold text-gray-900">{test.title}</h3>
                {isCompleted ? (
                  <Badge variant="outline" className="bg-success text-success-foreground">Completed</Badge>
                ) : isMissedView ? (
                  <Badge variant="destructive">Missed</Badge>
                ) : (
                  <Badge
                    variant={test.is_active === 1 ? 'default' : 'secondary'}
                    className={test.is_active === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                  >
                    {test.is_active === 1 ? 'Active' : 'Inactive'}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{test.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {test.num_questions} questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(test.duration_minutes)}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Difficulty: {getDifficultyLevel(test.num_questions)}
                </span>
                {test.faculty_name && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    By: {test.faculty_name}
                  </span>
                )}
                {test.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created: {new Date(test.created_at).toLocaleDateString()}
                  </span>
                )}
                {isCompleted && test.score !== undefined && test.score !== null && (
                  <span className="flex items-center gap-1 text-success font-medium">
                    <Trophy className="h-4 w-4" />
                    Score: {test.score}%
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 md:mt-0 w-full md:w-auto flex justify-end">
              {isCompleted ? (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground font-medium mb-1">Score</div>
                  <div className="text-2xl font-black text-gray-900">{test.score ?? 0}%</div>
                </div>
              ) : (
                <Button
                  onClick={() => navigate(`/quiz/${test.test_id}`)}
                  disabled={test.is_active === 0 || isMissedView}
                  className="w-full md:w-auto bg-[#FFD166] hover:bg-[#e6bb5b] text-black font-bold rounded-xl px-8"
                >
                  {isMissedView ? 'Missed' : 'Take Quiz'}
                </Button>
              )}
            </div>
          </div>
        );
      })
    )}
  </div>
);

const API_BASE = import.meta.env.VITE_API_BASE;

interface Profile {
  user_id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  year?: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Profile editing states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  type ProfileData = {
    name: string;
    email: string;
  };

  const [profileData, setProfileData] = useState({
    name: "",
    email: ""
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ [key: string]: string }>({});
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});

  // Tests state
  const [tests, setTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsError, setTestsError] = useState("");

  // Student stats from backend
  const [studentStats, setStudentStats] = useState({
    rank: "--",
    totalStudents: 0,
    averageScore: 0
  });

  // Categorize tests into available, completed, missed
  const categorizeTests = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const available: StudentTest[] = [];
    const completed: StudentTest[] = [];
    const missed: StudentTest[] = [];

    tests.forEach((test: StudentTest) => {
      const isCompleted = test.status === 'completed';
      if (isCompleted) {
        completed.push(test);
      } else {
        if (test.date) {
          const testDate = new Date(test.date);
          testDate.setHours(0, 0, 0, 0);
          if (testDate < now) {
            missed.push(test);
          } else {
            available.push(test);
          }
        } else {
          available.push(test);
        }
      }
    });

    return { available, completed, missed };
  };

  const categorizedTests = categorizeTests();

  // Calculate dynamic stats from tests
  const calculateStats = () => {
    const totalQuizzes = tests.length;
    const completedQuizzes = tests.filter((t: any) => t.status === 'completed').length;

    const completedTests = tests.filter((t: any) => t.status === 'completed' && t.score !== undefined && t.score !== null);
    const averageScore = completedTests.length > 0
      ? Math.round(completedTests.reduce((sum: number, t: any) => sum + t.score, 0) / completedTests.length)
      : 0;

    return {
      totalQuizzes,
      completedQuizzes,
      averageScore: averageScore || studentStats.averageScore,
      rank: studentStats.rank
    };
  };

  useEffect(() => {
    fetchProfile();
    fetchStudentTests();
    fetchStudentStats();
  }, []);

  // Fetch student profile
  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileError("");
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) throw new Error('No auth token found. Please login.');

      const res = await fetch(`${API_BASE}/users/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch profile");
      }

      const user = data.profile;
      console.log('Profile data received:', user); // Debug log
      setProfile({
        user_id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_id === 1 ? "Student" : user.role_id === 2 ? "Faculty" : "Admin",
        department: user.department_name || "Not Assigned",
        year: user.year ? `${user.year}${user.year === '1' ? 'st' : user.year === '2' ? 'nd' : user.year === '3' ? 'rd' : 'th'} Year` : ""
      });
      console.log('Profile state set successfully'); // Debug log
    } catch (error: any) {
      console.error('Profile fetch error:', error); // Debug log
      setProfileError(error.message || "Failed to fetch profile. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch tests for student based on their year and department
  const fetchStudentTests = async () => {
    setTestsLoading(true);
    setTestsError("");
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) throw new Error('No auth token found. Please login.');

      const res = await fetch(`${API_BASE}/test/student/available`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch tests");
      }

      console.log('Student tests received:', data.tests); // Debug log
      setTests(data.tests || []);
    } catch (error: any) {
      console.error('Tests fetch error:', error); // Debug log
      setTestsError(error.message || "Failed to fetch tests. Please try again.");
    } finally {
      setTestsLoading(false);
    }
  };

  // Fetch student specific stats (rank, avg score)
  const fetchStudentStats = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) return;

      const res = await fetch(`${API_BASE}/leaderboard/student-rank`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStudentStats({
          rank: data.rank.toString(),
          totalStudents: data.totalStudents,
          averageScore: data.averageScore
        });
      }
    } catch (error) {
      console.error('Failed to fetch student stats:', error);
    }
  };

  // Update profile
  const updateProfile = async (profileData: { name: string; email: string }) => {
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) throw new Error('No auth token found. Please login.');

      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(profileData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (passwordData: { currentPassword: string; newPassword: string }) => {
    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) throw new Error('No auth token found. Please login.');

      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reset password");
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  // Profile handlers
  const handleEditProfile = () => {
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || ""
      });
      setProfileErrors({});
      setShowEditProfileModal(true);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: { [key: string]: string } = {};
    if (!profileData.name.trim()) newErrors.name = "Name is required";
    if (!profileData.email.trim()) newErrors.email = "Email is required";
    if (profileData.email && !/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setProfileErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setProfileSubmitting(true);
    try {
      await updateProfile(profileData);
      alert('Profile updated successfully!');
      setShowEditProfileModal(false);
      fetchProfile(); // Refresh profile data
    } catch (error: any) {
      alert(error.message || 'Failed to update profile');
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: { [key: string]: string } = {};
    if (!passwordData.currentPassword) newErrors.currentPassword = "Current password is required";
    if (!passwordData.newPassword) newErrors.newPassword = "New password is required";
    if (passwordData.newPassword && passwordData.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters long";
    }
    if (!passwordData.confirmPassword) newErrors.confirmPassword = "Please confirm your new password";
    if (passwordData.newPassword && passwordData.confirmPassword &&
      passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setPasswordSubmitting(true);
    try {
      await resetPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      alert('Password reset successfully!');
      setShowResetPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      alert(error.message || 'Failed to reset password');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // Simple mock quizzes section for demo purposes


  return (
    <SidebarLayout navItems={navItems} activeSection={activeSection} setActiveSection={setActiveSection}>
      {/* Header */}
      <Header />

      {role && role !== 'student' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs sm:text-sm text-amber-900 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>You are previewing the <strong>Student Dashboard</strong> as <strong>{role.toUpperCase()}</strong>.</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(role === 'faculty' ? '/faculty' : role === 'hod' ? '/hod' : role === 'super-admin' ? '/super-admin' : '/admin')}
            className="h-7 text-xs bg-white border-amber-300 hover:bg-amber-100 text-amber-900 font-medium"
          >
            Return to {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
          </Button>
        </div>
      )}


      <div className="w-full max-w-[1800px] mx-auto p-4 md:p-8 space-y-6">
        {/* Welcome Message */}
        <Card>
          <CardContent className="p-3 sticky top-0">
            <div className="flex items-center justify-between">
              <div className="items-center flex">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Welcome back, {profile?.name || "Student"}!</h2>
                  <p className="text-sm text-muted-foreground">
                    {profile?.department || "Department Not Assigned"} {profile?.year ? `| ${profile.year}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Content */}
        {activeSection === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Cards - Dynamic Themed */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-[#FFD166] border-none shadow-md hover:shadow-lg transition-shadow rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-black/60 mb-1 uppercase tracking-wider">Total Quizzes</p>
                      <h3 className="text-4xl font-extrabold text-black">{calculateStats().totalQuizzes}</h3>
                    </div>
                    <div className="p-3 bg-black rounded-2xl shadow-sm">
                      <BookOpen className="h-6 w-6 text-[#FFD166]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#cdb4db] border-none shadow-md hover:shadow-lg transition-shadow rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-black/60 mb-1 uppercase tracking-wider">Completed</p>
                      <h3 className="text-4xl font-extrabold text-black">{calculateStats().completedQuizzes}</h3>
                    </div>
                    <div className="p-3 bg-black rounded-2xl shadow-sm">
                      <CheckCircle className="h-6 w-6 text-[#cdb4db]" />
                    </div>
                  </div>
                  <p className="text-sm text-black/70 mt-4 font-semibold">
                    {calculateStats().completedQuizzes > 0 ? `${calculateStats().completedQuizzes} completed` : "No quizzes yet"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#a2d2ff] border-none shadow-md hover:shadow-lg transition-shadow rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-black/60 mb-1 uppercase tracking-wider">Average Score</p>
                      <h3 className="text-4xl font-extrabold text-black">{calculateStats().averageScore}%</h3>
                    </div>
                    <div className="p-3 bg-black rounded-2xl shadow-sm">
                      <Trophy className="h-6 w-6 text-[#a2d2ff]" />
                    </div>
                  </div>
                  <p className="text-sm text-black/70 mt-4 font-semibold">
                    {calculateStats().averageScore > 0 ? "Overall average" : "No completed tests"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#262628] border-none shadow-md hover:shadow-lg transition-shadow rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold text-white/60 mb-1 uppercase tracking-wider">Class Rank</p>
                      <h3 className="text-4xl font-extrabold text-white">{calculateStats().rank !== "--" ? `#${calculateStats().rank}` : "--"}</h3>
                    </div>
                    <div className="p-3 bg-[#FFD166] rounded-2xl shadow-sm">
                      <User className="h-6 w-6 text-black" />
                    </div>
                  </div>
                  <p className="text-sm text-white/70 mt-4 font-semibold">
                    {studentStats.totalStudents > 0 ? `Out of ${studentStats.totalStudents} students` : "View leaderboard"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Graph & Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 shadow-sm border-gray-100 rounded-2xl">
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Your recent test scores</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {categorizedTests.completed.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[...categorizedTests.completed].reverse()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="title" tick={{ fontSize: 12 }} tickFormatter={(value) => value.substring(0, 10) + '...'} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#FFD166" strokeWidth={3} dot={{ r: 4, fill: "#262628" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground flex-col">
                      <Activity className="h-12 w-12 mb-2 opacity-20" />
                      <p>Complete tests to see your performance graph</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Quizzes Mini View */}
              <Card className="shadow-sm border-gray-100 rounded-2xl">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categorizedTests.available.slice(0, 4).map((test, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div>
                          <p className="font-semibold text-sm">{test.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{test.subject}</p>
                        </div>
                        <Button size="sm" onClick={() => navigate(`/quiz/${test.test_id}`)} className="bg-[#262628] hover:bg-black text-white rounded-xl">
                          Start
                        </Button>
                      </div>
                    ))}
                    {categorizedTests.available.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        No pending assignments
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* AI Features Showcase Banner Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: IEEE Cognitive & Adaptive Suite */}
              <div className="bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-blue-800/40 flex flex-col justify-between">
                <div className="space-y-2 mb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[11px] font-semibold">
                    <Brain className="h-3 w-3 text-blue-300" /> IEEE Cognitive Suite
                  </div>
                  <h4 className="text-base font-bold">Bloom's Taxonomy & Adaptive CAT</h4>
                  <p className="text-xs text-blue-200/80 leading-relaxed">
                    Evaluate cognitive depth (L1–L6), test real-time 2PL-IRT ability trait (θ), and view XAI placement attribution radar.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setActiveSection("ieee-cognitive")}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Explore Cognitive Suite <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>

              {/* Card 2: AI Study & RAG Hub */}
              <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-purple-800/40 flex flex-col justify-between">
                <div className="space-y-2 mb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-[11px] font-semibold">
                    <Sparkles className="h-3 w-3 text-purple-300" /> Study & RAG Hub
                  </div>
                  <h4 className="text-base font-bold">Coursework AI Assistant & Flashcards</h4>
                  <p className="text-xs text-purple-200/80 leading-relaxed">
                    Upload syllabus & question papers to clear doubts with page citations and practice active recall flashcards.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setActiveSection("rag-study")}
                  className="w-full bg-white hover:bg-purple-50 text-purple-950 font-bold text-xs rounded-xl shadow-xs"
                >
                  Open Study Hub <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>

              {/* Card 3: AI Resume & ATS Scanner */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-indigo-800/40 flex flex-col justify-between">
                <div className="space-y-2 mb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 text-[11px] font-semibold">
                    <FileCheck className="h-3 w-3 text-indigo-300" /> Resume Scanner
                  </div>
                  <h4 className="text-base font-bold">AI Resume & ATS Placement Match</h4>
                  <p className="text-xs text-indigo-200/80 leading-relaxed">
                    Audit CV keyword density, detect missing Tier 1 product skills, and benchmark your ATS score.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setActiveSection("resume-scanner")}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Scan My Resume <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>

              {/* Card 4: AI Mock Interview Simulator */}
              <div className="bg-gradient-to-br from-emerald-950 to-teal-950 text-white rounded-2xl p-5 shadow-sm border border-teal-800/40 flex flex-col justify-between">
                <div className="space-y-2 mb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-200 text-[11px] font-semibold">
                    <Bot className="h-3 w-3 text-teal-300" /> Mock Interview
                  </div>
                  <h4 className="text-base font-bold">Live AI Technical & HR Screening</h4>
                  <p className="text-xs text-teal-200/80 leading-relaxed">
                    Simulate one-on-one interview rounds with instant rubric evaluation (1-10) and benchmark model answers.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setActiveSection("mock-interview")}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Start Mock Interview <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
                            {activeSection === "quizzes" && (
                              <Card className="min-h-screen rounded-2xl border-none shadow-sm bg-white">
                                <CardHeader className="border-b border-gray-100 pb-6 mb-6">
                                  <CardTitle className="text-2xl font-bold">My Quizzes</CardTitle>
                                  <CardDescription className="text-base">
                                    View all your quizzes and performance
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <Tabs defaultValue="available" className="w-full">
                                    <TabsList className="mb-4">
                                      <TabsTrigger value="available">Available</TabsTrigger>
                                      <TabsTrigger value="completed">Completed</TabsTrigger>
                                      <TabsTrigger value="missed">Missed</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="available">
                                      {studentTestsSection({ tests: categorizedTests.available, navigate })}
                                    </TabsContent>
                                    <TabsContent value="completed">
                                      {studentTestsSection({ tests: categorizedTests.completed, navigate })}
                                    </TabsContent>
                                    <TabsContent value="missed">
                                      {studentTestsSection({ tests: categorizedTests.missed, navigate, isMissedView: true })}
                                    </TabsContent>
                                  </Tabs>
                                </CardContent>
                              </Card>
                            )}
                            {activeSection === "leaderboard" && (
                              <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden min-h-screen">
                                <div className="h-2 bg-[#FFD166] w-full"></div>
                                <CardHeader className="border-b border-gray-100 pb-6 mb-6 pt-8 px-8">
                                  <CardTitle className="text-2xl font-bold">Class Leaderboard</CardTitle>
                                  <CardDescription className="text-base">
                                    See where you stand among your peers
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 pt-0">
                                  <Leaderboard autoFetch={true} hideHeader={true} />
                                </CardContent>
                              </Card>
                            )}

                            {activeSection === "reports" && <StudentReportsSection completedTests={categorizedTests.completed} profile={profile} />}

                            {activeSection === "ieee-cognitive" && (
                              <IEEECognitiveHubUI />
                            )}

                            {activeSection === "placement" && (
                              <PlacementModeUI />
                            )}

                            {activeSection === "rag-study" && (
                              <RAGStudyHubUI />
                            )}

                            {activeSection === "resume-scanner" && (
                              <ResumeATSScannerUI />
                            )}

                            {activeSection === "mock-interview" && (
                              <MockInterviewUI />
                            )}

                            {activeSection === "profile" && (
                              <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
                                <div className="h-32 bg-[#FFD166] w-full"></div>
                                <CardContent className="px-8 pb-8 pt-0">


                                  {profileLoading ? (
                                    <div className="flex justify-center items-center py-12">
                                      <div className="text-gray-500">Loading profile...</div>
                                    </div>
                                  ) : profileError ? (
                                    <div className="flex justify-center items-center py-12 text-red-500">
                                      <p>{profileError}</p>
                                    </div>
                                  ) : profile ? (
                                    <div className="space-y-8">
                                      {/* Profile Header */}
                                      <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 -mt-16">
                                        <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                                          <AvatarFallback className="text-4xl bg-[#262628] text-white">
                                            {profile.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1 text-center sm:text-left mb-2">
                                          <h3 className="text-3xl font-extrabold text-gray-900">{profile.name}</h3>
                                          <p className="text-muted-foreground font-medium">{profile.role} • {profile.department}</p>
                                        </div>
                                      </div>

                                      {/* Profile Information */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                                        <div className="space-y-5 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                          <h4 className="text-lg font-bold text-[#262628] flex items-center gap-2"><User className="h-5 w-5 text-[#FFD166]" /> Personal Information</h4>
                                          <div className="space-y-3">
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                                              <p className="text-sm">{profile.name}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                                              <p className="text-sm">{profile.email}</p>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-5 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                          <h4 className="text-lg font-bold text-[#262628] flex items-center gap-2"><BookOpen className="h-5 w-5 text-[#FFD166]" /> Academic Information</h4>
                                          <div className="space-y-3">
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                                              <p className="text-sm">{profile.role}</p>
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                                              <p className="text-sm">{profile.department}</p>
                                            </div>

                                          </div>
                                        </div>
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-100">
                                        <Button onClick={handleEditProfile} className="bg-[#262628] hover:bg-black text-white rounded-xl">
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Profile
                                        </Button>
                                        <Button variant="outline" onClick={() => setShowResetPasswordModal(true)} className="rounded-xl border-gray-200">
                                          <FileText className="h-4 w-4 mr-2" />
                                          Change Password
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-12">
                                      <p className="text-gray-500">No profile data available</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}
                        </div>

                        {/* Edit Profile Modal */}
                        <Dialog open={showEditProfileModal} onOpenChange={setShowEditProfileModal}>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Profile</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                              <div>
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                  id="name"
                                  type="text"
                                  value={profileData.name}
                                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                  placeholder="Enter your full name"
                                />
                                {profileErrors.name && <p className="text-red-500 text-sm mt-1">{profileErrors.name}</p>}
                              </div>
                              <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={profileData.email}
                                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                  placeholder="Enter your email address"
                                />
                                {profileErrors.email && <p className="text-red-500 text-sm mt-1">{profileErrors.email}</p>}
                              </div>

                              <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={profileSubmitting}>
                                  {profileSubmitting ? 'Updating...' : 'Update Profile'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowEditProfileModal(false)}>
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>

                        {/* Reset Password Modal */}
                        <Dialog open={showResetPasswordModal} onOpenChange={setShowResetPasswordModal}>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Change Password</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                              <div>
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                  id="currentPassword"
                                  type="password"
                                  value={passwordData.currentPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                  placeholder="Enter current password"
                                />
                                {passwordErrors.currentPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</p>}
                              </div>
                              <div>
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                  id="newPassword"
                                  type="password"
                                  value={passwordData.newPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                  placeholder="Enter new password"
                                />
                                {passwordErrors.newPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>}
                              </div>
                              <div>
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                  id="confirmPassword"
                                  type="password"
                                  value={passwordData.confirmPassword}
                                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                  placeholder="Confirm new password"
                                />
                                {passwordErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>}
                              </div>
                              <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={passwordSubmitting}>
                                  {passwordSubmitting ? 'Updating...' : 'Change Password'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowResetPasswordModal(false)}>
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <div className='bg-[#1a365d] p-4 text-center shrink-0'>
                          <h2 className='uppercase text-xl text-white'>
                            DEPARTMENT OF ECE
                          </h2>
                        </div>
                      </SidebarLayout>
                      );
};

                      export default StudentDashboard;