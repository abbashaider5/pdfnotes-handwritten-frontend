import { ArrowRight, BookOpen, Download, Search, Shield, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { SkeletonCard } from '../../components/ui/skeleton';
import { getUserRole, handleLogout } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/utils';

export function Homepage() {
  usePageTitle('Premium Study PDFs');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(true);
  const [subjectFilterOpen, setSubjectFilterOpen] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const role = await getUserRole(user.id);
      setUserRole(role);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pdfsResponse, subjectsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('pdfs')
          .select('*, subjects(name), categories(name)')
          .eq('status', 'published')
          .order('created_at', { ascending: false }),
        supabase
          .from('subjects')
          .select('*')
          .eq('enabled', true)
          .order('order_index', { ascending: true }),
        supabase
          .from('categories')
          .select('*')
          .eq('enabled', true)
          .order('order_index', { ascending: true })
      ]);

      // Remove duplicates by name from subjects (same subject name can exist under different categories)
      const subjectsMap = new Map();
      subjectsResponse.data?.forEach(s => {
        if (!subjectsMap.has(s.name)) {
          subjectsMap.set(s.name, s);
        }
      });
      const filteredSubjects = Array.from(subjectsMap.values());
      
      setSubjects(filteredSubjects || []);
      setCategories(categoriesResponse.data || []);

      if (pdfsResponse.error) {

        setPdfs([]);
      } else {
        const pdfsWithUrls = (pdfsResponse.data || []).map(pdf => {
          if (pdf.card_image) {
            const { data: { publicUrl } } = supabase.storage
              .from('pdfs')
              .getPublicUrl(pdf.card_image);
            return { ...pdf, card_image: publicUrl };
          }
          return pdf;
        });
        setPdfs(pdfsWithUrls);
      }

      if (subjectsResponse.error) {

        setSubjects([]);
      } else {
        setSubjects(subjectsResponse.data || []);
      }

      if (categoriesResponse.error) {

        setCategories([]);
      }
    } catch (error) {

      setPdfs([]);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPDFs = pdfs.filter((pdf) => {
    const matchesSearch = pdf.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || pdf.categories?.name === selectedCategory;
    const matchesSubject = !selectedSubject || pdf.subjects?.name === selectedSubject;
    return matchesSearch && matchesCategory && matchesSubject;
  });

  // Get unique subjects for selected category (ensure no duplicates)
  const availableSubjects = Array.from(new Set(
    selectedCategory
      ? pdfs
          .filter(pdf => pdf.categories?.name === selectedCategory)
          .map(pdf => pdf.subjects?.name)
          .filter(Boolean)
      : pdfs.map(pdf => pdf.subjects?.name).filter(Boolean)
  ));

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
      <section className="py-10 lg:py-12 bg-gradient-to-br from-white via-primary/5 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-teal-600/10 border border-primary/20 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-sm font-semibold text-primary">Trusted by 50,000+ Students</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight">
                Master Your Studies with <span className="bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">Premium Handwritten Notes</span>
              </h1>
              <p className="text-base text-gray-600 mb-7 leading-relaxed">
                Buy high-quality handwritten study notes in PDF format. Created by top students, verified for quality, and delivered instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Link to="/browse">
                  <Button className="px-6 bg-gradient-to-r from-primary to-teal-600 hover:from-teal-600 hover:to-primary shadow-lg shadow-primary/30">
                    Explore Collection
                    <ArrowRight className="ml-2" size={18} />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified Quality
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Instant Download
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  24/7 Support
                </span>
              </div>
            </div>
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-teal-600/20 rounded-3xl blur-2xl"></div>
              <div className="relative">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-primary to-teal-600 rounded-2xl blur-2xl opacity-40"></div>
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-teal-600 to-blue-600 rounded-2xl blur-2xl opacity-40"></div>
                <img
                  src="/images/image-3.png"
                  alt="Students studying with handwritten notes"
                  className="w-3/4 lg:w-full max-w-md h-auto rounded-2xl shadow-2xl relative z-10 border-4 border-white"
                />
                <div className="absolute -bottom-3 -right-3 z-20">
                  <div className="bg-gradient-to-r from-primary to-teal-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                    <span className="font-bold">5,000+</span>
                    <span className="text-xs">PDFs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Handwritten Notes Showcase */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Handwritten Study Notes
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Meticulously crafted by top students and educators
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { img: '/images/maths-image.png', title: 'Mathematics Notes', desc: 'Complex problems simplified step-by-step' },
              { img: '/images/chemistry-5.png', title: 'Science Notes', desc: 'Diagrams and detailed explanations' },
              { img: '/images/complete-guide.png', title: 'Complete Guides', desc: 'Comprehensive study materials' }
            ].map((item, idx) => (
              <div key={idx} className="group overflow-hidden rounded-xl border border-gray-200 hover:border-primary transition-colors">
                <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PDFs Section */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Latest Study Materials
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Filters */}
            <div className="lg:col-span-1 space-y-6">
              {/* Search Bar */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search PDFs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 text-sm rounded-lg border-gray-300 focus:border-primary"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setCategoryFilterOpen(!categoryFilterOpen)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-bold text-gray-900">Categories</h3>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${categoryFilterOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {categoryFilterOpen && (
                  <div className="px-5 pb-5 space-y-2">
                    <button
                      onClick={() => { setSelectedCategory(null); setSelectedSubject(null); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        !selectedCategory
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => { setSelectedCategory(category.name); setSelectedSubject(null); }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === category.name
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {category.name}
                        <span className="float-right text-xs text-gray-500">
                          {pdfs.filter(p => p.categories?.name === category.name).length}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subject Filter */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setSubjectFilterOpen(!subjectFilterOpen)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedCategory ? selectedCategory : 'Subjects'}
                  </h3>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${subjectFilterOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {subjectFilterOpen && (
                  <div className="px-5 pb-5 space-y-2">
                    <button
                      onClick={() => setSelectedSubject(null)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        !selectedSubject
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      All Subjects
                    </button>
                    {availableSubjects.map((subjectName) => (
                      <button
                        key={subjectName}
                        onClick={() => setSelectedSubject(
                          selectedSubject === subjectName ? null : subjectName
                        )}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedSubject === subjectName
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {subjectName}
                        <span className="float-right text-xs text-gray-500">
                          {selectedCategory
                            ? pdfs.filter(p => p.categories?.name === selectedCategory && p.subjects?.name === subjectName).length
                            : pdfs.filter(p => p.subjects?.name === subjectName).length}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - PDF Grid */}
            <div className="lg:col-span-3">

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <SkeletonCard count={6} />
                </div>
              ) : (
                <>
                  {filteredPDFs.length === 0 ? (
                    <div className="text-center py-14">
                      <BookOpen className="mx-auto h-14 w-14 text-gray-300 mb-3" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        No PDFs Found
                      </h3>
                      <p className="text-gray-600">
                        Try adjusting your search or browse other subjects
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPDFs.map((pdf) => (
                    <Card key={pdf.id} className="group h-full overflow-hidden rounded-2xl border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300 flex flex-col bg-white hover:-translate-y-1">
                      <div className="relative aspect-[4/3] overflow-hidden" style={{ backgroundColor: '#E6F1EF' }}>
                        <Link to={`/pdf/${pdf.id}`} className="block h-full">
                          {pdf.card_image ? (
                            <img
                              src={pdf.card_image}
                              alt={pdf.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center">
                                <BookOpen className="text-primary/60 mx-auto" size={56} />
                                <p className="text-sm text-primary font-semibold mt-4 px-4">
                                  {pdf.subjects?.name || 'PDF'}
                                </p>
                              </div>
                            </div>
                          )}
                        </Link>
                        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                          <span className="px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm text-xs font-bold text-gray-800 shadow-md border border-gray-100">
                            {pdf.subjects?.name}
                          </span>
                          {pdf.is_premium && (
                            <span className="px-2 py-1.5 rounded-lg bg-gradient-to-r from-primary to-teal-600 text-[10px] font-extrabold text-white uppercase tracking-wide shadow-md">
                              Premium
                            </span>
                          )}
                        </div>
                        {pdf.is_featured && (
                          <div className="absolute top-3 right-3">
                            <div className="px-2 py-1 rounded-full bg-yellow-400 flex items-center gap-1 shadow-md">
                              <svg className="w-3 h-3 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-[10px] font-bold text-yellow-900">Featured</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Link to={`/pdf/${pdf.id}`} className="flex-1">
                            <h3 className="font-bold text-gray-900 line-clamp-2 text-base leading-snug group-hover:text-primary transition-colors">
                              {pdf.title}
                            </h3>
                          </Link>
                        </div>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-1 leading-relaxed">
                          {pdf.description ? `${pdf.description.substring(0, 80)}${pdf.description.length > 80 ? '...' : ''}` : 'High-quality study materials'}
                        </p>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 font-medium">
                              {pdf.categories?.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Download className="w-3 h-3" />
                              <span>{Math.floor(Math.random() * 400) + 50}</span>
                            </div>
                          </div>
                        </div>
                        <Link to={`/pdf/${pdf.id}`} className="w-full mt-auto">
                          <Button className="w-full font-bold text-sm h-10 bg-gradient-to-r from-primary to-teal-600 hover:from-teal-600 hover:to-primary shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 flex justify-between items-center px-4">
                            <span className="flex items-center gap-1.5">
                              Buy Now
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" size={14} />
                            </span>
                            <div className="flex items-center gap-1.5">
                              {pdf.original_price && pdf.original_price > pdf.price && (
                                <span className="text-[11px] font-medium text-white/75 line-through">
                                  ₹{pdf.original_price}
                                </span>
                              )}
                              <span className="text-sm font-extrabold text-[1.1rem]">₹{pdf.price || 0}</span>
                            </div>
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Features You'll Love
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Quality Assured',
                desc: 'Every PDF is reviewed and verified by our expert team for accuracy and quality'
              },
              {
                icon: TrendingUp,
                title: 'Always Updated',
                desc: 'Regularly updated content following the latest syllabus and exam patterns'
              },
              {
                icon: Download,
                title: 'Instant Access',
                desc: 'Download your materials instantly after purchase and start learning right away'
              }
            ].map((feature, idx) => (
              <Card key={idx} className="p-5 rounded-xl border border-gray-200 hover:border-primary transition-colors">
                <div className="inline-flex items-center justify-center w-11 h-11 mb-3 rounded-lg bg-primary/10 text-primary">
                  <feature.icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-3">
            Ready to Start Learning?
          </h2>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            Join thousands of students who have already improved their grades with our premium study materials
          </p>
          <Link to="/browse">
              <Button size="lg" className="text-lg px-10 py-4 bg-white" style={{ color: '#0E7562' }}>
              Browse All PDFs
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
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
              <p className="text-gray-500 text-xs italic">
                A HyDigit Product
              </p>
              <a href="https://pdfnotes.hydigit.net" className="text-gray-400 hover:text-primary text-xs mt-1 block">
                pdfnotes.hydigit.net
              </a>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white text-sm">All Subjects</Link></li>
                <li><Link to="/browse" className="text-gray-400 hover:text-white text-sm">Latest PDFs</Link></li>
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
              © {new Date().getFullYear()} PDFNotes. A HyDigit Product. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
