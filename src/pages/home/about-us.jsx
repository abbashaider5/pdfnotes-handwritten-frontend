import { Award, BookOpen, CheckCircle, Heart, Target, Users } from 'lucide-react';
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
                PDF Store
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
                    <Button variant="outline" className="px-5 py-2 rounded-lg">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="px-5 py-2 rounded-lg">
                      Get Started
                    </Button>
                  </Link>
                </>
              ) : userRole === 'user' ? (
                <>
                  <Link to="/user/orders" className="text-gray-600 hover:text-primary font-medium px-3 py-2">
                    My Orders
                  </Link>
                  <Link to="/user/dashboard">
                    <Button className="px-5 py-2 rounded-lg">
                      Dashboard
                    </Button>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2 text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/dashboard">
                    <Button className="px-5 py-2 rounded-lg">
                      Dashboard
                    </Button>
                  </Link>
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

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-white via-primary/5 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Empowering Students with
                <span className="bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">Premium Study Materials</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We are on a mission to make quality education accessible to every student through expertly crafted handwritten notes and study resources.
              </p>
              <div className="flex gap-4">
                <Link to="/browse">
                  <Button className="px-6 bg-gradient-to-r from-primary to-teal-600 hover:from-teal-600 hover:to-primary shadow-lg shadow-primary/30">
                    Browse PDFs
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-teal-600/20 rounded-3xl blur-2xl"></div>
              <div className="relative">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary to-teal-600 rounded-2xl blur-2xl opacity-40"></div>
                <img
                  src="/images/image-2.png"
                  alt="Students studying together"
                  className="w-full max-w-md h-auto rounded-2xl shadow-2xl relative z-10 border-4 border-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              To bridge the gap between quality education and students by providing affordable, high-quality study materials created by top educators and successful students.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen className="h-8 w-8" />,
                title: "Quality Content",
                description: "Every PDF is reviewed and verified for accuracy, clarity, and educational value by our expert team of educators."
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Expert Authors",
                description: "Our platform features 500+ experienced educators and top-performing students who create study materials based on real-world examination patterns."
              },
              {
                icon: <Heart className="h-8 w-8" />,
                title: "Affordable Pricing",
                description: "We believe education should be accessible. Our pricing is designed to be student-friendly without compromising on quality."
              }
            ].map((item, idx) => (
              <Card key={idx} className="p-6 rounded-xl border border-gray-200 hover:border-primary transition-all hover:shadow-lg">
                <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-primary/10 text-primary">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-br from-primary to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Trusted by Students Worldwide
            </h2>
            <p className="text-white/90 text-lg">
              Join our growing community of learners
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "50,000+", label: "Active Students", icon: <Users /> },
              { value: "5,000+", label: "Premium PDFs", icon: <BookOpen /> },
              { value: "500+", label: "Expert Authors", icon: <Award /> },
              { value: "24/7", label: "Support Available", icon: <Heart /> }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 h-full">
                  <div className="text-primary mb-2">{stat.icon}</div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-white/90 font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose PDF Store?
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              We're not just another study material platform. We're a community dedicated to your academic success.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                img: "/images/maths-image.png",
                title: "Curated Content",
                description: "Every PDF goes through a rigorous quality check process. Our team of expert educators ensures that all content is accurate, up-to-date, and aligned with the latest curriculum standards.",
                features: ["Quality Verified", "Expert Review", "Updated Regularly"]
              },
              {
                img: "/images/chemistry-5.png",
                title: "Instant Access",
                description: "No more waiting for physical delivery. Purchase your study materials and get instant digital access. Download immediately and start learning right away, anytime, anywhere.",
                features: ["Instant Download", "24/7 Access", "Multi-Device Support"]
              }
            ].map((item, idx) => (
              <Card key={idx} className="overflow-hidden rounded-2xl border border-gray-200 hover:border-primary transition-all hover:shadow-xl">
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{item.description}</p>
                  <div className="space-y-2">
                    {item.features.map((feature, fidx) => (
                      <div key={fidx} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Vision Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-teal-600 to-blue-600 rounded-2xl blur-2xl opacity-40"></div>
                <img
                  src="/images/complete-guide.png"
                  alt="Student with study materials"
                  className="w-full max-w-md h-auto rounded-2xl shadow-2xl relative z-10 border-4 border-white"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Vision
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  We envision a world where every student has access to quality education resources regardless of their geographical location or financial background.
                </p>
                <p>
                  By leveraging technology and connecting talented educators with motivated learners, we're building an ecosystem where knowledge flows freely and academic excellence becomes achievable for everyone.
                </p>
                <div className="bg-white p-6 rounded-xl border border-gray-200 mt-6">
                  <h3 className="text-xl font-bold text-primary mb-3 flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Our Goals for 2026
                  </h3>
                  <ul className="space-y-3 mt-4">
                    {[
                      "Expand to 100,000+ premium PDFs across all subjects",
                      "Partner with 1,000+ expert authors worldwide",
                      "Launch mobile app for better accessibility",
                      "Introduce AI-powered study recommendations",
                      "Support multiple payment options and regional pricing"
                    ].map((goal, gidx) => (
                      <li key={gidx} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-primary to-teal-600 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Join Our Community?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Start your journey to academic excellence with PDF Store. Browse our collection of premium study materials today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/browse">
                <Button size="lg" className="text-lg px-10 py-4 bg-white" style={{ color: '#0d9488' }}>
                  Browse PDFs
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" className="text-lg px-10 py-4 border-2 border-white text-white hover:bg-white/10">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-primary mb-4">
                PDF Store
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your premium destination for high-quality study materials
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white text-sm">Home</Link></li>
                <li><Link to="/browse" className="text-gray-400 hover:text-white text-sm">Browse PDFs</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white text-sm">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-gray-400 hover:text-white text-sm">Help Center</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white text-sm">Contact Us</Link></li>
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
              © 2026 PDF Store. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}