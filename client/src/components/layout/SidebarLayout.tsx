import React, { useState } from 'react';
import { Menu, X, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  navItems,
  activeSection,
  setActiveSection,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-[#c8d3db] overflow-hidden text-sm md:text-base">
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#262628] text-white flex flex-col transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'w-20' : 'w-64'} lg:m-4 lg:rounded-[2rem] rounded-r-3xl shadow-xl shrink-0`}>
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <span className="font-bold text-xl tracking-wider text-white">Menu</span>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white hover:bg-white/10 shrink-0">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Collapse button for Desktop */}
        <div className="hidden lg:flex items-center justify-end p-4">
          <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-400 hover:text-white hover:bg-white/10 shrink-0">
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        {/* Empty space if not collapsed and no button shown, or adjust as needed */}
        {!isCollapsed && <div className="hidden lg:block h-2"></div>}

        <nav className="flex-1 px-4 py-2 space-y-3 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-4 ${isCollapsed ? 'px-0 justify-center' : 'px-5'} py-4 rounded-2xl transition-all duration-200 group ${
                activeSection === item.id 
                  ? 'bg-[#FFD166] text-black font-bold shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`transition-transform duration-200 shrink-0 ${activeSection === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              {!isCollapsed && <span className="text-sm tracking-wide truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 mt-auto border-t border-white/10">
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
            className={`w-full flex items-center gap-4 ${isCollapsed ? 'px-0 justify-center' : 'px-5'} py-4 rounded-2xl transition-all duration-200 text-red-400 hover:text-red-300 hover:bg-red-400/10 group`}
          >
            <div className="transition-transform duration-200 shrink-0 group-hover:scale-110">
              <LogOut className="h-5 w-5" />
            </div>
            {!isCollapsed && <span className="text-sm tracking-wide font-medium truncate">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile header for opening sidebar */}
        <div className="lg:hidden p-4 bg-white flex items-center shadow-sm z-10 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <span className="ml-4 font-semibold">PREP-TRACK</span>
        </div>
        
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-[#fafafa] lg:m-4 lg:ml-0 lg:rounded-[2rem] rounded-tl-3xl shadow-xl flex flex-col relative w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SidebarLayout;
