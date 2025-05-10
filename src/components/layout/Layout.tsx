import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar for desktop, drawer for mobile */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden flex items-center h-14 px-4 bg-white border-b border-slate-200">
          <button
            className="mr-3 p-2 rounded-md hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <span className="text-lg font-bold text-indigo-700">StockTrack</span>
        </header>
        <main className="flex-1 overflow-auto p-2 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};