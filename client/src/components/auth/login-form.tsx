import { toast } from "react-hot-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_BASE;
import { useAuth } from "@/components/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import loginImage from "@/assets/main/main.png";


export const LoginForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    rollNo: "",
    password: ""
  });
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [signupData, setSignupData] = useState({
    departmentId: '',
    firstName: '',
    registerEmail: '',
    department: '',
    dbPassword: '',
    password: ''
  });
  const [userDetails, setUserDetails] = useState<any>(null);


  const fetchUserDetails = async (rollNo: string) => {
    if (!rollNo) {
      setUserDetails(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/user/${rollNo}`);
      if (res.ok) {
        const data = await res.json();

        setUserDetails(data);
        if (data.role_name) {
          toast.success(`Role: ${data.role_name}`, { position: "top-center" });
        }
      } else {
        setUserDetails(null);
      }
    } catch {
      setUserDetails(null);
    }
  };


  const fetchSignupDetails = async (userId: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/auth/user/${userId}`);
      if (!res.ok) {
        setSignupData(prev => ({
          ...prev,
          departmentId: userId,
          firstName: '',
          registerEmail: '',
          department: '',
          dbPassword: '',
          password: ''
        }));
        return;
      }
      const data = await res.json();
      setSignupData(prev => ({
        ...prev,
        departmentId: data.roll_no,
        firstName: data.name,
        registerEmail: data.email,
        department: data.department,
        dbPassword: data.password || '',
        password: ''
      }));
    } catch (e) {
      setSignupData(prev => ({
        ...prev,
        departmentId: userId,
        firstName: '',
        registerEmail: '',
        department: '',
        dbPassword: '',
        password: ''
      }));
    }
  };

  const { login: setAuthLogin } = useAuth();
  const isSuperAdmin = userDetails?.role_name === 'principal';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'login') {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rollNo: formData.rollNo, password: formData.password })
        });
        const data = await res.json();
        if (res.ok) {
          setAuthLogin(data.token);
          toast.success("Login successful!", { position: "top-center" });

          let role = data.user.role_name;
          if (role === 'vice_principal') role = 'admin';
          if (role === 'principal') role = 'super-admin';

          if (role === "student") navigate("/student");
          else if (role === "faculty") navigate("/faculty");
          else if (role === "hod") navigate("/hod");
          else if (role === "admin") navigate("/admin");
          else if (role === "super-admin") navigate("/super-admin");
          else navigate("/");
        } else {
          toast.error(data.error || "Login failed", { position: "top-center" });
        }
      } catch (err) {
        toast.error("Login failed", { position: "top-center" });
      }
    } else {
      if (!signupData.departmentId || !signupData.password) {
        toast.error('User ID and password required', { position: "top-center" });
        return;
      }
      if (signupData.dbPassword && signupData.dbPassword.trim() !== '') {
        toast.error('Password already set for this user.', { position: "top-center" });
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rollNo: signupData.departmentId, password: signupData.password })
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('Password set successfully! You can now login.', { position: "top-center" });
          setSignupData(prev => ({ ...prev, password: '' }));
          setActiveTab('login');
        } else {
          toast.error(data.error || 'Signup failed', { position: "top-center" });
        }
      } catch (err) {
        toast.error('Signup failed', { position: "top-center" });
      }
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white font-sans overflow-hidden">
      {/* Left Column: Form Area */}
      <div className="w-full lg:w-[45%] flex flex-col p-8 sm:p-12 xl:p-16 bg-white relative z-20 shadow-[20px_0_50px_rgba(0,0,0,0.05)] overflow-y-auto min-h-screen">
        
        {/* Logo at top-left, pushed slightly down */}
        <div className="mt-4 transform hover:scale-105 transition-transform duration-300 origin-left cursor-pointer z-20 flex-shrink-0">
          <Logo size="lg" />
        </div>

        {/* Subtle background decorative element on the left */}
        <div className={`absolute top-0 left-0 w-72 h-72 ${isSuperAdmin ? 'bg-cyan-500/10' : 'bg-primary/10'} rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500`} />

        {/* Center the form vertically taking up available space without overlapping */}
        <div className="w-full max-w-[420px] mx-auto relative z-10 my-auto py-8">
          <div className="mb-4 relative">
            <h1 className="text-3xl md:text-[2.2rem] font-extrabold text-gray-900 mb-3 tracking-tight leading-tight whitespace-nowrap">
              Welcome to{" "}
              <span className={`bg-gradient-to-r ${isSuperAdmin ? 'from-purple-600 via-purple-600 to-cyan-500' : 'from-secondary via-secondary to-primary'} bg-clip-text text-transparent drop-shadow-sm transition-all duration-500`}>
                PREPTRACK!
              </span>
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed max-w-[90%]">
              Step into a world of endless possibilities, powered by learning and fueled by connection.
            </p>
          </div>

          {/* Modern Segmented Control for Tabs */}
          <div className="inline-flex p-1 bg-gray-100/80 rounded-full mb-5 shadow-inner backdrop-blur-sm border border-gray-200/50">
            <Button
              type="button"
              variant="ghost"
              className={`rounded-full px-8 py-3 font-extrabold text-[15px] transition-all duration-300 ${activeTab === 'login' ? `bg-white ${isSuperAdmin ? 'text-cyan-600' : 'text-secondary'} shadow-[0_4px_15px_rgba(0,0,0,0.08)] hover:bg-white` : `text-gray-500 hover:${isSuperAdmin ? 'text-cyan-600' : 'text-secondary'} hover:bg-gray-200/50`}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={`rounded-full px-8 py-3 font-extrabold text-[15px] transition-all duration-300 ${activeTab === 'signup' ? `bg-white ${isSuperAdmin ? 'text-cyan-600' : 'text-secondary'} shadow-[0_4px_15px_rgba(0,0,0,0.08)] hover:bg-white` : `text-gray-500 hover:${isSuperAdmin ? 'text-cyan-600' : 'text-secondary'} hover:bg-gray-200/50`}`}
              onClick={() => setActiveTab('signup')}
            >
              Signup
            </Button>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'login' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2.5 group">
                  <Label htmlFor="rollNo" className="text-sm font-bold text-gray-700 ml-1 group-focus-within:text-secondary transition-colors">User ID / Email</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <User className="h-5 w-5 text-gray-400 group-focus-within:text-secondary transition-colors" />
                    </div>
                    <Input
                      id="rollNo"
                      type="text"
                      placeholder="Enter your User ID or Email"
                      value={formData.rollNo}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, rollNo: e.target.value }));
                        fetchUserDetails(e.target.value);
                      }}
                      className={`pl-12 py-4 bg-gray-50/80 border-gray-200/80 hover:border-primary/50 hover:bg-white focus-visible:ring-4 ${isSuperAdmin ? 'focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500' : 'focus-visible:ring-primary/20 focus-visible:border-primary'} focus-visible:bg-white transition-all duration-300 rounded-xl shadow-sm text-sm font-medium placeholder:text-gray-400`}
                      required
                    />
                  </div>
                </div>

                {userDetails && userDetails.role && (
                  <div className="space-y-2.5">
                    <Label htmlFor="role" className="text-sm font-bold text-gray-700 ml-1">Role</Label>
                    <Input
                      id="role"
                      type="text"
                      value={userDetails.role}
                      disabled
                      className="pl-4 py-4 bg-gray-100 border-gray-200 rounded-xl text-gray-500 font-bold opacity-80 cursor-not-allowed"
                    />
                  </div>
                )}

                <div className="space-y-2.5 group">
                  <Label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1 group-focus-within:text-secondary transition-colors">Password</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-secondary transition-colors" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`pl-12 pr-12 py-4 bg-gray-50/80 border-gray-200/80 hover:border-primary/50 hover:bg-white focus-visible:ring-4 ${isSuperAdmin ? 'focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500' : 'focus-visible:ring-primary/20 focus-visible:border-primary'} focus-visible:bg-white transition-all duration-300 rounded-xl shadow-sm text-sm font-medium placeholder:text-gray-400`}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 text-gray-400 hover:text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Button type="button" variant="link" className="p-0 h-auto text-sm font-bold text-secondary hover:text-primary transition-colors">
                    Forgot your password?
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className={`w-full mt-2 bg-gradient-to-r ${isSuperAdmin ? 'from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white shadow-[0_8px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_12px_25px_rgba(6,182,212,0.4)]' : 'from-primary to-[#ffca4f] hover:from-[#e5a90d] hover:to-primary text-secondary-foreground shadow-[0_8px_20px_rgba(245,184,17,0.3)] hover:shadow-[0_12px_25px_rgba(245,184,17,0.4)]'} py-5 rounded-xl text-[1rem] font-extrabold transition-all duration-300 hover:-translate-y-[2px] active:translate-y-0`}
                >
                  Sign In
                </Button>
              </form>
            ) : (
              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2 group">
                    <Label htmlFor="departmentId" className="block text-sm font-bold text-gray-700 ml-1 group-focus-within:text-secondary transition-colors">User ID*</Label>
                    <Input
                      type="text"
                      id="departmentId"
                      className="w-full px-4 py-4 bg-gray-50/80 border-gray-200/80 hover:border-primary/50 hover:bg-white focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-white transition-all duration-300 rounded-xl shadow-sm text-sm font-medium"
                      placeholder="Enter your User ID"
                      value={signupData.departmentId}
                      onChange={e => setSignupData(prev => ({ ...prev, departmentId: e.target.value }))}
                      onBlur={e => fetchSignupDetails(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="block text-sm font-bold text-gray-700 ml-1">First Name*</Label>
                    <Input
                      type="text"
                      id="firstName"
                      className="w-full px-4 py-4 bg-gray-100 border-gray-200 rounded-xl text-gray-500 font-medium opacity-80 cursor-not-allowed"
                      placeholder="Auto-filled from ID"
                      value={signupData.firstName}
                      disabled
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerEmail" className="block text-sm font-bold text-gray-700 ml-1">Email*</Label>
                    <Input
                      type="email"
                      id="registerEmail"
                      className="w-full px-4 py-4 bg-gray-100 border-gray-200 rounded-xl text-gray-500 font-medium opacity-80 cursor-not-allowed"
                      placeholder="Auto-filled from ID"
                      value={signupData.registerEmail}
                      disabled
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="block text-sm font-bold text-gray-700 ml-1">Department*</Label>
                    <Input
                      type="text"
                      id="department"
                      className="w-full px-4 py-4 bg-gray-100 border-gray-200 rounded-xl text-gray-500 font-medium opacity-80 cursor-not-allowed"
                      placeholder="Auto-filled from ID"
                      value={signupData.department}
                      disabled
                      required
                    />
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="signupPassword" className="block text-sm font-bold text-gray-700 ml-1 group-focus-within:text-secondary transition-colors">Create Password*</Label>
                    <Input
                      type="password"
                      id="signupPassword"
                      className="w-full px-4 py-4 bg-gray-50/80 border-gray-200/80 hover:border-primary/50 hover:bg-white focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:bg-white transition-all duration-300 rounded-xl shadow-sm text-sm font-medium"
                      placeholder="Securely set your password"
                      value={signupData.password}
                      onChange={e => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                      required
                      disabled={signupData.dbPassword && signupData.dbPassword.trim() !== ''}
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className={`w-full mt-2 bg-gradient-to-r ${isSuperAdmin ? 'from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 text-white shadow-[0_8px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_12px_25px_rgba(6,182,212,0.4)]' : 'from-primary to-[#ffca4f] hover:from-[#e5a90d] hover:to-primary text-secondary-foreground shadow-[0_8px_20px_rgba(245,184,17,0.3)] hover:shadow-[0_12px_25px_rgba(245,184,17,0.4)]'} py-5 rounded-xl text-[1rem] font-extrabold transition-all duration-300 hover:-translate-y-[2px] active:translate-y-0`}
                >
                  Create Account
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Premium Illustration Area */}
      <div className={`hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br ${isSuperAdmin ? 'from-purple-700 via-slate-900 to-cyan-600' : 'from-[#2C3171] via-[#212555] to-[#12142d]'} transition-all duration-1000`}>
        {/* Abstract Glowing Background Orbs */}
        <div className={`absolute top-[-10%] right-[-10%] w-[45rem] h-[45rem] ${isSuperAdmin ? 'bg-cyan-500/20' : 'bg-primary/20'} rounded-full blur-[120px] animate-pulse pointer-events-none`} style={{ animationDuration: '8s' }} />
        <div className={`absolute bottom-[-15%] left-[-15%] w-[40rem] h-[40rem] ${isSuperAdmin ? 'bg-purple-600/15' : 'bg-blue-500/15'} rounded-full blur-[100px] pointer-events-none`} />
        
        {/* subtle noise texture for premium feel */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        
        <div className="relative z-10 w-full flex flex-col justify-center items-center px-6 py-6 lg:px-10 h-full">
          {/* Floating Illustration - reduced size with curved edges */}
          <div className="w-full max-w-[48%] transform transition-all duration-1000 hover:scale-[1.03]">
            <img
              src={loginImage}
              alt="Welcome Illustration"
              className="w-full h-auto object-cover rounded-[2.5rem] drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)] animate-float"
            />
          </div>
          
          {/* Motivational Text Block */}
          <div className="mt-6 text-center max-w-md">
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-md tracking-wide">
              Elevate Your Learning.
            </h2>
            <p className="text-blue-100/70 text-sm font-medium leading-relaxed">
              Join thousands of students enhancing their knowledge through interactive assessments and live leaderboards.
            </p>
          </div>

          {/* Powered By Footer */}
          <div className="mt-8 flex items-center gap-2">
            <div className="h-px w-12 bg-white/20 rounded-full" />
            <p className="text-white/40 text-xs font-semibold tracking-widest uppercase">
              Powered by Team ECE
            </p>
            <div className="h-px w-12 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};