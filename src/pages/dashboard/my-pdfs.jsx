import { Edit, Eye, Search, ToggleLeft, ToggleRight, Trash2, Upload as UploadIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { SkeletonTable } from '../../components/ui/skeleton';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/utils';

export function MyPDFs() {
  usePageTitle('My PDFs');
  const [loading, setLoading] = useState(true);
  const [pdfs, setPdfs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingPDF, setEditingPDF] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category_id: '',
    subject_id: '',
    price: '',
    status: 'draft',
  });
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [newCardImage, setNewCardImage] = useState(null);
  const [cardImagePreview, setCardImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchPDFs();
    fetchCategories();
  }, []);

  const fetchPDFs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pdfs')
        .select('*, categories!left(name), subjects!pdfs_subject_id_fkey(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Generate signed URLs for preview images
      const pdfsWithPreviewUrls = await Promise.all(
        (data || []).map(async (pdf) => {
          if (pdf.preview_image_path) {
            try {
              const { data: signedUrlData } = await supabase.storage
                .from('pdfs')
                .createSignedUrl(pdf.preview_image_path, 300);
              return { ...pdf, preview_url: signedUrlData.signedUrl };
            } catch (error) {
              console.error('Error generating signed URL for preview:', error);
              return pdf;
            }
          }
          return pdf;
        })
      );
      
      setPdfs(pdfsWithPreviewUrls);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    } finally {
      setLoading(false);
    }
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
      console.error('Error fetching categories:', error);
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
      console.error('Error fetching subjects:', error);
    }
  };

  useEffect(() => {
    if (editForm.category_id) {
      fetchSubjects(editForm.category_id);
    } else {
      setSubjects([]);
      setEditForm(prev => ({ ...prev, subject_id: '' }));
    }
  }, [editForm.category_id]);

  const toggleStatus = async (pdfId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      const { error } = await supabase
        .from('pdfs')
        .update({ status: newStatus })
        .eq('id', pdfId);

      if (error) throw error;
      fetchPDFs();
    } catch (error) {
      console.error('Error updating PDF status:', error);
      toast.error('Error updating status');
    }
  };

  const deletePDF = async (pdfId) => {
    if (!confirm('Are you sure you want to delete this PDF?')) return;

    try {
      const { error } = await supabase.from('pdfs').delete().eq('id', pdfId);

      if (error) throw error;
      fetchPDFs();
    } catch (error) {
      console.error('Error deleting PDF:', error);
      toast.error('Error deleting PDF');
    }
  };

  const handleCardImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewCardImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCardImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (pdf) => {
    setEditingPDF(pdf);
    setEditForm({
      title: pdf.title,
      description: pdf.description || '',
      category_id: pdf.category_id || '',
      subject_id: pdf.subject_id || '',
      price: pdf.price || 0,
      status: pdf.status || 'draft',
    });
    setCardImagePreview(pdf.preview_url || null);
    setNewCardImage(null);
    if (pdf.category_id) {
      fetchSubjects(pdf.category_id);
    }
    setShowEditModal(true);
  };

  const uploadPreviewImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `previews/${fileName}`;

    setUploadingImage(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;
      return filePath;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdatePDF = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let updateData = {
        title: editForm.title,
        description: editForm.description,
        category_id: editForm.category_id,
        subject_id: editForm.subject_id,
        price: parseFloat(editForm.price) || 0,
        status: editForm.status,
      };

      // Upload new preview image if selected
      if (newCardImage) {
        const newPreviewPath = await uploadPreviewImage(newCardImage);
        updateData.preview_image_path = newPreviewPath;
      }

      const { error } = await supabase
        .from('pdfs')
        .update(updateData)
        .eq('id', editingPDF.id);

      if (error) throw error;
      await fetchPDFs();
      setShowEditModal(false);
      setEditingPDF(null);
      setNewCardImage(null);
      setCardImagePreview(null);
      toast.success('PDF updated successfully!');
    } catch (error) {
      console.error('Error updating PDF:', error);
      toast.error('Error updating PDF. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPDFs = pdfs.filter((pdf) => {
    const matchesSearch = pdf.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || pdf.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="My PDFs">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search PDFs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* PDFs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {filteredPDFs.length} PDF{filteredPDFs.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonTable rows={8} columns={8} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Preview</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Title</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Subject</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Price</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Views</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Sales</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPDFs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-gray-500">
                          No PDFs found
                        </td>
                      </tr>
                    ) : (
                      filteredPDFs.map((pdf) => (
                        <tr key={pdf.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            {pdf.preview_url ? (
                              <img
                                src={pdf.preview_url}
                                alt={pdf.title}
                                className="h-12 w-16 object-cover rounded"
                              />
                            ) : (
                              <div className="h-12 w-16 bg-gray-200 rounded flex items-center justify-center">
                                <Eye size={20} className="text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-sm">{pdf.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(pdf.created_at).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {pdf.categories?.name || '-'}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {pdf.subjects?.name || '-'}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium">
                            ₹{pdf.price || 0}
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant={pdf.status === 'published' ? 'success' : 'warning'}
                            >
                              {pdf.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {pdf.views || 0}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {pdf.sales || 0}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toggleStatus(pdf.id, pdf.status)}
                                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                title={pdf.status === 'published' ? 'Unpublish' : 'Publish'}
                              >
                                {pdf.status === 'published' ? (
                                  <ToggleRight size={18} className="text-green-600" />
                                ) : (
                                  <ToggleLeft size={18} className="text-gray-400" />
                                )}
                              </button>
                              <button
                                onClick={() => handleEdit(pdf)}
                                className="p-2 hover:bg-blue-100 rounded-md transition-colors"
                                title="Edit"
                              >
                                <Edit size={18} className="text-blue-600" />
                              </button>
                              <button
                                onClick={() => deletePDF(pdf.id)}
                                className="p-2 hover:bg-red-100 rounded-md transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} className="text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit PDF Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <h3 className="text-xl font-bold text-gray-900">Edit PDF</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPDF(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdatePDF} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preview Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {cardImagePreview ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <img
                            src={cardImagePreview}
                            alt="Card preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setNewCardImage(null);
                              setCardImagePreview(editingPDF?.preview_url || null);
                            }}
                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:bg-gray-100"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <label className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                          <UploadIcon size={18} />
                          <span className="text-sm font-medium">Change Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCardImageChange}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
                        <UploadIcon className="h-10 w-10 text-gray-400" />
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
                          onChange={handleCardImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <Input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={editForm.category_id}
                    onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value, subject_id: '' })}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <select
                    value={editForm.subject_id}
                    onChange={(e) => setEditForm({ ...editForm, subject_id: e.target.value })}
                    disabled={!editForm.category_id}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="draft"
                        checked={editForm.status === 'draft'}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Draft</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="published"
                        checked={editForm.status === 'published'}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Published</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="submit"
                    variant="default"
                    disabled={saving || uploadingImage}
                    className="flex-1"
                  >
                    {saving ? 'Saving...' : uploadingImage ? 'Uploading Image...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPDF(null);
                      setNewCardImage(null);
                      setCardImagePreview(null);
                    }}
                    disabled={saving || uploadingImage}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
