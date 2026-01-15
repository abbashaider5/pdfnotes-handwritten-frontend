import { File, Upload as UploadIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/utils';

export function UploadPDF() {
  usePageTitle('Upload PDF');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
  const [userId, setUserId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewImageFile, setPreviewImageFile] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subject: '',
    price: '',
    status: 'draft',
  });

  useEffect(() => {
    fetchCategories();
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (formData.category) {
      fetchSubjects(formData.category);
    } else {
      setSubjects([]);
      setFormData(prev => ({ ...prev, subject: '' }));
    }
  }, [formData.category]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('enabled', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {

    }
  };

  const fetchSubjects = async (categoryId) => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('category_id', categoryId)
        .eq('enabled', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {

    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      toast.error('Please upload a PDF file');
    }
  };

  const handlePreviewImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to sanitize filename
  const sanitizeFileName = (fileName) => {
    // Get filename without extension
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const ext = fileName.split('.').pop().toLowerCase();
    
    // Convert to lowercase
    let sanitized = nameWithoutExt.toLowerCase();
    
    // Replace spaces with hyphens
    sanitized = sanitized.replace(/\s+/g, '-');
    
    // Remove special characters except hyphens and alphanumeric
    sanitized = sanitized.replace(/[^a-z0-9-]/g, '');
    
    // Remove multiple consecutive hyphens
    sanitized = sanitized.replace(/-+/g, '-');
    
    // Remove leading/trailing hyphens
    sanitized = sanitized.replace(/^-+|-+$/g, '');
    
    // Return with extension
    return `${sanitized}.${ext}`;
  };

  const uploadFile = async (file, folder) => {
    const timestamp = Date.now();
    const sanitizedOriginalName = sanitizeFileName(file.name);
    const fileName = `${timestamp}_${sanitizedOriginalName}`;
    // Store directly in bucket root, not in 'pdfs' folder
    const filePath = fileName;

    setPdfUploading(true);
    setPdfUploadProgress(0);


    const { data, error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          setPdfUploadProgress(Math.round(percent));
        },
      });

    setPdfUploading(false);

    if (uploadError) {

      throw uploadError;
    }

    return filePath;
  };

  const uploadPreviewImage = async (file) => {
    const timestamp = Date.now();
    const sanitizedOriginalName = sanitizeFileName(file.name);
    const fileName = `${timestamp}_${sanitizedOriginalName}`;
    // Store directly in bucket root, not in 'previews' folder
    const filePath = fileName;

    setUploadStatus('Uploading preview image...');
    setUploadProgress(0);


    const { data, error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          setUploadProgress(Math.round(percent));
        },
      });

    if (uploadError) {

      throw uploadError;
    }

    return filePath;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setShowOverlay(true);

    try {
      let pdfUrl = '';
      let previewImagePath = '';

      if (pdfFile) {
        pdfUrl = await uploadFile(pdfFile, 'pdfs');
      }

      if (previewImageFile) {
        previewImagePath = await uploadPreviewImage(previewImageFile);
      }

      setUploadStatus('Saving to database...');

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const pdfData = {
        title: formData.title,
        description: formData.description,
        category_id: formData.category,
        subject_id: formData.subject,
        price: parseFloat(formData.price) || 0,
        status: formData.status,
        pdf_url: pdfUrl,
        preview_image_path: previewImagePath || null,
        author_id: userId,
      };


      const { error, data: insertedData } = await supabase.from('pdfs').insert([pdfData]).select();

      if (error) {

        throw error;
      }


      setUploadProgress(100);
      setUploadStatus('Upload complete!');
      
      setTimeout(() => {
        setShowOverlay(false);
        setUploadStatus('PDF uploaded successfully!');
        setTimeout(() => {
          resetForm();
          setUploadProgress(0);
          setUploadStatus('');
        }, 2000);
      }, 500);
    } catch (error) {

      setShowOverlay(false);
      setUploadStatus(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      subject: '',
      price: '',
      status: 'draft',
    });
    setPdfFile(null);
    setPreviewImageFile(null);
    setPreviewImage(null);
  };

  return (
    <DashboardLayout title="Upload PDF">
      {/* Professional Loading Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center transform transition-all">
            <div className="mx-auto mb-6">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-primary to-teal-600 rounded-full flex items-center justify-center">
                  <UploadIcon className="text-white" size={28} />
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Please Wait...
            </h3>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              Processing and uploading PDF...
            </p>
            {uploading && (
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-teal-600 h-3 rounded-full transition-all duration-300 ease-out relative"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-primary">
                  {uploadProgress}% Complete
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="w-full mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload New PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PDF File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PDF File
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-primary'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {pdfFile ? (
                    <div className="space-y-4 max-w-md mx-auto">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <File className="text-red-600" size={20} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">{pdfFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPdfFile(null)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      
                      {/* PDF Upload Progress Bar */}
                      {pdfUploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Uploading PDF...</span>
                            <span className="font-semibold text-primary">{pdfUploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out relative"
                              style={{ width: `${pdfUploadProgress}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary animate-pulse" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Drag and drop your PDF here, or{' '}
                        <label className="text-primary cursor-pointer hover:underline">
                          browse
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => handleFile(e.target.files[0])}
                          />
                        </label>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF files up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview Image (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {previewImage ? (
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImageFile(null);
                          setPreviewImage(null);
                        }}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
                      <UploadIcon className="h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        Upload preview image
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended: 16:9 aspect ratio (jpg/png)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePreviewImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter PDF title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter PDF description"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value,
                      subject: '',
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  disabled={!formData.category}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="draft"
                      checked={formData.status === 'draft'}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Draft</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="published"
                      checked={formData.status === 'published'}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">Published</span>
                  </label>
                </div>
              </div>

              {/* Upload Status Message */}
              {uploadStatus && (
                <div className={`p-4 rounded-lg ${
                  uploadStatus.includes('successfully') || uploadStatus.includes('complete')
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : uploadStatus.includes('failed') || uploadStatus.includes('Error')
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  <p className="text-sm font-medium">{uploadStatus}</p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  variant="default"
                  disabled={uploading || !pdfFile || !formData.title || !formData.category || !formData.subject}
                  className="flex-1"
                >
                  {uploading ? 'Uploading...' : formData.status === 'published' ? 'Publish' : 'Save as Draft'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={uploading}
                >
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
