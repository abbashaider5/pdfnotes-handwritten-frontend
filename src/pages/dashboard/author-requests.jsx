import { CheckCircle, Clock, User, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { supabase } from '../../lib/supabase';

export function AuthorRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('author_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      if (import.meta.env.DEV) {

      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!confirm('Are you sure you want to approve this author request?')) return;

    setProcessing(requestId);
    try {
      const { error: updateError } = await supabase
        .from('author_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Fetch request details for email
      const { data: requestData } = await supabase
        .from('author_requests')
        .select('user_id, full_name, email')
        .eq('id', requestId)
        .single();

      if (requestData) {
        // Update user role in auth
        const { error: authError } = await supabase.auth.admin.updateUserById(
          requestData.user_id,
          { user_metadata: { role: 'author' } }
        );

        if (authError) {
          if (import.meta.env.DEV) {

          }
        }

        // Update profiles table with is_author and role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_author: true,
            role: 'author'
          })
          .eq('id', requestData.user_id);

        if (profileError) {
          if (import.meta.env.DEV) {

          }
        }

        // Send approval email
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL;
          await fetch(`${backendUrl}/api/send-author-approval-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              toEmail: requestData.email,
              applicantName: requestData.full_name,
            }),
          });
        } catch (emailError) {
          if (import.meta.env.DEV) {

          }
        }
      }

      await fetchRequests();
      toast.success('Author request approved successfully!');
    } catch (error) {
      if (import.meta.env.DEV) {

      }
      toast.error('Failed to approve request. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Please enter rejection reason (will be visible to user):');
    if (!reason) return;

    setProcessing(requestId);
    try {
      // Fetch request details first
      const { data: requestData } = await supabase
        .from('author_requests')
        .select('user_id, full_name, email')
        .eq('id', requestId)
        .single();

      const { error } = await supabase
        .from('author_requests')
        .update({
          status: 'rejected',
          admin_notes: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update profiles table with is_author = false
      if (requestData) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_author: false
          })
          .eq('id', requestData.user_id);

        if (profileError) {
          if (import.meta.env.DEV) {

          }
        }

        // Send rejection email
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL;
          await fetch(`${backendUrl}/api/send-author-rejection-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              toEmail: requestData.email,
              applicantName: requestData.full_name,
              reason: reason,
            }),
          });
        } catch (emailError) {
          if (import.meta.env.DEV) {

          }
        }
      }

      await fetchRequests();
      toast.success('Author request rejected.');
    } catch (error) {
      if (import.meta.env.DEV) {

      }
      toast.error('Failed to reject request. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <DashboardLayout title="Author Requests">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Author Applications
            </h2>
            <p className="text-gray-600 mt-1">
              Review and manage author applications from users
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === status
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-4 text-gray-600">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center">
                <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Author Requests
                </h3>
                <p className="text-gray-600">
                  {filter === 'pending'
                    ? 'Great! All pending requests have been reviewed.'
                    : `No ${filter} requests found.`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* User Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {request.full_name?.charAt(0) || request.email?.charAt(0) || 'U'}
                      </div>

                      {/* Request Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {request.full_name || 'Anonymous'}
                              </h3>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {request.email}
                              </span>
                              {request.phone && (
                                <span>{request.phone}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 flex-shrink-0">
                            {new Date(request.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Application Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                              Experience
                            </p>
                            <p className="text-gray-900 font-medium">
                              {request.experience_years} {request.experience_years === 1 ? 'year' : 'years'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                              Qualification
                            </p>
                            <p className="text-gray-900 font-medium">
                              {request.qualification}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                              Subjects
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {request.subjects?.map((subject, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-sm"
                                >
                                  {subject}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                            Why they want to become an author
                          </p>
                          <p className="text-gray-700 leading-relaxed">
                            {request.reason}
                          </p>
                        </div>

                        {/* Admin Notes (if rejected) */}
                        {request.status === 'rejected' && request.admin_notes && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-xs text-red-600 uppercase tracking-wide mb-2">
                              Rejection Reason
                            </p>
                            <p className="text-red-900">
                              {request.admin_notes}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {request.status === 'pending' && (
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleReject(request.id)}
                              disabled={processing === request.id}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              {processing === request.id ? (
                                <span className="flex items-center gap-2">
                                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                  Processing...
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </span>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleApprove(request.id)}
                              disabled={processing === request.id}
                              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                            >
                              {processing === request.id ? (
                                <span className="flex items-center gap-2">
                                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                  Processing...
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Approve Author
                                </span>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Review Info */}
                        {request.status !== 'pending' && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              Reviewed on {new Date(request.reviewed_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
