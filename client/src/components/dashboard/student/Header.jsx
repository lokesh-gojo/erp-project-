import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button";
import college_logo  from '../../../assets/main/College_logo.png'

const API_BASE = import.meta.env.VITE_API_BASE;

const Header = () => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;
        const res = await fetch(`${API_BASE}/users/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok && data.success && data.profile?.name) {
          setUserName(data.profile.name);
        }
      } catch {}
    };
    fetchProfile();
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: College Logo */}
        <div className="flex-shrink-0 w-24">
          <img src={college_logo} alt="College Logo" className="h-16 w-auto object-contain" />
        </div>

        {/* Center: College Details & Department */}
        <div className="text-center flex-grow px-4">
          <h1 className="text-lg md:text-xl lg:text-2xl font-extrabold text-[#1a365d] tracking-wide leading-tight uppercase">
            Easa College of Engineering & Technology
          </h1>
          <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-1">
            Navakkarai (P.O), NH - 47, Palakkad Main Road, Coimbatore, Tamil Nadu - 641105
          </p>
          <div className="inline-block mt-2 bg-[#1a365d] text-white text-[9px] md:text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Department of Electronics and Communication Engineering
          </div>
        </div>

        {/* Right Side: Log out & User Profile Info */}
        <div className="flex items-center justify-end w-24 gap-4">
          
        
          <div className="Logout">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                sessionStorage.clear();
                localStorage.clear();
                window.location.reload();
              }}
              aria-label="Logout"
              className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold px-4 py-2 transition duration-200 rounded-lg shadow-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="feather feather-log-out">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
