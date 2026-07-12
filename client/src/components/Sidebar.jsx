import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  UserCheck, 
  ArrowLeftRight, 
  CalendarRange, 
  Wrench, 
  ClipboardCheck, 
  FileSpreadsheet 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const roleName = user?.role?.name || 'EMPLOYEE';

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] },
    { path: '/assets', label: 'Assets Catalog', icon: Package, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] },
    { path: '/allocations', label: 'Allocations', icon: UserCheck, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] },
    { path: '/transfers', label: 'Asset Transfers', icon: ArrowLeftRight, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] },
    { path: '/bookings', label: 'Resource Bookings', icon: CalendarRange, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'] },
    { path: '/audits', label: 'Audits', icon: ClipboardCheck, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'] },
    { path: '/reports', label: 'Reports', icon: FileSpreadsheet, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(roleName));

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <span className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
          <span className="bg-brand-500 text-white p-1.5 rounded-lg text-xs">AF</span>
          <span>AssetFlow <span className="text-brand-400 text-xs font-semibold">ERP</span></span>
        </span>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition duration-150 ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-900/10' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-center text-xs text-slate-500 font-medium">
        AssetFlow ERP v1.0.0
      </div>
    </aside>
  );
}
