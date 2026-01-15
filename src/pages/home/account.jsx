import { Download, LogOut, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { SkeletonCard, SkeletonTable } from '../../components/ui/skeleton';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/utils';

export function Account() {
  usePageTitle('My Account');
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('purchases');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const [purchasesData, ordersData] = await Promise.all([
        supabase
          .from('orders')
          .select('*, pdfs(title, price, card_image, pdf_url)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('*, pdfs(title, price)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      setPurchases(purchasesData.data || []);
      setOrders(ordersData.data || []);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {

    }
  };

  const handleDownload = (pdf) => {
    if (!pdf?.pdf_url) return;
    
    const link = document.createElement('a');
    link.href = pdf.pdf_url;
    link.download = `${pdf.title}.pdf`;
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <a href="/" className="text-2xl font-bold text-primary">
                PDFNotes
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-red-600 hover:text-red-700"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('purchases')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'purchases'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Download size={18} className="inline mr-3" />
                    My Purchases
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'orders'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <ShoppingBag size={18} className="inline mr-3" />
                    Order History
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3">
            {activeTab === 'purchases' ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  My Purchases
                </h2>
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <SkeletonCard count={4} />
                  </div>
                ) : purchases.length === 0 ? (
                  <div className="text-center py-16">
                    <Download className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      No purchases yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Browse our collection to find study materials
                    </p>
                    <Button asChild variant="default">
                      <a href="/">Browse PDFs</a>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {purchases.map((purchase) => (
                      <Card
                        key={purchase.id}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <div className="relative aspect-video bg-gray-100 overflow-hidden">
                          {purchase.pdfs?.card_image ? (
                            <img
                              src={purchase.pdfs.card_image}
                              alt={purchase.pdfs.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <Download className="text-gray-400" size={48} />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {purchase.pdfs?.title}
                          </h3>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-600">
                              Purchased on {new Date(purchase.created_at).toLocaleDateString()}
                            </span>
                            <span className="font-bold text-primary">
                              ${purchase.pdfs?.price || 0}
                            </span>
                          </div>
                          <Button
                            onClick={() => handleDownload(purchase.pdfs)}
                            className="w-full"
                            variant="default"
                          >
                            <Download size={16} className="mr-2" />
                            Download
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Order History
                </h2>
                {loading ? (
                  <SkeletonTable rows={10} columns={5} />
                ) : orders.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      No orders yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Browse our collection to find study materials
                    </p>
                    <Button asChild variant="default">
                      <a href="/">Browse PDFs</a>
                    </Button>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                Order ID
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                PDF
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                Amount
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                Status
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((order) => (
                              <tr key={order.id} className="border-b hover:bg-gray-50">
                                <td className="py-4 px-4">
                                  <span className="font-mono text-sm">
                                    #{order.id.slice(0, 8)}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-sm">
                                  {order.pdfs?.title}
                                </td>
                                <td className="py-4 px-4 text-sm font-medium">
                                  ${order.amount || 0}
                                </td>
                                <td className="py-4 px-4">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      order.payment_status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {order.payment_status}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-sm text-gray-600">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
