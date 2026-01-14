import { ArrowRight, CheckCircle, Clock, Download, Lock, Mail, ShoppingBag, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Modal } from './ui/modal';

// Load Stripe.js from CDN
const loadStripe = () => {
  if (window.Stripe) {
    return window.Stripe;
  }
  // Stripe.js must be loaded via <script> tag in index.html or similar
  // For now, we'll use window.Stripe if available
  throw new Error('Stripe.js not loaded. Please add <script src="https://js.stripe.com/v3/"></script> to your HTML.');
};

export function BuyModal({ isOpen, onClose, pdf, currentUser }) {
  const navigate = useNavigate();
  const [guestEmail, setGuestEmail] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState('razorpay');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  // Countdown timer for success modal
  useEffect(() => {
    if (showSuccessModal && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [showSuccessModal]);

  // Auto-select enabled gateway (prefer Stripe if both enabled)
  useEffect(() => {
    if (!paymentSettings) {
      // Settings not loaded - don't set any gateway
      return;
    }

    const razorpayEnabled = paymentSettings.razorpay_enabled === true;
    const stripeEnabled = paymentSettings.stripe_enabled === true;
    
    if (stripeEnabled && razorpayEnabled) {
      setSelectedGateway('stripe'); // Prefer Stripe when both enabled
    } else if (stripeEnabled) {
      setSelectedGateway('stripe');
    } else if (razorpayEnabled) {
      setSelectedGateway('razorpay');
    }
    // If both false - don't select any gateway (will show disabled UI)
  }, [paymentSettings]);

  const fetchPaymentSettings = async () => {
    try {
      console.log('Fetching payment settings from server...');
      // Fetch from server endpoint (bypasses RLS)
      const response = await fetch('http://localhost:3001/api/payment-settings');
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Server response data:', data);
      
      const settings = data.settings;
      console.log('Payment settings parsed:', settings);
      
      setPaymentSettings(settings);
      setLoadingSettings(false);
      
      // Debug logging
      console.log('Payment settings loaded:', settings);
      console.log('Razorpay enabled:', settings?.razorpay_enabled);
      console.log('Stripe enabled:', settings?.stripe_enabled);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      setLoadingSettings(false);
    }
  };

  const handleClose = () => {
    if (!processing) {
      onClose();
      setSelectedOption(null);
      setGuestEmail('');
    }
  };

  const handleContinueAsGuest = async () => {
    if (!guestEmail || !guestEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSelectedOption('guest');
    await initiatePayment('guest', guestEmail);
  };

  const handleLoginAndBuy = () => {
    // Store PDF info for redirect back after login
    sessionStorage.setItem('pendingPurchase', JSON.stringify({
      pdfId: pdf.id,
      pdfTitle: pdf.title,
      pdfPrice: pdf.price,
    }));
    navigate('/login');
  };

  const initiatePayment = async (type, email = null) => {
    setProcessing(true);
    try {
      console.log('Initiating payment with params:', {
        pdf_id: pdf.id,
        amount: pdf.price,
        purchase_type: type,
        gateway: selectedGateway,
      });

      // Create order on server
      const response = await fetch('http://localhost:3001/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_id: pdf.id,
          amount: pdf.price,
          purchase_type: type, // 'user' or 'guest'
          guest_email: type === 'guest' ? email : null,
          user_id: type === 'user' ? currentUser?.id : null,
          payment_gateway: selectedGateway,
        }),
      });

      console.log('Create order response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Create order error response:', errorData);
        let errorMsg = errorData.error || errorData.details || 'Failed to create order';
        if (errorData.name || errorData.code || errorData.details) {
          errorMsg += `\n\nDetails:\n${errorData.name || ''} ${errorData.code || ''}\n${errorData.details || ''}`;
        }
        throw new Error(errorMsg);
      }

      const orderData = await response.json();
      console.log('Order created successfully:', orderData);

      if (selectedGateway === 'stripe') {
        // Stripe payment
        await handleStripePayment(orderData);
      } else {
        // Razorpay payment
        await handleRazorpayPayment(orderData, email);
      }
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRazorpayPayment = async (orderData, email) => {
    const { order_id, razorpay_order_id } = orderData;

    const options = {
      key: paymentSettings?.razorpay_key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: (pdf.price * 100).toString(), // Razorpay expects amount in paise (1 INR = 100 paise)
      currency: 'INR', // Razorpay requires uppercase currency code
      name: 'PDF Store',
      description: pdf.title,
      order_id: razorpay_order_id,
      handler: async function (response) {
        // Payment successful - verify on server
        await verifyPayment('razorpay', order_id, response.razorpay_payment_id, null, response.razorpay_signature);
      },
      prefill: {
        name: currentUser?.user_metadata?.full_name || '',
        email: currentUser?.email || email || '',
      },
      theme: {
        color: '#0ea5e9',
      },
      modal: {
        ondismiss: function () {
          setProcessing(false);
          setVerifying(false);
          console.log('Payment modal dismissed');
          toast.warning('Payment cancelled');
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  };

  const handleStripePayment = async (orderData) => {
    const { order_id, stripe_payment_intent_id, client_secret } = orderData;

    // Defensive check: Validate publishable key before initializing Stripe
    const stripePublishableKey = paymentSettings?.stripe_publishable_key;
    
    if (!stripePublishableKey || typeof stripePublishableKey !== 'string' || stripePublishableKey.trim() === '') {
      console.error('Stripe publishable key is invalid or missing:', {
        hasPaymentSettings: !!paymentSettings,
        hasPublishableKey: !!stripePublishableKey,
        keyType: typeof stripePublishableKey,
        keyLength: stripePublishableKey?.length || 0
      });
      throw new Error('Stripe payment is not configured. Please contact support.');
    }

    console.log('Initializing Stripe with publishable key (first 10 chars):', stripePublishableKey.substring(0, 10) + '...');

    const stripe = window.Stripe(stripePublishableKey);

    const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
      payment_method: {
        card: {
          // For simplicity, using a test card. In production, use Stripe Elements
          token: 'tok_visa',
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      await verifyPayment('stripe', order_id, paymentIntent.id, paymentIntent, null);
    }
  };

  const verifyPayment = async (gateway, orderId, paymentId, paymentIntent = null, signature = null) => {
    // Show verification modal
    setVerifying(true);
    setProcessing(false);

    try {
      const endpoint = gateway === 'stripe' 
        ? 'http://localhost:3001/api/verify-stripe-payment'
        : 'http://localhost:3001/api/verify-razorpay-payment';

      const body = gateway === 'stripe'
        ? { order_id: orderId, payment_intent_id: paymentId }
        : { order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const { success } = await response.json();

      setVerifying(false);

      if (success) {
        toast.success('Payment successful! Your PDF is ready for download.');
        
        // Store purchase in localStorage with 10-minute expiry
        // For both guest and logged-in users, use order_id for download
        const purchaseData = {
          pdfId: pdf.id,
          orderId: orderId,
          purchasedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        };
        
        const purchasedPdfs = JSON.parse(localStorage.getItem('purchased_pdfs') || '[]');
        
        // Remove any existing purchase for this PDF
        const updatedPdfs = purchasedPdfs.filter(p => p.pdfId !== pdf.id);
        
        // Add new purchase
        updatedPdfs.push(purchaseData);
        localStorage.setItem('purchased_pdfs', JSON.stringify(updatedPdfs));
        
        // Set download URL to backend API endpoint
        setDownloadUrl(`http://localhost:3001/api/download-pdf?order_id=${orderId}`);
        
        // Show success modal
        setShowSuccessModal(true);
        handleClose();
      } else {
        toast.error('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerifying(false);
      toast.error('Payment verification failed. Please contact support.');
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    window.location.reload();
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  // Success Modal - shown after payment verification (independent of main modal)
  if (showSuccessModal) {
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <Modal 
        isOpen={showSuccessModal} 
        onClose={handleSuccessModalClose}
        title=""
        size="md"
      >
        <div className="flex flex-col items-center gap-4 py-4 px-4">
          <div className="relative">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={40} />
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold text-gray-900">
              Payment Successful!
            </h3>
            <p className="text-sm text-gray-600">
              Thank you for your purchase
            </p>
          </div>
          
          <div className="w-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="text-white" size={18} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm">Email Sent</p>
                <p className="text-xs text-gray-600">
                  A download link has been sent to your email
                </p>
              </div>
            </div>
          </div>
          
          <div className="w-full space-y-2.5">
            <Button
              onClick={handleDownload}
              disabled={countdown === 0}
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-emerald-600 hover:to-green-500 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/35 transition-all duration-300 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={20} />
              {countdown > 0 ? 'Download PDF Now' : 'Download Link Expired'}
            </Button>
            
            {countdown > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs">
                <Clock size={14} className="text-amber-600" />
                <span className="text-gray-600">
                  Download expires in <span className="font-bold text-amber-600">{formatTime(countdown)}</span>
                </span>
              </div>
            )}
            
            {countdown === 0 && (
              <p className="text-center text-xs text-gray-600 py-1">
                Download expired. Please check your email for the permanent link.
              </p>
            )}
            
            <Button
              onClick={handleSuccessModalClose}
              variant="outline"
              size="lg"
              className="w-full h-10 border-2 hover:border-green-500 hover:bg-green-50 transition-all duration-300 font-semibold text-sm"
            >
              Continue Browsing
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center -mt-1">
            You can also access your purchase from the email we sent
          </p>
        </div>
      </Modal>
    );
  }

  // Verification Modal - shown over everything (independent of main modal)
  if (verifying) {
    return (
      <Modal 
        isOpen={verifying} 
        onClose={() => {}}
        title="Verifying Payment"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-center text-sm text-gray-600">
            Please wait while we confirm your payment
          </p>
        </div>
      </Modal>
    );
  }

  if (!isOpen) return null;

  if (loadingSettings) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="text-gray-600 text-sm">Loading payment options...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if payments are configured
  if (!paymentSettings) {
    // No payment settings row exists - admin hasn't configured payments yet
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-4">
          <div className="flex flex-col items-center gap-3">
            <Lock className="h-12 w-12 text-gray-400" />
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Payments Not Configured</h3>
              <p className="text-sm text-gray-600">Payment settings haven't been configured yet. Please contact admin.</p>
            </div>
            <Button onClick={handleClose} variant="default" className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSettings.payments_enabled === false) {
    // Payments are explicitly disabled
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-4">
          <div className="flex flex-col items-center gap-3">
            <Lock className="h-12 w-12 text-gray-400" />
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Payments Temporarily Disabled</h3>
              <p className="text-sm text-gray-600">Payments are currently disabled. Please contact support for more information.</p>
            </div>
            <Button onClick={handleClose} variant="default" className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Use ONLY DB values - NO FALLBACKS
  const razorpayEnabled = paymentSettings.razorpay_enabled === true;
  const stripeEnabled = paymentSettings.stripe_enabled === true;
  const currency = 'INR'; // Always INR
  
  // Show disabled UI if no gateways are enabled
  if (!razorpayEnabled && !stripeEnabled) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-4">
          <div className="flex flex-col items-center gap-3">
            <Lock className="h-12 w-12 text-gray-400" />
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Payment Methods Available</h3>
              <p className="text-sm text-gray-600">No payment gateways are currently enabled. Please contact support.</p>
            </div>
            <Button onClick={handleClose} variant="default" className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Debug logging
  console.log('PaymentSettings state:', paymentSettings);
  console.log('razorpayEnabled:', razorpayEnabled);
  console.log('stripeEnabled:', stripeEnabled);
  console.log('selectedGateway:', selectedGateway);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Complete Purchase</h3>
          <button
            onClick={handleClose}
            disabled={processing}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* PDF Summary */}
          <div className="bg-gradient-to-br from-primary/5 to-teal-600/5 rounded-xl p-3 border border-primary/10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-600 font-medium mb-0.5">You are purchasing</p>
                <h4 className="text-base font-bold text-gray-900">{pdf.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{pdf.subjects?.name} • {pdf.categories?.name}</p>
              </div>
              <div className="text-xl font-extrabold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
                ₹{pdf.price}
              </div>
            </div>
          </div>

          {/* Payment Gateway Selection */}
          {(razorpayEnabled && stripeEnabled) && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedGateway('razorpay')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedGateway === 'razorpay'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/30'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-900 mb-1">Razorpay</div>
                    <div className={`text-2xl ${selectedGateway === 'razorpay' ? 'text-primary' : 'text-gray-400'}`}>
                      💳
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedGateway('stripe')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedGateway === 'stripe'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/30'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xs font-bold text-gray-900 mb-1">Stripe</div>
                    <div className={`text-2xl ${selectedGateway === 'stripe' ? 'text-primary' : 'text-gray-400'}`}>
                      💳
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Single Gateway Indicator */}
          {(razorpayEnabled && !stripeEnabled) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-900">Paying with Razorpay</span>
            </div>
          )}

          {(!razorpayEnabled && stripeEnabled) && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-purple-900">Paying with Stripe</span>
            </div>
          )}

          {/* Purchase Options */}
          <div className="space-y-2">
            <p className="text-xs text-gray-600">How would you like to continue?</p>

            {currentUser ? (
              <Button
                onClick={() => initiatePayment('user')}
                disabled={processing}
                variant="default"
                className="w-full h-11 bg-gradient-to-r from-primary to-teal-600 hover:from-teal-600 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300 text-sm font-bold flex items-center justify-between px-5"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag size={18} />
                  {processing ? 'Processing...' : `Pay ${currency} ${pdf.price}`}
                </span>
                <ArrowRight size={18} />
              </Button>
            ) : (
              <>
                {/* Guest Purchase Option */}
                <div className="border-2 border-gray-200 hover:border-primary/50 rounded-lg p-3 transition-all cursor-pointer">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900">Continue as Guest</h4>
                        <p className="text-xs text-gray-500">No account required</p>
                      </div>
                    </div>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      disabled={processing}
                      className="w-full h-9 text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleContinueAsGuest();
                      }}
                    />
                    <Button
                      onClick={handleContinueAsGuest}
                      disabled={processing}
                      variant="default"
                      className="w-full h-10 bg-gradient-to-r from-primary to-teal-600 hover:from-teal-600 hover:to-primary transition-all duration-300 font-semibold text-sm"
                    >
                      {processing ? 'Processing...' : `Pay ${currency} ${pdf.price} as Guest`}
                    </Button>
                  </div>
                </div>

                {/* Login & Buy Option */}
                <Button
                  onClick={handleLoginAndBuy}
                  disabled={processing}
                  variant="outline"
                  className="w-full h-11 border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 text-sm font-semibold flex items-center justify-between px-5 group"
                >
                  <span className="flex items-center gap-2">
                    <User size={18} />
                    Login & Buy
                  </span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </>
            )}
          </div>

          {/* Security Note */}
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-600 flex items-start gap-1.5">
              <Lock className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span className="leading-tight">
                Secure payment powered by <strong>{selectedGateway === 'stripe' ? 'Stripe' : 'Razorpay'}</strong>. 
                Your payment information is encrypted and secure.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
