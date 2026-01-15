import { DollarSign, Download as DownloadIcon, ShoppingBag, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { SkeletonKPICard } from '../../components/ui/skeleton';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/utils';

export function Analytics() {
  usePageTitle('Analytics');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalSales: 0,
    pdfSales: {},
    categorySales: {},
    subjectSales: {},
    guestOrders: 0,
    userOrders: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch completed orders with PDF details
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          pdfs (
            id,
            title,
            categories (name),
            subjects (name)
          )
        `)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate analytics
      const totalRevenue = orders.reduce((sum, order) => sum + (order.payment_amount || 0), 0);
      const totalSales = orders.length;

      // Group by PDF
      const pdfSales = {};
      orders.forEach(order => {
        if (!pdfSales[order.pdf_id]) {
          pdfSales[order.pdf_id] = { 
            count: 0, 
            revenue: 0,
            title: order.pdfs?.title || 'Unknown PDF'
          };
        }
        pdfSales[order.pdf_id].count += 1;
        pdfSales[order.pdf_id].revenue += order.payment_amount || 0;
      });

      // Group by category
      const categorySales = {};
      orders.forEach(order => {
        const categoryName = order.pdfs?.categories?.name || 'Uncategorized';
        if (!categorySales[categoryName]) {
          categorySales[categoryName] = { count: 0, revenue: 0 };
        }
        categorySales[categoryName].count += 1;
        categorySales[categoryName].revenue += order.payment_amount || 0;
      });

      // Group by subject
      const subjectSales = {};
      orders.forEach(order => {
        const subjectName = order.pdfs?.subjects?.name || 'Unknown';
        if (!subjectSales[subjectName]) {
          subjectSales[subjectName] = { count: 0, revenue: 0 };
        }
        subjectSales[subjectName].count += 1;
        subjectSales[subjectName].revenue += order.payment_amount || 0;
      });

      // Guest vs User breakdown
      const guestOrders = orders.filter(order => order.purchase_type === 'guest').length;
      const userOrders = orders.filter(order => order.purchase_type === 'user').length;

      setAnalytics({
        totalRevenue,
        totalSales,
        pdfSales,
        categorySales,
        subjectSales,
        guestOrders,
        userOrders,
      });
    } catch (error) {
      if (import.meta.env.DEV) {

      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'inr',
    }).format(amount);
  };

  if (loading) {
    return (
      <DashboardLayout title="Analytics">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <SkeletonKPICard />
          <SkeletonKPICard />
          <SkeletonKPICard />
          <SkeletonKPICard />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Analytics">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(analytics.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {analytics.totalSales} sales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {analytics.totalSales}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                PDFs sold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guest Purchases</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {analytics.guestOrders}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.totalSales > 0 ? ((analytics.guestOrders / analytics.totalSales) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Purchases</CardTitle>
              <DownloadIcon className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">
                {analytics.userOrders}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.totalSales > 0 ? ((analytics.userOrders / analytics.totalSales) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PDF-wise Sales */}
          <Card>
            <CardHeader>
              <CardTitle>Top PDFs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.values(analytics.pdfSales)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((pdf, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{pdf.title}</p>
                        <p className="text-xs text-gray-500">{pdf.count} sales</p>
                      </div>
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(pdf.revenue)}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Category-wise Sales */}
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.categorySales)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .map(([category, data]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{category}</p>
                        <p className="text-xs text-gray-500">{data.count} sales</p>
                      </div>
                      <p className="text-sm font-bold text-blue-600">
                        {formatCurrency(data.revenue)}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject-wise Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.subjectSales)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([subject, data]) => (
                  <div key={subject} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{subject}</p>
                      <p className="text-xs text-gray-500">{data.count} sales</p>
                    </div>
                    <p className="text-sm font-bold text-purple-600">
                      {formatCurrency(data.revenue)}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
