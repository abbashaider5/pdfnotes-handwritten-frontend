import { Check, Mail, Search, ShieldCheck, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { SkeletonTable } from '../../components/ui/skeleton';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/utils';

export function Users() {
  usePageTitle('Users');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingVerification, setUpdatingVerification] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all users from profiles table
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, created_at, name, role, is_verified')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch all orders to get statistics (only completed orders)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, payment_amount, created_at')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Aggregate order statistics by user
      const orderStats = {};
      ordersData?.forEach((order) => {
        if (!orderStats[order.user_id]) {
          orderStats[order.user_id] = {
            totalPurchases: 0,
            totalSpent: 0,
            lastPurchase: null,
          };
        }
        orderStats[order.user_id].totalPurchases += 1;
        orderStats[order.user_id].totalSpent += order.payment_amount || 0;
        const purchaseDate = new Date(order.created_at);
        if (!orderStats[order.user_id].lastPurchase || purchaseDate > orderStats[order.user_id].lastPurchase) {
          orderStats[order.user_id].lastPurchase = purchaseDate;
        }
      });

      // Combine user data with order statistics
      const usersWithStats = (usersData || []).map((user) => ({
        id: user.id,
        email: user.email || 'No email',
        name: user.name || 'No name',
        role: user.role || 'user',
        is_verified: user.is_verified || false,
        createdAt: user.created_at,
        displayName: user.name || (user.email ? user.email.split('@')[0] : 'Unknown User'),
        totalPurchases: orderStats[user.id]?.totalPurchases || 0,
        totalSpent: orderStats[user.id]?.totalSpent || 0,
        lastPurchase: orderStats[user.id]?.lastPurchase || null,
      }));

      setUsers(usersWithStats);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

    const toggleAuthorVerification = async (userId, currentVerifiedStatus) => {
      setUpdatingVerification(userId);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/admin/authors/${userId}/verify`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_verified: !currentVerifiedStatus,
            admin_id: user?.id,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();

          toast.error(`Failed: ${errorText || response.statusText}`);
          return;
        }

        let data;
        try {
          data = await response.json();
        } catch (parseError) {

          toast.error('Failed to parse server response');
          return;
        }

        if (data.success) {
          toast.success(
            `Author ${!currentVerifiedStatus ? 'verified' : 'unverified'} successfully!`
          );
          fetchUsers(); // Refresh users list
        } else {
          toast.error(data.error || 'Failed to update verification status');
        }
      } catch (error) {

        toast.error('Failed to update verification status');
      } finally {
        setUpdatingVerification(null);
      }
    };

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Users">
      <div className="space-y-6">
        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {filteredUsers.length} User{filteredUsers.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonTable rows={10} columns={7} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Verified</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total Purchases</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total Spent</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                                <User size={18} className="text-white" />
                              </div>
                              <span className="text-sm font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
                                <Mail size={18} className="text-white" />
                              </div>
                              <span className="text-sm font-medium">{user.email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {user.role === 'author' ? (
                              user.is_verified ? (
                                <span className="inline-flex items-center gap-1 text-blue-600">
                                  <ShieldCheck className="w-4 h-4" />
                                  <span className="text-sm font-medium">Verified</span>
                                </span>
                              ) : (
                                <span className="text-gray-500 text-sm">Not Verified</span>
                              )
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <ShoppingBag size={16} className="text-gray-400" />
                              <span className="text-sm font-medium">{user.totalPurchases}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">₹{user.totalSpent.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {user.role === 'author' && (
                              <button
                                onClick={() => toggleAuthorVerification(user.id, user.is_verified)}
                                disabled={updatingVerification === user.id}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  updatingVerification === user.id
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : user.is_verified
                                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                              >
                                {updatingVerification === user.id ? (
                                  'Updating...'
                                ) : user.is_verified ? (
                                  <>
                                    <X className="w-4 h-4" />
                                    Revoke
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-4 h-4" />
                                    Verify
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
