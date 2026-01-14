import { AlertCircle, Banknote, CheckCircle2, Clock, Download, Eye, FileText, TrendingUp, Upload, Wallet, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { UserDashboardLayout } from '../../components/user/user-dashboard-layout';
import { supabase } from '../../lib/supabase';

export function AuthorDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalPDFs: 0,
    totalDownloads: 0,
    totalViews: 0,
    totalEarnings: 0,
    clearedEarnings: 0,
    pendingEarnings: 0,
  });
  const [thresholdAmount, setThresholdAmount] = useState(100);
  const [thresholdInput, setThresholdInput] = useState(100);
  const [pdfs, setPdfs] = useState([]);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    price: '',
    file: null,
  });
  const [uploading, setUploading] = useState(false);
  const [payouts, setPayouts] = useState([]);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchAuthorStats();
    if (activeTab === 'payouts') {
      fetchPayouts();
    }
  }, [activeTab]);

  const fetchAuthorStats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Fetch all PDFs uploaded by this author
      const { data: authorPdfs, error: pdfsError } = await supabase
        .from('pdfs')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (pdfsError) throw pdfsError;

      setPdfs(authorPdfs || []);

      // Calculate stats
      const totalPDFs = authorPdfs?.length || 0;
      const totalDownloads = authorPdfs?.reduce((sum, pdf) => sum + (pdf.download_count || 0), 0) || 0;
      const totalViews = authorPdfs?.reduce((sum, pdf) => sum + (pdf.view_count || 0), 0) || 0;
      const totalEarnings = authorPdfs?.reduce((sum, pdf) => sum + (pdf.total_earnings || 0), 0) || 0;
      const clearedEarnings = authorPdfs?.reduce((sum, pdf) => sum + (pdf.cleared_earnings || 0), 0) || 0;
      const pendingEarnings = totalEarnings - clearedEarnings;

      setStats({
        totalPDFs,
        totalDownloads,
        totalViews,
        totalEarnings,
        clearedEarnings,
        pendingEarnings,
      });

      // Fetch threshold settings (from user metadata or separate table)
      const { data: { user: userData } } = await supabase.auth.getUser();
      const userThreshold = userData?.user_metadata?.threshold_amount || 100;
      setThresholdAmount(userThreshold);
      setThresholdInput(userThreshold);
    } catch (error) {
      console.error('Error fetching author stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        console.log('Fetching payouts for user:', user.id);
        const response = await fetch(`http://localhost:3001/api/author/payout-requests?user_id=${user.id}`);
        const data = await response.json();
        
        console.log('Payouts response:', data);
        
        if (data.success) {
          setPayouts(data.payouts || []);
        } else {
          setPayouts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.auth.updateUser({
        data: { threshold_amount: parseFloat(thresholdInput) }
      });

      if (error) throw error;

      setThresholdAmount(parseFloat(thresholdInput));
      toast.success('Threshold amount updated successfully!');
    } catch (error) {
      console.error('Error updating threshold:', error);
      toast.error('Failed to update threshold amount. Please try again.');
    }
  };

  const handleClearEarnings = async () => {
    if (!confirm('Are you sure you want to clear all earnings? This cannot be undone.')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update all PDFs to clear their earnings
      const { error } = await supabase
        .from('pdfs')
        .update({ cleared_earnings: 0 })
        .eq('author_id', user.id);

      if (error) throw error;

      await fetchAuthorStats();
      toast.success('Earnings cleared successfully!');
    } catch (error) {
      console.error('Error clearing earnings:', error);
      toast.error('Failed to clear earnings. Please try again.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadForm.title || !uploadForm.price || !uploadForm.file) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to Supabase Storage
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, uploadForm.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdfs')
        .getPublicUrl(fileName);

      // Create PDF record
      const { error: insertError } = await supabase
        .from('pdfs')
        .insert({
          title: uploadForm.title,
          description: uploadForm.description,
          price: parseFloat(uploadForm.price),
          file_url: publicUrl,
          author_id: user.id,
          status: 'published',
          download_count: 0,
          view_count: 0,
          total_earnings: 0,
          cleared_earnings: 0,
        });

      if (insertError) throw insertError;

      // Reset form
      setUploadForm({
        title: '',
        description: '',
        price: '',
        file: null,
      });

      await fetchAuthorStats();
      toast.success('PDF uploaded successfully!');
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error('Failed to upload PDF. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleWithdrawEarnings = async () => {
    if (stats.pendingEarnings < thresholdAmount) {
      toast.error(`You need at least ₹${thresholdAmount} in pending earnings to withdraw. Current: ₹${stats.pendingEarnings.toFixed(2)}`);
      return;
    }

    if (!confirm(`Withdraw ₹${stats.pendingEarnings.toFixed(2)} to your payment method?`)) return;

    toast.success('Withdrawal request submitted! You will receive your payment within 5-7 business days.');
    // TODO: Implement actual withdrawal logic with payment gateway
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > stats.pendingEarnings) {
      toast.error('Insufficient balance');
      return;
    }

    if (amount < 500) {
      toast.error('Minimum payout amount is ₹500');
      return;
    }

    setRequestingPayout(true);

    try {
      const response = await fetch('http://localhost:3001/api/author/payout-request', {
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
        fetchPayouts();
        fetchAuthorStats();
      } else {
        toast.error(data.error || 'Failed to submit payout request');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
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

  return (
    <UserDashboardLayout title="Author Dashboard">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('my-pdfs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-pdfs'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My PDFs
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upload PDF
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payouts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payout History
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total PDFs */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total PDFs
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-2xl font-bold">Loading...</div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.totalPDFs}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    PDFs uploaded
                  </p>
                </CardContent>
              </Card>

              {/* Total Downloads */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Downloads
                  </CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-2xl font-bold">Loading...</div>
                  ) : (
                    <div className="text-3xl font-bold text-primary">
                      {stats.totalDownloads}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    All time downloads
                  </p>
                </CardContent>
              </Card>

              {/* Total Views */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Views
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-2xl font-bold">Loading...</div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.totalViews}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    All time views
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Earnings */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-900">
                    Total Earnings
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-2xl font-bold">Loading...</div>
                  ) : (
                    <div className="text-3xl font-bold text-green-700">
                      ₹{stats.totalEarnings.toFixed(2)}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 text-green-800">
                    Lifetime earnings
                  </p>
                </CardContent>
              </Card>

              {/* Pending Earnings */}
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-900">
                    Pending Earnings
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-2xl font-bold">Loading...</div>
                  ) : (
                    <div className="text-3xl font-bold text-blue-700">
                      ₹{stats.pendingEarnings.toFixed(2)}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 text-blue-800">
                    Available for withdrawal
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Actions Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Threshold Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Withdrawal Threshold</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Minimum amount to withdraw
                      </p>
                      <p className="text-xs text-gray-600">
                        Set your minimum withdrawal amount
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      ₹{thresholdAmount}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={thresholdInput}
                      onChange={(e) => setThresholdInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter threshold amount"
                      min="10"
                      step="1"
                    />
                    <button
                      onClick={handleThresholdChange}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Earnings Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <button
                    onClick={handleWithdrawEarnings}
                    disabled={stats.pendingEarnings < thresholdAmount}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                      stats.pendingEarnings >= thresholdAmount
                        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/30'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Banknote className="h-5 w-5" />
                      Withdraw Earnings
                    </span>
                  </button>
                  <button
                    onClick={handleClearEarnings}
                    className="w-full py-3 px-4 rounded-lg font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Clear All Earnings
                    </span>
                  </button>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* My PDFs Tab */}
        {activeTab === 'my-pdfs' && (
          <Card>
            <CardHeader>
              <CardTitle>My PDFs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="mt-4 text-gray-600">Loading your PDFs...</p>
                </div>
              ) : pdfs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No PDFs Uploaded Yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start uploading your study materials to share with students!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pdfs.map((pdf) => (
                    <div key={pdf.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {pdf.title}
                          </h3>
                          {pdf.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {pdf.description}
                            </p>
                          )}
                          <div className="flex gap-4 text-sm">
                            <span className="text-gray-600">
                              <strong>Price:</strong> ₹{pdf.price.toFixed(2)}
                            </span>
                            <span className="text-gray-600">
                              <strong>Downloads:</strong> {pdf.download_count || 0}
                            </span>
                            <span className="text-gray-600">
                              <strong>Views:</strong> {pdf.view_count || 0}
                            </span>
                            <span className="text-green-600 font-semibold">
                              <strong>Earnings:</strong> ₹{pdf.total_earnings?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          pdf.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {pdf.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload PDF Tab */}
        {activeTab === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload New PDF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    PDF Title *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter PDF title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="3"
                    placeholder="Enter PDF description (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={uploadForm.price}
                    onChange={(e) => setUploadForm({ ...uploadForm, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter price in INR"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    PDF File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    accept=".pdf"
                    required
                  />
                  {uploadForm.file && (
                    <p className="mt-2 text-sm text-green-600">
                      Selected: {uploadForm.file.name}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    uploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/30'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {uploading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        Upload PDF
                      </>
                    )}
                  </span>
                </button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Payout History Tab */}
        {activeTab === 'payouts' && (
          <>
            {/* Balance and Request Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Available Balance</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        ₹{stats.pendingEarnings.toFixed(2)}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Wallet className="text-primary h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/5 to-teal-600/5">
                <CardContent className="p-6">
                  <button
                    onClick={() => setShowRequestModal(true)}
                    disabled={stats.pendingEarnings < 500}
                    className="w-full h-full flex flex-col items-center justify-center py-4"
                  >
                    <Banknote className="h-6 w-6 mb-2" />
                    <span className="font-semibold">Request Payout</span>
                    <span className="text-xs opacity-80 mt-1">Minimum ₹500</span>
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Payout History */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-primary/5 to-teal-600/5 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-primary" />
                  Payout History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="mt-4 text-gray-600">Loading payout history...</p>
                  </div>
                ) : payouts.length === 0 ? (
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

            {/* Payout Request Modal */}
            {showRequestModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Request Payout
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Available balance: <span className="font-semibold text-gray-900">₹{stats.pendingEarnings.toFixed(2)}</span>
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
                        max={stats.pendingEarnings}
                        className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum payout: ₹500.00
                      </p>
                    </div>

                    {payoutAmount && parseFloat(payoutAmount) > stats.pendingEarnings && (
                      <p className="text-sm text-red-600 font-medium">
                        Amount exceeds available balance
                      </p>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          setShowRequestModal(false);
                          setPayoutAmount('');
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRequestPayout}
                        disabled={
                          !payoutAmount ||
                          parseFloat(payoutAmount) < 500 ||
                          parseFloat(payoutAmount) > stats.pendingEarnings ||
                          requestingPayout
                        }
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        {requestingPayout ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </UserDashboardLayout>
  );
}
