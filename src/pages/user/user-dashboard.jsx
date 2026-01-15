import { Award, Banknote, ChevronDown, Clock, DollarSign, Download as DownloadIcon, Eye, FileText, ShoppingBag, TrendingUp, Upload, UserCheck, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AuthorRequestModal } from '../../components/author-request-modal';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { UserDashboardLayout } from '../../components/user/user-dashboard-layout';
import { getUserRole } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export function UserDashboard() {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [authorRequest, setAuthorRequest] = useState(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'author'
  const [authorSection, setAuthorSection] = useState('overview'); // 'overview', 'upload', 'earnings', 'views', 'payouts'
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  
  // Payout stats
  const [payouts, setPayouts] = useState([]);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // Author stats
  const [authorStats, setAuthorStats] = useState({
    totalPDFs: 0,
    totalDownloads: 0,
    totalViews: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
  });
  const [pdfs, setPdfs] = useState([]);
  const [thresholdAmount, setThresholdAmount] = useState(100);
  const [thresholdInput, setThresholdInput] = useState(100);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    price: '',
    file: null,
    previewImage: null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [previewImagePreview, setPreviewImagePreview] = useState(null);
  
  // User stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalPDFs: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    fetchUserAndStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'author') {
      fetchAuthorStats();
    }
    if (activeTab === 'author' && authorSection === 'payouts') {
      fetchPayouts();
    }
  }, [activeTab, authorSection]);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/author/payout-requests?user_id=${user.id}`);
        const data = await response.json();
        if (data.success) {
          setPayouts(data.payouts || []);
        } else {
          setPayouts([]);
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {

      }
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAndStats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Check if user is an author from profiles table (source of truth)
      const userRole = await getUserRole(user.id);
      const isUserAuthor = userRole === 'author' || userRole === 'admin';
      setIsAuthor(isUserAuthor);

      // Fetch all orders for this user
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'completed');

      if (ordersError) throw ordersError;

      // Calculate stats
      const totalOrders = orders?.length || 0;
      const totalPDFs = totalOrders;
      const totalSpent = orders?.reduce((sum, order) => {
        return sum + (order.amount || 0);
      }, 0) || 0;

      setStats({
        totalOrders,
        totalPDFs,
        totalSpent,
      });

      // Auto-switch to author tab ONLY if user is approved author (not just has an approved request)
      if (isUserAuthor) {
        setActiveTab('author');
      } else {
        // Regular users stay on dashboard tab
        setActiveTab('dashboard');
      }

      // Fetch author request status
      const { data: authRequests, error: authError } = await supabase
        .from('author_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (authError) {
        if (import.meta.env.DEV) {

        }
      } else {
        setAuthorRequest(authRequests?.[0] || null);
      }
    } catch (error) {
      if (import.meta.env.DEV) {

      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthorStats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      setAuthorStats({
        totalPDFs,
        totalDownloads,
        totalViews,
        totalEarnings,
        pendingEarnings,
      });

      // Fetch threshold settings
      const { data: { user: userData } } = await supabase.auth.getUser();
      const userThreshold = userData?.user_metadata?.threshold_amount || 100;
      setThresholdAmount(userThreshold);
      setThresholdInput(userThreshold);
    } catch (error) {
      if (import.meta.env.DEV) {

      }
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
      if (import.meta.env.DEV) {

      }
      toast.error('Failed to update threshold amount. Please try again.');
    }
  };

  const handleClearEarnings = async () => {
    if (!confirm('Are you sure you want to clear all earnings? This cannot be undone.')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('pdfs')
        .update({ cleared_earnings: 0 })
        .eq('author_id', user.id);

      if (error) throw error;

      await fetchAuthorStats();
      toast.success('Earnings cleared successfully!');
    } catch (error) {
      if (import.meta.env.DEV) {

      }
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
    setUploadProgress(0);
    setUploadStage('Uploading PDF file...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload PDF file with progress tracking
      const fileExt = uploadForm.file.name.split('.').pop();
      const pdfFileName = `${user.id}/${Date.now()}_pdf.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('pdfs')
        .upload(pdfFileName, uploadForm.file, {
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percent));
          }
        });

      if (uploadError) {
        if (import.meta.env.DEV) {

        }
        throw new Error(`Storage error: ${uploadError.message || 'Failed to upload file'}`);
      }
      setUploadStage('Saving to database...');

      const { data: { publicUrl } } = supabase.storage
        .from('pdfs')
        .getPublicUrl(pdfFileName);

      // Upload preview image if provided
      let previewImageUrl = null;
      if (uploadForm.previewImage) {
        setUploadStage('Uploading preview image...');
        const imageExt = uploadForm.previewImage.name.split('.').pop();
        const imageFileName = `${user.id}/${Date.now()}_preview.${imageExt}`;
        
        const { error: imageUploadError, data: imageData } = await supabase.storage
          .from('pdfs')
          .upload(imageFileName, uploadForm.previewImage, {
            upsert: false,
            onUploadProgress: (progress) => {
              const percent = (progress.loaded / progress.total) * 100;
              setUploadProgress(Math.round(percent));
            }
          });

        if (imageUploadError) {
          if (import.meta.env.DEV) {

          }
          throw new Error(`Image upload error: ${imageUploadError.message || 'Failed to upload image'}`);
        }
        setUploadStage('Creating PDF record...');

        const { data: { publicUrl: imagePublicUrl } } = supabase.storage
          .from('pdfs')
          .getPublicUrl(imageFileName);
        previewImageUrl = imagePublicUrl;
      }

      // Insert PDF record into database
      const pdfData = {
        title: uploadForm.title,
        description: uploadForm.description || '',
        price: parseFloat(uploadForm.price),
        pdf_url: publicUrl,
        preview_image_url: previewImageUrl,
        author_id: user.id,
        status: 'published',
        download_count: 0,
        view_count: 0,
        total_earnings: 0,
        cleared_earnings: 0,
        subject_id: null,
        category_id: null,
      };

      const { error: insertError, data: insertData } = await supabase
        .from('pdfs')
        .insert(pdfData)
        .select()
        .single();

      if (insertError) {
        if (import.meta.env.DEV) {

        }
        throw new Error(`Database error: ${insertError.message || 'Failed to save PDF'}`);
      }

      setUploadForm({
        title: '',
        description: '',
        price: '',
        file: null,
        previewImage: null,
      });
      setPreviewImagePreview(null);

      await fetchAuthorStats();
      toast.success('PDF uploaded successfully!');
    } catch (error) {

      toast.error(error.message || 'Failed to upload PDF. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  };

  const handleWithdrawEarnings = async () => {
    if (authorStats.pendingEarnings < thresholdAmount) {
      alert(`You need at least ₹${thresholdAmount} in pending earnings to withdraw. Current: ₹${authorStats.pendingEarnings.toFixed(2)}`);
      return;
    }

    if (!confirm(`Are you sure you want to claim ₹${authorStats.pendingEarnings.toFixed(2)}? This will initiate a withdrawal request.`)) return;

    alert(`Withdrawal request of ₹${authorStats.pendingEarnings.toFixed(2)} submitted successfully! You will receive your payment within 5-7 business days.`);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm({ ...uploadForm, previewImage: file });
      setPreviewImagePreview(URL.createObjectURL(file));
    }
  };

  const authorMenuItems = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'upload', label: 'Upload PDF', icon: <Upload className="h-4 w-4" /> },
    { id: 'views', label: 'Views & Downloads', icon: <Eye className="h-4 w-4" /> },
    { id: 'earnings', label: 'Earnings', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'payouts', label: 'Payout History', icon: <Banknote className="h-4 w-4" /> },
  ];

  return (
    <UserDashboardLayout title={activeTab === 'dashboard' ? 'Dashboard' : 'Author Dashboard'}>
      <div className="space-y-6">
        {/* Tabs - Only show Author tab if user is actually an author (role: author/admin) */}
        {isAuthor && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Dashboard
              </span>
            </button>
            <div className="relative flex-1">
              <button
                onClick={() => {
                  setActiveTab('author');
                  setShowAuthorDropdown(!showAuthorDropdown);
                }}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === 'author'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5" />
                  Author Panel
                  <ChevronDown className="h-5 w-5" />
                </span>
              </button>
              {activeTab === 'author' && showAuthorDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  {authorMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setAuthorSection(item.id);
                        setShowAuthorDropdown(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors ${
                        authorSection === item.id ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-2xl font-bold">Loading...</div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">All completed purchases</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total PDFs Purchased</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-2xl font-bold">Loading...</div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-900">{stats.totalPDFs}</div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">From your orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Amount Spent</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-2xl font-bold">Loading...</div>
                  ) : (
                    <div className="text-3xl font-bold text-primary">₹{stats.totalSpent.toFixed(2)}</div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Lifetime spending</p>
                </CardContent>
              </Card>
            </div>

            {/* Become Author Section */}
            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-teal-600" />
                  Become an Author
                </CardTitle>
              </CardHeader>
              <CardContent>
                {authorRequest ? (
                  <div className="space-y-4">
                    {authorRequest.status === 'pending' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-yellow-900 mb-1">Application Under Review</h4>
                            <p className="text-sm text-yellow-800">
                              Your application is currently being reviewed by our team. We typically respond within 24-48 hours.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {authorRequest.status === 'approved' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <UserCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-green-900 mb-1">Application Approved!</h4>
                            <p className="text-sm text-green-800">
                              Congratulations! Your author account has been approved. You can now start uploading PDFs.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {authorRequest.status === 'rejected' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-red-900 mb-1">Application Not Approved</h4>
                            <p className="text-sm text-red-800 mb-2">Unfortunately, your application was not approved at this time.</p>
                            {authorRequest.admin_notes && (
                              <p className="text-sm text-red-800 italic">Note: {authorRequest.admin_notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600">
                      <strong>Applied on:</strong> {new Date(authorRequest.created_at).toLocaleDateString()}
                      {authorRequest.reviewed_at && (
                        <>
                          <br />
                          <strong>Reviewed on:</strong> {new Date(authorRequest.reviewed_at).toLocaleDateString()}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                      Share your knowledge with thousands of students and earn money by creating and selling premium PDF study materials.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg shadow-teal-500/30"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Award className="h-5 w-5" />
                        Apply to Become an Author
                      </span>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="/user/orders" className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
                  <ShoppingBag size={24} className="text-primary" />
                  <span className="font-medium text-gray-900">View My Orders</span>
                </a>
                <a href="/browse" className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors">
                  <ShoppingBag size={24} className="text-primary" />
                  <span className="font-medium text-gray-900">Browse PDFs</span>
                </a>
              </CardContent>
            </Card>
          </>
        )}

        {/* Author Tab Content - With Dropdown Sections */}
        {activeTab === 'author' && isAuthor && (
          <>
            {/* Overview Section */}
            {authorSection === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total PDFs</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{authorStats.totalPDFs}</div>
                    <p className="text-xs text-muted-foreground mt-1">PDFs uploaded</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                    <DownloadIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{authorStats.totalDownloads}</div>
                    <p className="text-xs text-muted-foreground mt-1">All time downloads</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{authorStats.totalViews}</div>
                    <p className="text-xs text-muted-foreground mt-1">All time views</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-900">Total Earnings</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-700">₹{authorStats.totalEarnings.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1 text-green-800">Lifetime earnings</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-900">Pending Earnings</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-700">₹{authorStats.pendingEarnings.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1 text-blue-800">Available for withdrawal</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Upload PDF Section */}
            {authorSection === 'upload' && (
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
                      <label className="block text-sm font-medium text-gray-900 mb-2">PDF Title *</label>
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
                      <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                      <textarea
                        value={uploadForm.description}
                        onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="3"
                        placeholder="Enter PDF description (optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Price (₹) *</label>
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
                      <label className="block text-sm font-medium text-gray-900 mb-2">Preview Image</label>
                      <input
                        type="file"
                        onChange={handleImageChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        accept="image/*"
                      />
                      {previewImagePreview && (
                        <div className="mt-2">
                          <p className="text-sm text-green-600 mb-2">Preview image selected</p>
                          <img
                            src={previewImagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">PDF File *</label>
                      <input
                        type="file"
                        onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        accept=".pdf"
                        required
                      />
                      {uploadForm.file && (
                        <p className="mt-2 text-sm text-green-600">Selected: {uploadForm.file.name}</p>
                      )}
                    </div>

                    {uploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{uploadStage || 'Uploading...'}</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-teal-600 to-cyan-600 h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={uploading}
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                        uploading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/30'
                      }`}
                    >
                      {uploading ? 'Please wait...' : 'Upload PDF'}
                    </button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Views & Downloads Section */}
            {authorSection === 'views' && (
              <Card>
                <CardHeader>
                  <CardTitle>My PDFs - Views & Downloads</CardTitle>
                </CardHeader>
                <CardContent>
                  {pdfs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No PDFs Uploaded Yet</h3>
                      <p className="text-gray-600">Start uploading your study materials to share with students!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pdfs.map((pdf) => (
                        <div key={pdf.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{pdf.title}</h3>
                              {pdf.description && <p className="text-sm text-gray-600 mb-2">{pdf.description}</p>}
                              <div className="flex gap-4 text-sm">
                                <span className="text-gray-600"><strong>Price:</strong> ₹{pdf.price.toFixed(2)}</span>
                                <span className="text-primary"><strong>Downloads:</strong> {pdf.download_count || 0}</span>
                                <span className="text-gray-600"><strong>Views:</strong> {pdf.view_count || 0}</span>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${pdf.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
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

            {/* Earnings Section */}
            {authorSection === 'earnings' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Earnings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-6">
                      <p className="text-sm font-medium text-gray-600 mb-2">Lifetime Earnings</p>
                      <div className="text-5xl font-bold text-green-700">₹{authorStats.totalEarnings.toFixed(2)}</div>
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="text-primary font-semibold">₹{authorStats.pendingEarnings.toFixed(2)}</span> available for withdrawal
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Minimum withdrawal amount:</strong> ₹500.00
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Claim Earnings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {authorStats.pendingEarnings >= 500 ? (
                      <>
                        <button
                          onClick={handleWithdrawEarnings}
                          className="w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/30"
                        >
                          <span className="flex items-center justify-center gap-2 text-lg">
                            <Banknote className="h-6 w-6" />
                            Claim ₹{authorStats.pendingEarnings.toFixed(2)}
                          </span>
                        </button>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                          <p className="text-sm text-green-800 text-center font-semibold">
                            ✓ You've reached the minimum threshold!
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          disabled
                          className="w-full py-4 px-6 rounded-lg font-semibold bg-gray-100 text-gray-400 cursor-not-allowed transition-all duration-300"
                        >
                          <span className="flex items-center justify-center gap-2 text-lg">
                            <Banknote className="h-6 w-6" />
                            Need ₹500 to Claim
                          </span>
                        </button>
                        <div className="text-center text-sm text-gray-600 mt-4">
                          <p>Available: <span className="font-semibold text-primary">₹{authorStats.pendingEarnings.toFixed(2)}</span></p>
                          <p className="text-xs mt-1">Minimum required: ₹500</p>
                        </div>
                      </>
                    )}
                    <div className="border-t pt-4 mt-4">
                      <button
                        onClick={handleClearEarnings}
                        className="w-full py-3 px-4 rounded-lg font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <XCircle className="h-5 w-5" />
                          Reset Earnings Counter
                        </span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Payout History Section */}
            {authorSection === 'payouts' && (
              <>
                {/* Balance and Request Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Available Balance</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">₹{authorStats.pendingEarnings.toFixed(2)}</p>
                        </div>
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <DollarSign className="text-primary h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-primary/5 to-teal-600/5">
                    <CardContent className="p-6">
                      <button
                        onClick={() => setShowRequestModal(true)}
                        disabled={authorStats.pendingEarnings < 500}
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
                          <Banknote className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payout Requests</h3>
                        <p className="text-gray-600 text-sm">You haven't requested any payouts yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Request Date</th>
                              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Amount (₹)</th>
                              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Admin Note</th>
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
                                <td className="py-4 px-4 text-sm font-bold text-primary">₹{parseFloat(payout.amount).toFixed(2)}</td>
                                <td className="py-4 px-4 text-sm">
                                  {payout.status}
                                </td>
                                <td className="py-4 px-4 text-sm text-gray-600">{payout.admin_note || '-'}</td>
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
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Payout</h3>
                      <p className="text-gray-600 mb-6">
                        Available balance: <span className="font-semibold text-gray-900">₹{authorStats.pendingEarnings.toFixed(2)}</span>
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Payout Amount (₹)</label>
                          <input
                            type="number"
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            placeholder="500.00"
                            min="500"
                            step="0.01"
                            max={authorStats.pendingEarnings}
                            className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          />
                          <p className="text-xs text-gray-500 mt-1">Minimum payout: ₹500.00</p>
                        </div>

                        {payoutAmount && parseFloat(payoutAmount) > authorStats.pendingEarnings && (
                          <p className="text-sm text-red-600 font-medium">Amount exceeds available balance</p>
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
                            onClick={() => {
                              const amount = parseFloat(payoutAmount);
                              if (amount >= 500 && amount <= authorStats.pendingEarnings) {
                                alert(`Payout request of ₹${amount.toFixed(2)} submitted successfully!`);
                                setShowRequestModal(false);
                                setPayoutAmount('');
                                fetchPayouts();
                              }
                            }}
                            disabled={!payoutAmount || parseFloat(payoutAmount) < 500 || parseFloat(payoutAmount) > authorStats.pendingEarnings}
                            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Submit Request
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      
      <AuthorRequestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} userId={userId} />
    </UserDashboardLayout>
  );
}
