import { ExternalLink, LogOut, ShoppingBag, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { handleLogout } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export function UserDashboardLayout({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    fetchUserEmail();
  }, []);

  const fetchUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || '');
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <nav className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-8">
                  <a href="/" className="text-2xl font-bold text-primary">
                    PDFNotes
                  </a>
                </div>
                <div className="flex items-center gap-4">
                  <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-primary font-medium">
                    <ExternalLink size={16} />
                    Visit Website
                  </a>
                  <a href="/user/orders" className="text-gray-600 hover:text-primary font-medium">
                    My Orders
                  </a>
                  <a href="/user/dashboard" className="text-gray-600 hover:text-primary font-medium">
                    Dashboard
                  </a>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <nav className="space-y-2">
                <a
                  href="/user/dashboard"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/user/dashboard')}`}
                >
                  <User size={20} />
                  <span className="font-medium">Dashboard</span>
                </a>
                <a
                  href="/user/orders"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/user/orders')}`}
                >
                  <ShoppingBag size={20} />
                  <span className="font-medium">My Orders</span>
                </a>
                <a
                  href="/user/profile"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/user/profile')}`}
                >
                  <User size={20} />
                  <span className="font-medium">Profile</span>
                </a>
                <a
                  href="/"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-600 hover:bg-gray-100`}
                >
                  <ExternalLink size={20} />
                  <span className="font-medium">Visit Website</span>
                </a>
              </nav>

              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="text-sm text-gray-500">
                  <p className="font-medium text-gray-700 mb-1">Logged in as:</p>
                  <p className="truncate">{userEmail}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {title && (
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
