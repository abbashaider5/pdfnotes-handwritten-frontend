import {
  Award,
  Banknote,
  Book,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tag,
  TrendingUp,
  Upload,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getUserRole, handleLogout } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

const commonMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Upload, label: 'Upload PDF', path: '/dashboard/upload' },
  { icon: FileText, label: 'My PDFs', path: '/dashboard/pdfs' },
  { icon: Tag, label: 'Categories', path: '/dashboard/categories' },
  { icon: Book, label: 'Subjects', path: '/dashboard/subjects' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  { icon: ExternalLink, label: 'Visit Website', path: '/', external: true },
];

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: TrendingUp, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: ShoppingBag, label: 'Orders', path: '/dashboard/orders' },
  { icon: FileText, label: 'My PDFs', path: '/dashboard/pdfs' },
  { icon: Upload, label: 'Upload PDF', path: '/dashboard/upload' },
  { icon: Book, label: 'Subjects', path: '/dashboard/subjects' },
  { icon: Tag, label: 'Categories', path: '/dashboard/categories' },
  { icon: Award, label: 'Author Requests', path: '/dashboard/author-requests' },
  { icon: ShieldCheck, label: 'Payout Management', path: '/dashboard/admin-payouts' },
  { icon: Users, label: 'Users', path: '/dashboard/users' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  { icon: ExternalLink, label: 'Visit Website', path: '/', external: true },
];

const authorMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileText, label: 'My PDFs', path: '/dashboard/pdfs' },
  { icon: Upload, label: 'Upload PDF', path: '/dashboard/upload' },
  { icon: Book, label: 'Subjects', path: '/dashboard/subjects' },
  { icon: Tag, label: 'Categories', path: '/dashboard/categories' },
  { icon: ShoppingBag, label: 'Orders', path: '/dashboard/orders' },
  { icon: Banknote, label: 'Payout History', path: '/dashboard/payouts' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  { icon: ExternalLink, label: 'Visit Website', path: '/', external: true },
];

export function Sidebar({ collapsed, onToggle, isMobile }) {
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const role = await getUserRole(user.id);
        setUserRole(role);
      }
    };
    fetchUserRole();
  }, []);

  return (
    <aside
      id="dashboard-sidebar"
      className={`fixed left-0 top-0 z-40 h-screen bg-white border-r transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } ${isMobile ? 'translate-x-full' : 'translate-x-0'}`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && <h1 className="text-xl font-bold text-primary">PDF Store</h1>}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {(userRole === 'admin' ? adminMenuItems : userRole === 'author' ? authorMenuItems : commonMenuItems).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              if (item.external) {
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-700 hover:bg-gray-100`}
                  >
                    <Icon size={20} />
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </a>
                );
              }
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  id={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors w-full ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const role = await getUserRole(user.id);
        setUserRole(role);
      }
    };
    fetchUserRole();
  }, []);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-primary">PDF Store</h1>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {(userRole === 'admin' ? adminMenuItems : userRole === 'author' ? authorMenuItems : commonMenuItems).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              if (item.external) {
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-700 hover:bg-gray-100`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </a>
                );
              }
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors w-full">
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
