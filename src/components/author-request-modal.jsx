import { Award, Clock, FileText, GraduationCap, User, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';

export function AuthorRequestModal({ isOpen, onClose, userId }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    experience_years: '',
    qualification: '',
    subjects: '',
    reason: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Insert author request into database
      const { error } = await supabase.from('author_requests').insert([
        {
          user_id: userId,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          experience_years: parseInt(formData.experience_years) || 0,
          qualification: formData.qualification,
          subjects: formData.subjects.split(',').map(s => s.trim()),
          reason: formData.reason,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      // Send email notification about the author application
    try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        await fetch(`${backendUrl}/api/send-author-application-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            toEmail: formData.email,
            applicantName: formData.full_name,
            experience: formData.experience_years,
            qualification: formData.qualification,
            subjects: formData.subjects,
          }),
        });
      } catch (emailError) {

        // Don't fail the submission if email fails
      }

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          experience_years: '',
          qualification: '',
          subjects: '',
          reason: '',
        });
      }, 3000);
    } catch (error) {

      toast.error('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {submitted ? '✅ Request Submitted!' : 'Become an Author'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {submitted 
                ? 'Your application has been submitted and is under review.'
                : 'Share your knowledge with thousands of students'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Application Submitted!
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Thank you for your interest in becoming an author. Our team will review your application and get back to you within 24-48 hours.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <strong>Next Steps:</strong> You can check your application status anytime in your dashboard.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Benefits Section */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-teal-600" />
                  Why Become an Author?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Create & Sell PDFs</p>
                      <p className="text-sm text-gray-600">Upload your study materials and earn money</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Build Your Brand</p>
                      <p className="text-sm text-gray-600">Establish yourself as an expert educator</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Flexible Schedule</p>
                      <p className="text-sm text-gray-600">Work anytime, anywhere at your pace</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Help Students</p>
                      <p className="text-sm text-gray-600">Make a real impact on students' learning</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700">
                      Full Name *
                    </label>
                    <input
                      id="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      placeholder="+91 9876543210"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="experience_years" className="block text-sm font-semibold text-gray-700">
                      Years of Teaching Experience *
                    </label>
                    <input
                      id="experience_years"
                      type="number"
                      required
                      min="0"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      placeholder="3"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="qualification" className="block text-sm font-semibold text-gray-700">
                    Highest Qualification *
                  </label>
                  <input
                    id="qualification"
                    type="text"
                    required
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="B.Tech, M.Sc, PhD, etc."
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="subjects" className="block text-sm font-semibold text-gray-700">
                    Subjects You Can Teach (comma-separated) *
                  </label>
                  <input
                    id="subjects"
                    type="text"
                    required
                    value={formData.subjects}
                    onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="Mathematics, Physics, Chemistry"
                  />
                  <p className="text-xs text-gray-500">Separate subjects with commas</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="reason" className="block text-sm font-semibold text-gray-700">
                    Why do you want to become an author? *
                  </label>
                  <textarea
                    id="reason"
                    required
                    rows={4}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us about your passion for teaching and why you'd like to contribute..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        Submitting...
                      </span>
                    ) : (
                      'Submit Application'
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
