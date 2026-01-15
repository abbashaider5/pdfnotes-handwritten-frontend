import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { SkeletonTable } from '../../components/ui/skeleton';
import { UserDashboardLayout } from '../../components/user/user-dashboard-layout';
import { supabase } from '../../lib/supabase';

export function UserOrders() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's orders - get basic order data
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'success')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch PDF details separately for each order
      const ordersWithPdfs = await Promise.all(
        (ordersData || []).map(async (order) => {
          if (!order.pdf_id) return { ...order, pdfs: null };

          const { data: pdfData, error: pdfError } = await supabase
            .from('pdfs')
            .select('*')
            .eq('id', order.pdf_id)
            .single();

          if (pdfError || !pdfData) {
            if (import.meta.env.DEV) {

            }
            return { ...order, pdfs: null };
          }

          return { ...order, pdfs: pdfData };
        })
      );

      setOrders(ordersWithPdfs);
    } catch (error) {
      if (import.meta.env.DEV) {

      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (pdfUrl, pdfTitle, orderId) => {
    if (!pdfUrl) return;

    setDownloading(prev => ({ ...prev, [orderId]: true }));

    try {
      // Create signed URL with 60 second expiry
      const { data, error } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(pdfUrl, 60);

      if (error) throw error;

      // Download directly without exposing URL
      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${pdfTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (import.meta.env.DEV) {

      }
      toast.error('Download failed. Please try again.');
    } finally {
      setDownloading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <UserDashboardLayout title="My Orders">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {orders.length} Order{orders.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <SkeletonTable rows={5} columns={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Order ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">PDF Title</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-500">
                        No orders yet.{' '}
                        <a href="/browse" className="text-primary hover:underline">
                          Browse PDFs
                        </a>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-sm text-gray-900">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-sm">{order.pdfs?.title}</p>
                        </td>
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">
                          ₹{order.payment_amount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.payment_status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : order.payment_status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {order.payment_status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {order.payment_status === 'success' && order.pdfs?.pdf_url ? (
                          <button
                            onClick={() =>
                              handleDownload(
                                order.pdfs.pdf_url,
                                order.pdfs.title,
                                order.id
                              )
                            }
                            disabled={downloading[order.id] || !order.pdfs?.pdf_url}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                              <Download size={16} />
                              {downloading[order.id] ? 'Downloading...' : 'Download'}
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Not available
                            </span>
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
    </UserDashboardLayout>
  );
}
