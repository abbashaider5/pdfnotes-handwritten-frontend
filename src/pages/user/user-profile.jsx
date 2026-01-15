import { Calendar, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { UserDashboardLayout } from '../../components/user/user-dashboard-layout';
import { handleLogout } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    email: '',
    createdAt: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile({
        email: profileData?.email || user.email || '',
        createdAt: profileData?.created_at || user.created_at || '',
      });
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  return (
    <UserDashboardLayout title="Profile">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (
            <>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <User size={20} className="text-gray-400" />
                  <span className="text-gray-900">{profile.email}</span>
                </div>
              </div>

              {/* Account Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Created
                </label>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar size={20} className="text-gray-400" />
                  <span className="text-gray-900">
                    {profile.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Role Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <User size={20} className="text-primary" />
                  <span className="text-gray-900 font-medium">User</span>
                </div>
              </div>

              {/* Logout Button */}
              <div className="pt-6 border-t">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Account editing is currently disabled. 
                  Contact support if you need to update your email or password.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </UserDashboardLayout>
  );
}
