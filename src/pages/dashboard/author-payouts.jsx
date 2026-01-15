import { Banknote, CheckCircle2, Clock, TrendingUp, Wallet, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { supabase } from '../../lib/supabase';

export function AuthorPayouts() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [balance, setBalance] = useState(0);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [userId, setUserId] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetchUserPayouts();
    fetchUserBalance();
  }, []);

  const fetchUserBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/author/earnings?user_id=${user.id}`);
        const data = await response.json();
        
        if (data.success) {
          setBalance(parseFloat(data.balance) || 0);
        }
      }
    } catch (error) {

    }
  };

  const fetchUserPayouts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/author/payout-requests?user_id=${user.id}`);
        const data = await response.json();
        
        if (data.success) {
          setPayouts(data.payouts);
        }
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (amount < 500) {
      toast.error('Minimum payout amount is ₹500');
      return;
    }

    setRequestingPayout(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/author/payout-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payout request submitted successfully!');
        setShowRequestModal(false);
        setPayoutAmount('');
        fetchUserPayouts();
        fetchUserBalance();
      } else {
        toast.error(data.error || 'Failed to submit payout request');
      }
    } catch (error) {

      toast.error('Failed to submit payout request');
    } finally {
      setRequestingPayout(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'requested':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            <Clock className="w-3 h-3 mr-1" />
            Requested
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Paid
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Payouts">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payouts">
      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Balance</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ₹{balance.toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Wallet className="text-primary h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {payouts.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-10 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-blue-600 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 bg-gradient-to-br from-primary/5 to-teal-600/5">
          <CardContent className="p-6">
            <Button
              onClick={() => setShowRequestModal(true)}
              disabled={balance < 500}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <Banknote className="h-6 w-6 mb-2" />
              <span className="font-semibold">Request Payout</span>
              <span className="text-xs opacity-80 mt-1">Minimum ₹500</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payout Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Request Payout
            </h3>
            <p className="text-gray-600 mb-6">
              Available balance: <span className="font-semibold text-gray-900">₹{balance.toFixed(2)}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payout Amount (₹)
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="500.00"
                  min="500"
                  step="0.01"
                  max={balance}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum payout: ₹500.00
                </p>
              </div>

              {payoutAmount && parseFloat(payoutAmount) > balance && (
                <p className="text-sm text-red-600 font-medium">
                  Amount exceeds available balance
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    setShowRequestModal(false);
                    setPayoutAmount('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestPayout}
                  disabled={
                    !payoutAmount ||
                    parseFloat(payoutAmount) < 500 ||
                    parseFloat(payoutAmount) > balance ||
                    requestingPayout
                  }
                  className="flex-1"
                >
                  {requestingPayout ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout History */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-primary/5 to-teal-600/5 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" />
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Wallet className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Payout Requests
              </h3>
              <p className="text-gray-600 text-sm">
                You haven't requested any payouts yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                      Request Date
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                      Amount (₹)
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">
                      Admin Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                        {new Date(payout.requested_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-primary">
                        ₹{parseFloat(payout.amount).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        {getStatusBadge(payout.status)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {payout.admin_note || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
