import React from 'react';
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
  LogOut,
  X as CloseIcon
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

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { currentUser, logout, isStockManager } = useAuth();

  // Close sidebar on mobile when a link is clicked
  const handleLinkClick = () => {
    if (window.innerWidth < 768) setOpen(false);
  };

  // Sidebar content
  const sidebarContent = (
    <div
      className={clsx(
        'h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="p-4 flex items-center border-b border-slate-200">
        <div className={clsx('flex-1', collapsed ? 'hidden' : '')}>
          <h1 className="text-xl font-bold text-indigo-700">StockTrack</h1>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-slate-100 text-slate-500 md:block hidden"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        {/* Mobile close button */}
        <button
          onClick={() => setOpen(false)}
          className="p-1 rounded-md hover:bg-slate-100 text-slate-500 md:hidden block ml-2"
        >
          <CloseIcon size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <nav className="space-y-1">
          <div onClick={handleLinkClick}>
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
          </div>
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

  // Responsive rendering
  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      {/* Sidebar drawer on mobile, static on desktop */}
      <aside
        className={clsx(
          'fixed z-50 top-0 left-0 h-full md:static md:translate-x-0 transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
          'md:block',
          'w-64',
          'md:h-screen'
        )}
        style={{ width: collapsed ? 64 : 256 }}
        aria-label="Sidebar"
      >
        {sidebarContent}
      </aside>
    </>
  );
};