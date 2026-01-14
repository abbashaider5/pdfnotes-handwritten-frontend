import { BookOpen, Download, Eye, EyeOff, FileText, Lock, Mail, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { getUserRole } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    document.title = 'PDF Store - Sign In';
    checkPendingPurchase();
  }, []);

  useEffect(() => {
    // Check for pending purchase after login redirect
    const checkForPendingPurchase = async () => {
      const pendingPurchase = sessionStorage.getItem('pendingPurchase');
      if (pendingPurchase) {
        const parsedPurchase = JSON.parse(pendingPurchase);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Redirect to PDF page with modal ready to open
          window.location.href = `/pdf/${parsedPurchase.pdfId}`;
        }
      }
    };

    checkForPendingPurchase();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const role = await getUserRole(session.user.id);
      if (role === 'author' || role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    }
  };

  const checkPendingPurchase = async () => {
    const pendingPurchase = sessionStorage.getItem('pendingPurchase');
    if (pendingPurchase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const parsedPurchase = JSON.parse(pendingPurchase);
        // Redirect to PDF page with modal ready to open
        window.location.href = `/pdf/${parsedPurchase.pdfId}`;
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Wait a moment for session to be established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get user role and redirect appropriately
        const role = await getUserRole(data.user.id);
        console.log('User role:', role);
        
        // Check for pending purchase after successful login
        const pendingPurchase = sessionStorage.getItem('pendingPurchase');
        if (pendingPurchase) {
          const parsedPurchase = JSON.parse(pendingPurchase);
          // Redirect to PDF page with modal ready to open
          window.location.href = `/pdf/${parsedPurchase.pdfId}`;
        } else if (role === 'author' || role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/user/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-teal-500/5 flex items-center justify-center py-4 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 to-teal-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl px-2 sm:px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* Left Column - Login Form */}
          <div>
        {/* Login Card */}
        <Card className="shadow-xl border-gray-200 backdrop-blur-sm bg-white/95">
          <CardHeader className="flex flex-col items-center justify-center text-center">
            <Link to="/" className="flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <BookOpen className="h-9 w-9 text-primary" />
                <span className="absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-primary" />
              </div>
            </Link>

            <CardTitle className="text-2xl font-semibold leading-snug">
              Welcome Back
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              Sign in to continue
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <form className="space-y-4" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 h-11 border-gray-300 focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 h-11 border-gray-300 focus:border-primary focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414 1.414L11.414 10l1.293 1.293a1 1 0 00-1.414 1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-red-800 flex-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-teal-600 hover:from-teal-600 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300"
                size="lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3.7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Create Account Link */}
            <div className="text-center pt-4">
              <Link
                to="/register"
                className="text-sm font-semibold text-primary hover:text-teal-600 transition-colors"
              >
                Don't have an account? Create Account
              </Link>
            </div>

            {/* Back to Home */}
            <div className="text-center pt-4">
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-1.5 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Badge */}
        {/* <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold text-green-700">Secure Login</span>
          </div>
        </div> */}
          </div>

          {/* Right Column - Benefits */}
          <div className="space-y-4 flex flex-col justify-center h-full py-8 lg:py-0">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 text-center lg:text-left">
              Why Choose PDF Store?
            </h2>
            <ul className="space-y-3 text-center">
              <li className="flex items-center justify-center lg:justify-start gap-3 text-gray-700">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Access 5,000+ Premium PDFs</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Zap className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span>Instant Digital Downloads</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span>Join 50,000+ Students</span>
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Download className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <span>High-Quality Resources</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}