import { Eye, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { SkeletonTable } from '../../components/ui/skeleton';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/utils';

export function Orders() {
  usePageTitle('Orders');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, users(email), pdfs(title, price, card_image)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.pdfs?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.users?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.payment_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <DashboardLayout title="Orders">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {filteredOrders.length} Order{filteredOrders.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonTable rows={10} columns={6} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order ID</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">PDF</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {order.users?.email?.[0]?.toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm">{order.users?.email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {order.pdfs?.card_image ? (
                                <img
                                  src={order.pdfs.card_image}
                                  alt={order.pdfs.title}
                                  className="h-10 w-10 object-cover rounded"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                                  <Eye size={18} className="text-gray-400" />
                                </div>
                              )}
                              <span className="text-sm font-medium">{order.pdfs?.title}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm font-medium">
                            ${order.amount || 0}
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={getStatusColor(order.payment_status)}>
                              {order.payment_status || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
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
