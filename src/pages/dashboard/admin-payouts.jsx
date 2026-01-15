import { Check, CheckCircle2, Clock, DollarSign, RefreshCw, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { supabase } from '../../lib/supabase';

export function AdminPayouts() {
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [action, setAction] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, [filterStatus]);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/admin/payout-requests`);
      const data = await response.json();
      
      if (data.success) {
        let filteredPayouts = data.payouts;
        
        if (filterStatus !== 'all') {
          filteredPayouts = filteredPayouts.filter(p => p.status === filterStatus);
        }
        
        setPayouts(filteredPayouts);
      }
    } catch (error) {
      if (import.meta.env.DEV) {

      }
      toast.error('Failed to load payout requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (payout, actionType) => {
    setSelectedPayout(payout);
    setAction(actionType);
    setAdminNote(payout.admin_note || '');
    setPaymentReference(payout.payment_reference || '');
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedPayout || !action) return;

    const updateData = {
      status: action,
    };

    if (adminNote) {
      updateData.admin_note = adminNote;
    }

    if (action === 'paid' && paymentReference) {
      updateData.payment_reference = paymentReference;
    }

    setUpdating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(
        `${backendUrl}/api/admin/payout-requests/${selectedPayout.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...updateData,
            admin_id: user?.id,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Payout ${action} successfully!`);
        setShowActionModal(false);
        setSelectedPayout(null);
        setAdminNote('');
        setPaymentReference('');
        fetchPayouts();
      } else {
        toast.error(data.error || 'Failed to update payout');
      }
    } catch (error) {
      if (import.meta.env.DEV) {

      }
      toast.error('Failed to update payout');
    } finally {
      setUpdating(false);
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

  const filteredPayouts = filterStatus === 'all' 
    ? payouts 
    : payouts.filter(p => p.status === filterStatus);

  const getStatusCounts = () => {
    return {
      all: payouts.length,
      requested: payouts.filter(p => p.status === 'requested').length,
      processing: payouts.filter(p => p.status === 'processing').length,
      approved: payouts.filter(p => p.status === 'approved').length,
      rejected: payouts.filter(p => p.status === 'rejected').length,
      paid: payouts.filter(p => p.status === 'paid').length,
    };
  };

  const counts = getStatusCounts();

  if (loading) {
    return (
      <DashboardLayout title="Payout Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payout Management">
      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setFilterStatus('requested')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'requested'
              ? 'bg-blue-500 text-white'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          Requested ({counts.requested})
        </button>
        <button
          onClick={() => setFilterStatus('processing')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'processing'
              ? 'bg-yellow-500 text-white'
              : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
          }`}
        >
          Processing ({counts.processing})
        </button>
        <button
          onClick={() => setFilterStatus('approved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'approved'
              ? 'bg-green-500 text-white'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          Approved ({counts.approved})
        </button>
        <button
          onClick={() => setFilterStatus('paid')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'paid'
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          Paid ({counts.paid})
        </button>
        <button
          onClick={() => setFilterStatus('rejected')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'rejected'
              ? 'bg-red-500 text-white'
              : 'bg-red-50 text-red-700 hover:bg-red-100'
          }`}
        >
          Rejected ({counts.rejected})
        </button>
        
        <button
          onClick={fetchPayouts}
          className="ml-auto px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Payouts Table */}
      <Card>
        <CardContent className="p-6">
          {filteredPayouts.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Payout Requests
              </h3>
              <p className="text-gray-600 text-sm">
                {filterStatus === 'all'
                  ? 'No payout requests found'
                  : `No ${filterStatus} payouts found`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Author
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Requested
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Admin Note
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayouts.map((payout) => (
                    <tr key={payout.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {payout.profiles?.full_name || 'Unknown Author'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {payout.profiles?.email || 'No email'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                        ₹{parseFloat(payout.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {getStatusBadge(payout.status)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(payout.requested_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {payout.admin_note || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex gap-2">
                          {payout.status === 'requested' && (
                            <>
                              <Button
                                onClick={() => handleAction(payout, 'approved')}
                                size="sm"
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleAction(payout, 'rejected')}
                                size="sm"
                                variant="destructive"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {payout.status === 'approved' && (
                            <Button
                              onClick={() => handleAction(payout, 'processing')}
                              size="sm"
                              className="bg-yellow-500 hover:bg-yellow-600"
                            >
                                <Clock className="w-4 h-4 mr-1" />
                                Process
                            </Button>
                          )}
                          {payout.status === 'processing' && (
                            <Button
                              onClick={() => handleAction(payout, 'paid')}
                              size="sm"
                              className="bg-emerald-500 hover:bg-emerald-600"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Modal */}
      {showActionModal && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {action === 'approved' && 'Approve Payout'}
              {action === 'rejected' && 'Reject Payout'}
              {action === 'processing' && 'Process Payout'}
              {action === 'paid' && 'Mark as Paid'}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Author</p>
                <p className="font-semibold text-gray-900">
                  {selectedPayout.profiles?.full_name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-600">
                  {selectedPayout.profiles?.email || 'No email'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Amount</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{parseFloat(selectedPayout.amount).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Note (Optional)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add any notes about this payout..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              {action === 'paid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Reference
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Transaction ID, UPI reference, etc."
                    className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedPayout(null);
                  setAdminNote('');
                  setPaymentReference('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                disabled={updating}
                className={`flex-1 ${
                  action === 'rejected'
                    ? 'bg-red-500 hover:bg-red-600'
                    : action === 'approved'
                    ? 'bg-green-500 hover:bg-green-600'
                    : action === 'processing'
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {updating ? 'Updating...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
