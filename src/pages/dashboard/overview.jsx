import { FileText, Package, ShoppingCart, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { SkeletonChart, SkeletonKPICard, SkeletonTable } from '../../components/ui/skeleton';
import { useDashboardTour } from '../../lib/dashboard-tour';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/utils';

export function DashboardOverview() {
  usePageTitle('Dashboard');
  useDashboardTour();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPDFs: 0,
    totalSales: 0,
    totalRevenue: 0,
    activePDFs: 0,
    draftPDFs: 0,
    salesChange: 0,
    revenueChange: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch PDFs count
      const { data: pdfs } = await supabase
        .from('pdfs')
        .select('id, status, price');

      // Fetch all orders (not just recent ones) for stats
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch recent orders (last 5) for display
      const { data: orders } = await supabase
        .from('orders')
        .select('*, users(email), pdfs(title, price)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (pdfs) {
        // Calculate real total revenue from actual orders, not PDF prices
        const totalRevenue = allOrders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
        const totalSales = allOrders?.length || 0;

        // Calculate percentage changes from last month
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Get current month sales and revenue
        const currentMonthOrders = allOrders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        }) || [];

        const currentMonthSales = currentMonthOrders.length;
        const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => sum + (order.amount || 0), 0);

        // Get last month sales and revenue
        const lastMonthOrders = allOrders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear;
        }) || [];

        const lastMonthSales = lastMonthOrders.length;
        const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.amount || 0), 0);

        // Calculate percentage changes
        const salesChange = lastMonthSales > 0 
          ? ((currentMonthSales - lastMonthSales) / lastMonthSales) * 100 
          : (currentMonthSales > 0 ? 100 : 0);

        const revenueChange = lastMonthRevenue > 0 
          ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
          : (currentMonthRevenue > 0 ? 100 : 0);

        setStats({
          totalPDFs: pdfs.length,
          activePDFs: pdfs.filter(p => p.status === 'published').length,
          draftPDFs: pdfs.filter(p => p.status === 'draft').length,
          totalRevenue,
          totalSales,
          salesChange: Math.round(salesChange),
          revenueChange: Math.round(revenueChange),
        });
      }

      if (orders) {
        setRecentOrders(orders);
        setRecentUploads(pdfs?.slice(-5).reverse() || []);
      }

      // Calculate real monthly sales data from orders
      const monthlySales = {};
      allOrders?.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        if (!monthlySales[monthKey]) {
          monthlySales[monthKey] = 0;
        }
        monthlySales[monthKey] += order.amount || 0;
      });

      // Convert to array for chart
      const chartData = Object.entries(monthlySales).map(([name, revenue]) => ({
        name,
        sales: Math.round(revenue),
        revenue: Math.round(revenue),
      }));

      setSalesData(chartData.length > 0 ? chartData : []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div id="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <SkeletonKPICard />
              <SkeletonKPICard />
              <SkeletonKPICard />
              <SkeletonKPICard />
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total PDFs</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPDFs}</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-blue-600" size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.activePDFs} active, {stats.draftPDFs} draft
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Sales</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSales}</p>
                    </div>
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="text-green-600" size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    <span className={`${stats.salesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.salesChange > 0 ? '+' : ''}{stats.salesChange}%
                    </span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        ₹{stats.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Wallet className="text-purple-600" size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    <span className={`${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.revenueChange > 0 ? '+' : ''}{stats.revenueChange}%
                    </span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active PDFs</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activePDFs}</p>
                    </div>
                    <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Package className="text-orange-600" size={20} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.draftPDFs} drafts pending
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          {loading ? (
            <SkeletonChart />
          ) : (
            <Card id="sales-chart">
              <CardHeader>
                <CardTitle className="text-lg">Sales Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end gap-2">
                  {salesData.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                        style={{ height: `${(item.sales / 120) * 100}%` }}
                      />
                      <span className="text-xs text-gray-500">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Orders */}
          <Card id="recent-orders">
            <CardHeader>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonTable rows={5} columns={4} />
              ) : (
                <div className="space-y-3">
                  {recentOrders.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No orders yet</p>
                  ) : (
                    recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{order.pdfs?.title || 'Unknown PDF'}</p>
                          <p className="text-xs text-gray-500">{order.users?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">₹{order.amount || 0}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonTable rows={4} columns={4} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Title</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Subject</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Price</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUploads.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">
                          No PDFs uploaded yet
                        </td>
                      </tr>
                    ) : (
                      recentUploads.map((pdf) => (
                        <tr key={pdf.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{pdf.title}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{pdf.subject || '-'}</td>
                          <td className="py-3 px-4 text-sm">₹{pdf.price || 0}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                pdf.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {pdf.status}
                            </span>
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
