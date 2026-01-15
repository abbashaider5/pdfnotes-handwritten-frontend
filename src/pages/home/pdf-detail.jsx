import { BookOpen, Clock, Download, ShieldCheck, ShoppingBag, Star, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { BuyModal } from '../../components/buy-modal';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { getUserRole, handleLogout } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export function PDFDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pdf, setPdf] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [guestPurchasedFileUrl, setGuestPurchasedFileUrl] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loadingAuthor, setLoadingAuthor] = useState(false);

  useEffect(() => {
    fetchPDF();
  }, [id]);

  useEffect(() => {
    // Check for pending purchase after login
    const pendingPurchase = sessionStorage.getItem('pendingPurchase');
    if (pendingPurchase && currentUser) {
      const parsedPurchase = JSON.parse(pendingPurchase);
      if (parsedPurchase.pdfId === id) {
        setShowBuyModal(true);
        sessionStorage.removeItem('pendingPurchase');
      }
    }
  }, [currentUser, id]);

  // Check localStorage for recent guest purchase and handle countdown
  useEffect(() => {
    const checkGuestPurchase = () => {
      try {
        const purchasedPdfs = JSON.parse(localStorage.getItem('purchased_pdfs') || '[]');
        const purchase = purchasedPdfs.find(p => p.pdfId === id);
        
        if (purchase && new Date(purchase.expiresAt) > new Date()) {
          // Purchase is still valid
          setIsPurchased(true);
          
          // Calculate remaining time in seconds
          const remainingSeconds = Math.floor((new Date(purchase.expiresAt) - new Date()) / 1000);
          setCountdown(remainingSeconds);
          
          // Store order_id for download
          if (purchase.orderId) {
            setGuestPurchasedFileUrl(purchase.orderId); // Repurpose this variable to store orderId
          }
          
          return true;
        } else if (purchase) {
          // Purchase expired, remove it and reset countdown
          const updatedPdfs = purchasedPdfs.filter(p => p.pdfId !== id);
          localStorage.setItem('purchased_pdfs', JSON.stringify(updatedPdfs));
          setGuestPurchasedFileUrl(null);
          setCountdown(null);
          setIsPurchased(false);
        } else {
          setGuestPurchasedFileUrl(null);
          setCountdown(null);
        }
      } catch (error) {
        // Silent fail for localStorage issues
      }
      return false;
    };

    // Check immediately and then every second for countdown
    checkGuestPurchase();
    const interval = setInterval(checkGuestPurchase, 1000);

    return () => clearInterval(interval);
  }, [id]);

  // Format countdown as MM:SS
  const formatCountdown = (seconds) => {
    if (seconds <= 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const fetchPDF = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pdfs')
        .select('*, subjects(name), categories(name)')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) throw error;

      setPdf(data);

      // Fetch author profile separately if author_id exists
      if (data.author_id) {
        await fetchAuthorProfile(data.author_id);
      } else {
        setAuthor(null);
      }

      // Generate signed URL for preview image
      if (data.preview_image_url) {
        try {
          const { data: signedUrlData, error: urlError } = await supabase.storage
            .from('pdfs')
            .createSignedUrl(data.preview_image_url, 300);
          
          if (urlError) {
            if (import.meta.env.DEV) {

            }
          } else {
            setPreviewUrl(signedUrlData.signedUrl);
          }
        } catch (error) {
          if (import.meta.env.DEV) {

          }
        }
      }

      // Check if user has purchased this PDF and get user role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: order } = await supabase
          .from('orders')
          .select('*')
          .eq('pdf_id', id)
          .eq('user_id', user.id)
          .eq('payment_status', 'success')
          .maybeSingle();

        if (order) {
          setIsPurchased(true);
        }
        setCurrentUser(user);
        
        const role = await getUserRole(user.id);
        setUserRole(role);
      }
    } catch (error) {
      if (import.meta.env.DEV) {

      }
    } finally {
      setLoading(false);
    }
  };


  const fetchAuthorProfile = async (authorId) => {
    setLoadingAuthor(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, is_verified, role')
        .eq('id', authorId)
        .maybeSingle();

      if (data && !error) {
        setAuthor({
          name: data.name,
          is_verified: data.is_verified
        });
      } else {
        // No profile found, set author to null to show default "Admin" display
        setAuthor(null);
      }
    } catch (error) {
      if (import.meta.env.DEV) {

      }
      setAuthor(null);
    } finally {
      setLoadingAuthor(false);
    }
  };

  const handleBuyNow = () => {
    setShowBuyModal(true);
  };

  const handleDownload = async () => {
    // Check if we have a valid temporary purchase (with order_id)
    const orderId = guestPurchasedFileUrl; // This now stores orderId
    
    if (!orderId && !isPurchased) {
      toast.error('No valid purchase found. Please complete payment first.');
      return;
    }
    
    setDownloading(true);
    try {
      // If we have an orderId from temporary storage, use backend download API
      if (orderId) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        const downloadUrl = `${backendUrl}/api/download-pdf?order_id=${orderId}`;
        window.open(downloadUrl, '_blank');
        toast.success('Download started!');
      } else {
        // For logged-in users, fetch their order_id from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: order } = await supabase
            .from('orders')
            .select('id')
            .eq('pdf_id', id)
            .eq('user_id', user.id)
            .eq('payment_status', 'success')
            .single();
          
          if (order) {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
            const downloadUrl = `${backendUrl}/api/download-pdf?order_id=${order.id}`;
            window.open(downloadUrl, '_blank');
            toast.success('Download started!');
          } else {
            toast.error('No valid purchase found.');
          }
        }
      }
    } catch (error) {
      toast.error('Download failed. Please try again or check your email.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pdf) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            PDF Not Found
          </h2>
          <p className="text-gray-600">The PDF you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Buy Modal */}
      <BuyModal 
        isOpen={showBuyModal} 
        onClose={() => setShowBuyModal(false)} 
        pdf={pdf} 
        currentUser={currentUser} 
      />

      {/* Download Overlay */}
      {downloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center transform transition-all">
            <div className="mx-auto mb-6">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-green-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-green-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Download className="text-white" size={28} />
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Downloading...
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed">
              Please wait while we prepare your file
            </p>
          </div>
        </div>
      )}

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
              {!currentUser ? (
                <>
                  <a href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </a>
                  <a href="/signup">
                    <Button variant="default">Get Started</Button>
                  </a>
                </>
              ) : userRole === 'user' ? (
                <>
                  <a href="/user/orders" className="text-gray-600 hover:text-primary font-medium px-3 py-2">
                    My Orders
                  </a>
                  <a href="/user/dashboard">
                    <Button variant="default">Dashboard</Button>
                  </a>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2 text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a href="/dashboard">
                    <Button variant="default">Dashboard</Button>
                  </a>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2 text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - PDF Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            <div className="aspect-video rounded-lg overflow-hidden" style={{ backgroundColor: '#E6F1EF' }}>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={pdf.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="text-primary/60 mx-auto" size={80} />
                    <p className="text-lg font-semibold text-primary/80 mt-4 px-6">
                      {pdf.title}
                    </p>
                    {pdf.subjects?.name && (
                      <p className="text-sm text-primary/60 mt-2">
                        {pdf.subjects.name}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Title and Description */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{pdf.subjects?.name}</Badge>
                      <Badge variant="outline">{pdf.categories?.name}</Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {pdf.title}
                    </h1>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                     ₹{pdf.price || 0}
                  </div>
                </div>

                {pdf.description && (
                  <div className="mt-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">
                      Description
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                      {pdf.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info Card */}
          <div className="space-y-3">
            {/* PDF Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PDF Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Subject</p>
                    <p className="font-medium">{pdf.subjects?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{pdf.categories?.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Uploaded</p>
                    <p className="font-medium">
                      {new Date(pdf.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Purchase/Download Button */}
            <Card className="border-2 border-gray-200 hover:border-primary/50 transition-colors">
              <CardContent className="p-6 space-y-4">
                {isPurchased ? (
                  <>
                    <Button
                      onClick={handleDownload}
                      disabled={downloading}
                      size="lg"
                      className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-emerald-600 hover:to-green-500 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/35 transition-all duration-300 text-base font-bold disabled:opacity-70"
                    >
                      <Download className="mr-2.5" size={22} />
                      {downloading ? 'Downloading...' : 'Download PDF'}
                      {countdown !== null && (
                        <span className="ml-2 text-sm font-normal bg-green-700/30 px-2 py-1 rounded">
                          {formatCountdown(countdown)}
                        </span>
                      )}
                    </Button>
                    <p className="text-xs text-gray-600 text-center leading-relaxed">
                      You already own this PDF. Click to download instantly.
                      {countdown !== null && (
                        <span className="block mt-1 text-orange-600 font-medium">
                          Download link expires in {formatCountdown(countdown)}
                        </span>
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="bg-gradient-to-br from-primary/5 to-teal-600/5 rounded-xl p-4 border border-primary/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600 font-medium">Total Price</span>
                        {pdf.original_price && pdf.original_price > pdf.price && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 line-through">₹{pdf.original_price}</span>
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">SAVE {Math.round(((pdf.original_price - pdf.price) / pdf.original_price) * 100)}%</span>
                          </div>
                        )}
                      </div>
                      <div className="text-4xl font-extrabold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
                        ₹{pdf.price || 0}
                      </div>
                    </div>
                    <Button
                      onClick={handleBuyNow}
                      disabled={purchasing}
                      size="lg"
                      variant="default"
                      className="w-full h-14 bg-gradient-to-r from-primary to-teal-600 hover:from-teal-600 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300 text-base font-bold flex items-center justify-between px-6"
                    >
                      <span className="flex items-center gap-2.5">
                        <ShoppingBag size={22} />
                        {purchasing ? 'Processing...' : 'Buy Now'}
                      </span>
                    </Button>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Secure payment</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Instant download</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>7-day money-back guarantee</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Author Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About the Author</CardTitle>
              </CardHeader>
              <CardContent>
  {loadingAuthor ? (
    <div className="flex items-center gap-3">
      <div className="animate-pulse h-12 w-12 bg-gray-200 rounded-full"></div>
      <div className="flex-1">
        <div className="animate-pulse h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="animate-pulse h-3 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  ) : author && (author.role === 'admin' || author.is_admin === true) ? (
    // ✅ Admin / Official Platform Content
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center ring-2 ring-amber-300">
        <Star className="text-white" size={24} fill="currentColor" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900">Admin</p>
          <div
            className="flex items-center gap-1 bg-amber-100 px-1.5 py-0.5 rounded"
            title="Premium Content"
          >
            <Star className="w-3.5 h-3.5 text-amber-600 fill-current" />
            <span className="text-xs font-medium text-amber-700">Premium</span>
          </div>
        </div>
        <p className="text-sm text-gray-500">Official Platform Content</p>
      </div>
    </div>
  ) : author ? (
    // ✅ Normal Author Card
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 bg-gradient-to-br from-primary to-teal-600 rounded-full flex items-center justify-center">
        <User className="text-white" size={24} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900">
            {author.name?.trim() ? author.name : 'Author'}
          </p>

          {author.is_verified && (
            <div
              className="flex items-center gap-1 text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded"
              title="Verified Author"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-xs font-medium text-blue-600">Verified</span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500">
          {author.is_verified ? 'Verified Content Creator' : 'Content Creator'}
        </p>
      </div>
    </div>
  ) : (
    // ✅ Fallback Admin (when author not found)
    <div className="flex items-center gap-3">
      <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center ring-2 ring-amber-300">
        <Star className="text-white" size={24} fill="currentColor" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900">Admin</p>
          <div
            className="flex items-center gap-1 bg-amber-100 px-1.5 py-0.5 rounded"
            title="Premium Content"
          >
            <Star className="w-3.5 h-3.5 text-amber-600 fill-current" />
            <span className="text-xs font-medium text-amber-700">Premium</span>
          </div>
        </div>
        <p className="text-sm text-gray-500">Official Platform Content</p>
      </div>
    </div>
  )}
</CardContent>

            </Card>

            {/* Guarantee */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Money-Back Guarantee
                </h3>
                <p className="text-sm text-gray-600">
                  Not satisfied with your purchase? Contact us within 7 days for a full refund.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
