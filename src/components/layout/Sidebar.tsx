import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart4, 
  Package, 
  UploadCloud, 
  Users, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Box,
  LogOut
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, collapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={clsx(
        'flex items-center py-2 px-3 mb-1 rounded-md text-sm font-medium transition-colors',
        isActive 
          ? 'bg-indigo-100 text-indigo-900' 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
        collapsed ? 'justify-center' : ''
      )}
    >
      <span className={clsx(collapsed ? 'mx-auto' : 'mr-3')}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
};

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, logout, isStockManager } = useAuth();
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <div
      className={clsx(
        'h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-4 flex items-center border-b border-slate-200">
        <div className={clsx('flex-1', collapsed ? 'hidden' : '')}>
          <h1 className="text-xl font-bold text-indigo-700">StockTrack</h1>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-slate-100 text-slate-500"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        <nav className="space-y-1">
          <SidebarLink 
            to="/" 
            icon={<BarChart4 size={20} />} 
            label="Dashboard" 
            collapsed={collapsed} 
          />
          <SidebarLink 
            to="/inventory" 
            icon={<Search size={20} />} 
            label="Inventory Lookup" 
            collapsed={collapsed} 
          />
          <SidebarLink 
            to="/boxes" 
            icon={<Box size={20} />} 
            label="Boxes" 
            collapsed={collapsed} 
          />
          
          {isStockManager && (
            <>
              <SidebarLink 
                to="/upload" 
                icon={<UploadCloud size={20} />} 
                label="SOH Upload" 
                collapsed={collapsed} 
              />
              <SidebarLink 
                to="/users" 
                icon={<Users size={20} />} 
                label="User Management" 
                collapsed={collapsed} 
              />
            </>
          )}
        </nav>
      </div>
      
      <div className="p-3 border-t border-slate-200">
        {!collapsed && currentUser && (
          <div className="mb-3 px-3 py-2">
            <div className="text-sm font-medium text-slate-900">{currentUser.name}</div>
            <div className="text-xs text-slate-500">
              {currentUser.role === 'stock-manager' ? 'Stock Manager' : 'Sales Staff'}
            </div>
          </div>
        )}
        
        <button
          onClick={logout}
          className={clsx(
            'flex items-center py-2 px-3 w-full rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors',
            collapsed ? 'justify-center' : ''
          )}
        >
          <span className={clsx(collapsed ? 'mx-auto' : 'mr-3')}><LogOut size={20} /></span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};