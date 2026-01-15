import { Award, BookOpen, CheckCircle, DollarSign, FileText, Heart, Shield, TrendingUp, Upload, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { handleLogout } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export function AboutUs() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setUserRole(profile?.role || 'user');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl font-bold text-primary">
                PDFNotes
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link to="/" className="text-gray-600 hover:text-primary font-medium transition-colors">
                  Home
                </Link>
                <Link to="/browse" className="text-gray-600 hover:text-primary font-medium transition-colors">
                  Browse
                </Link>
                <Link to="/about" className="text-gray-600 hover:text-primary font-medium transition-colors">
                  About Us
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!user ? (
                <>
                  <Link to="/login">
                    <Button variant="outline">Sign In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button>Get Started</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to={userRole === 'admin' || userRole === 'author' ? '/dashboard' : '/user/dashboard'}>
                    <Button>Dashboard</Button>
                  </Link>
                  <button onClick={handleLogout} className="text-red-600 hover:text-red-700 font-medium">
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-white to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About <span className="bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">PDFNotes</span>
          </h1>
          <p className="text-lg text-gray-600 mb-2 max-w-3xl mx-auto">
            A premium marketplace for buying and selling high-quality handwritten study notes in PDF format
          </p>
          <p className="text-sm text-gray-500 italic">
            A HyDigit Product
          </p>
        </div>
      </section>

      {/* What is PDFNotes */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What is PDFNotes?</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-teal-600 mx-auto mb-6"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>PDFNotes</strong> is a platform designed to help students access high-quality handwritten notes and exam resources in PDF format. Whether you're preparing for exams, need comprehensive study materials, or want to learn from top-performing students, PDFNotes makes it easy.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                We believe that knowledge should be accessible, shareable, and rewarding. That's why we've built a marketplace where students can both learn and earn.
              </p>
              <div className="bg-gradient-to-r from-primary/10 to-teal-600/10 border border-primary/20 rounded-lg p-4 mt-6">
                <p className="text-gray-800 font-semibold mb-2">
                  <Heart className="inline w-5 h-5 text-primary mr-2" />
                  A HyDigit Product
                </p>
                <p className="text-gray-600 text-sm">
                  PDFNotes is proudly built by <strong>HyDigit</strong> to empower students worldwide. Our mission is to help students learn smarter and help creators earn by sharing their knowledge.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-primary/20 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Users className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-2xl text-gray-900 mb-1">50,000+</h3>
                  <p className="text-sm text-gray-600">Active Students</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <FileText className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-2xl text-gray-900 mb-1">10,000+</h3>
                  <p className="text-sm text-gray-600">Study Notes</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <UserCheck className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-2xl text-gray-900 mb-1">500+</h3>
                  <p className="text-sm text-gray-600">Verified Authors</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-2xl text-gray-900 mb-1">100%</h3>
                  <p className="text-sm text-gray-600">Secure</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How PDFNotes Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How PDFNotes Works</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-teal-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Buying handwritten study notes has never been easier. Here's how it works:
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, title: 'Browse Notes', desc: 'Explore our extensive collection of handwritten notes by subject, category, and author' },
              { icon: FileText, title: 'Preview Quality', desc: 'View preview images to check the quality and style before purchasing' },
              { icon: CheckCircle, title: 'Secure Purchase', desc: 'Buy securely using multiple payment options (Razorpay, Stripe)' },
              { icon: TrendingUp, title: 'Instant Download', desc: 'Get instant access to your PDF after successful payment' },
            ].map((step, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sell Your Handwritten Notes */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sell Your Handwritten Notes</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-teal-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Are you a student with excellent handwritten notes? Turn your knowledge into income by selling your notes on PDFNotes!
            </p>
          </div>
          <div className="bg-gradient-to-br from-primary/5 via-white to-teal-50 rounded-2xl p-8 md:p-12 border border-primary/10">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Take Photos or Scan</h4>
                      <p className="text-sm text-gray-600">
                        Photograph or scan your handwritten notes pages clearly
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Convert to PDF</h4>
                      <p className="text-sm text-gray-600">
                        Combine all pages into a single PDF file
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Upload & Publish</h4>
                      <p className="text-sm text-gray-600">
                        Once approved as an Author, upload your PDF with title, description, and price
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Earn Money</h4>
                      <p className="text-sm text-gray-600">
                        Every time a student purchases your notes, you earn 90% of the sale
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Key Requirements</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        <strong>Original Work:</strong> Notes must be your own handwritten material
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        <strong>Clear Quality:</strong> Ensure photos are clear, legible, and well-lit
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        <strong>Professional Format:</strong> Convert to PDF with proper naming and organization
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">
                        <strong>Accurate Details:</strong> Provide correct subject, category, and description
                      </span>
                    </li>
                  </ul>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      <strong className="text-gray-900">Pro Tip:</strong> Students can easily convert photos to PDF using free apps like CamScanner, Adobe Scan, or Microsoft Lens.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Become an Author */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Become an Author</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-teal-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Any registered user can apply to become an Author and start selling their handwritten notes
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-xl border-primary/10">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Step-by-Step Author Application Process</h3>
                <div className="space-y-6">
                  {[
                    {
                      icon: Users,
                      title: 'Create an Account',
                      desc: 'Sign up for a free PDFNotes account if you haven\'t already'
                    },
                    {
                      icon: Upload,
                      title: 'Apply to Become Author',
                      desc: 'Navigate to your User Dashboard and click on "Request Author Access" or "Become an Author"'
                    },
                    {
                      icon: FileText,
                      title: 'Fill Application Form',
                      desc: 'Provide necessary details about yourself and why you want to become an author'
                    },
                    {
                      icon: Award,
                      title: 'Admin Reviews Application',
                      desc: 'Our admin team reviews your application to ensure quality and authenticity'
                    },
                    {
                      icon: UserCheck,
                      title: 'Get Approved',
                      desc: 'Once approved, your account is upgraded to "Author" status'
                    },
                    {
                      icon: TrendingUp,
                      title: 'Start Earning',
                      desc: 'Upload your handwritten notes as PDFs and start earning from every sale!'
                    },
                  ].map((step, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary to-teal-600 rounded-lg flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-primary">STEP {index + 1}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 bg-gradient-to-r from-primary/10 to-teal-600/10 rounded-lg p-6 border border-primary/20">
                  <p className="text-sm text-gray-700 text-center">
                    <strong>Note:</strong> The approval process typically takes 24-48 hours. We review all applications to maintain platform quality.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Author Earnings & Platform Fee */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Author Earnings & Platform Fee</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-teal-600 mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Fair, transparent pricing that rewards creators
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <Card className="bg-gradient-to-br from-primary to-teal-600 text-white shadow-xl">
                <CardContent className="p-8">
                  <DollarSign className="w-12 h-12 mb-4" />
                  <h3 className="text-2xl font-bold mb-4">How Author Earnings Work</h3>
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Platform Fee: 10%</h4>
                      <p className="text-sm text-white/90">
                        PDFNotes charges a 10% platform fee to cover hosting, payment processing, and platform maintenance
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Author Share: 90%</h4>
                      <p className="text-sm text-white/90">
                        You keep 90% of every sale. That's one of the highest author shares in the industry!
                      </p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Payout Requests</h4>
                      <p className="text-sm text-white/90">
                        Request payouts anytime from your Author Dashboard. Minimum payout threshold may apply.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Earnings Example</h3>
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                    <span className="text-gray-700 font-semibold">PDF Price Set by Author</span>
                    <span className="text-2xl font-bold text-gray-900">₹500</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Platform Fee (10%)</span>
                      <span className="text-lg font-semibold text-red-600">- ₹50</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-primary/30">
                      <span className="text-gray-900 font-bold text-lg">Author Earns (90%)</span>
                      <span className="text-3xl font-bold text-green-600">₹450</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Example:</strong> If you sell 100 copies at ₹500 each, you'll earn <strong>₹45,000</strong> (after platform fee)
                </p>
              </div>
              <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Price your notes competitively. Well-priced, quality notes sell faster and generate more earnings!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust, Quality & Safety */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trust, Quality & Safety</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-teal-600 mx-auto mb-6"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: UserCheck,
                title: 'Verified Authors',
                desc: 'All authors go through a verification process to ensure authenticity and quality'
              },
              {
                icon: Shield,
                title: 'Secure Payments',
                desc: 'Industry-standard payment gateways (Razorpay, Stripe) ensure your transactions are safe'
              },
              {
                icon: Award,
                title: 'Quality Assurance',
                desc: 'We review all uploads to maintain high standards and remove plagiarized content'
              },
              {
                icon: FileText,
                title: 'Original Work',
                desc: 'Authors must upload their own original handwritten notes. Copyright infringement is strictly prohibited'
              },
              {
                icon: TrendingUp,
                title: 'Fast Downloads',
                desc: 'Instant PDF delivery after successful payment. Access your notes anytime, anywhere'
              },
              {
                icon: Heart,
                title: 'Community Support',
                desc: 'Join a community of 50,000+ students and creators sharing knowledge'
              },
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-primary/10">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Support?</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-teal-600 mx-auto mb-6"></div>
          <p className="text-gray-600 mb-8">
            Our team is here to help with any questions or issues you may have
          </p>
          <div className="bg-gradient-to-r from-primary/5 to-teal-50 rounded-2xl p-8 border border-primary/20">
            <h3 className="font-bold text-xl text-gray-900 mb-2">PDFNotes Support</h3>
            <p className="text-gray-600 mb-4">A HyDigit Product</p>
            <p className="text-gray-700 mb-6">
              For any questions, technical issues, or partnership inquiries, please contact our support team.
              We typically respond within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@pdfnotes.hydigit.net" className="text-primary hover:text-teal-600 font-semibold">
                support@pdfnotes.hydigit.net
              </a>
              <span className="hidden sm:inline text-gray-400">|</span>
              <a href="https://pdfnotes.hydigit.net" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-teal-600 font-semibold">
                pdfnotes.hydigit.net
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Join thousands of students buying and selling handwritten notes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100 px-8">
                Create Free Account
              </Button>
            </Link>
            <Link to="/browse">
              <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8">
                Browse Notes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-primary mb-4">
                PDFNotes
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">
                Your premium destination for high-quality handwritten study notes
              </p>
              <p className="text-gray-500 text-xs italic">A HyDigit Product</p>
              <a href="https://pdfnotes.hydigit.net" className="text-gray-400 hover:text-primary text-xs mt-1 block">
                pdfnotes.hydigit.net
              </a>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white text-sm">Home</Link></li>
                <li><Link to="/browse" className="text-gray-400 hover:text-white text-sm">Browse Notes</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white text-sm">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-gray-400 hover:text-white text-sm">Help Center</Link></li>
                <li><a href="mailto:support@pdfnotes.hydigit.net" className="text-gray-400 hover:text-white text-sm">Contact Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} PDFNotes. A HyDigit Product. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
