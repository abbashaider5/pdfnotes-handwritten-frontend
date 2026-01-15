import { Edit, GripVertical, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '../../components/dashboard/dashboard-layout';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { SkeletonList } from '../../components/ui/skeleton';
import { supabase } from '../../lib/supabase';
import { usePageTitle } from '../../lib/utils';

export function Subjects() {
  usePageTitle('Subjects');
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubjects(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('enabled', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
      if (data && data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {

    }
  };

  const fetchSubjects = async (categoryId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('category_id', categoryId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        const { error } = await supabase
          .from('subjects')
          .update({
            name: formData.name,
            description: formData.description,
          })
          .eq('id', editingSubject.id);

        if (error) throw error;
      } else {
        const maxOrder = subjects.reduce((max, s) => Math.max(max, s.order_index || 0), 0);
        const { error } = await supabase.from('subjects').insert([
          {
            name: formData.name,
            description: formData.description,
            category_id: selectedCategory,
            order_index: maxOrder + 1,
            enabled: true,
          },
        ]);

        if (error) throw error;
      }

      resetForm();
      fetchSubjects(selectedCategory);
    } catch (error) {

      toast.error('Error saving subject');
    }
  };

  const editSubject = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || '',
    });
    setShowForm(true);
  };

  const deleteSubject = async (subjectId) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);

      if (error) throw error;
      fetchSubjects(selectedCategory);
    } catch (error) {

      toast.error('Error deleting subject');
    }
  };

  const toggleEnabled = async (subjectId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ enabled: !currentStatus })
        .eq('id', subjectId);

      if (error) throw error;
      fetchSubjects(selectedCategory);
    } catch (error) {

    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingSubject(null);
    setShowForm(false);
  };

  return (
    <DashboardLayout title="Subjects">
      <div className="space-y-6 max-full mx-auto">
        {/* Category Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-4 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Subject name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Subject description"
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="default">
                    {editingSubject ? 'Update' : 'Add'} Subject
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Subjects List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subjects</CardTitle>
            {!showForm && selectedCategory && (
              <Button onClick={() => setShowForm(true)} variant="default">
                <Plus size={16} className="mr-2" />
                Add Subject
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedCategory ? (
              <div className="text-center py-12 text-gray-500">
                Please select a category first
              </div>
            ) : loading ? (
              <SkeletonList count={5} />
            ) : subjects.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No subjects created yet for this category
              </div>
            ) : (
              <div className="space-y-3">
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <GripVertical className="text-gray-400 cursor-grab" size={20} />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{subject.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {subject.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={subject.enabled ? 'success' : 'secondary'}>
                        {subject.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <button
                        onClick={() => toggleEnabled(subject.id, subject.enabled)}
                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        title={subject.enabled ? 'Disable' : 'Enable'}
                      >
                        {subject.enabled ? (
                          <ToggleRight size={18} className="text-green-600" />
                        ) : (
                          <ToggleLeft size={18} className="text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => editSubject(subject)}
                        className="p-2 hover:bg-blue-100 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => deleteSubject(subject.id)}
                        className="p-2 hover:bg-red-100 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
