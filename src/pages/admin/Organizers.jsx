import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { Search, ShieldAlert, Star, Building, Plus, X, Edit2, Trash2 } from 'lucide-react';

export const AdminOrganizers = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', department: '', organizationName: ''
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchOrganizers = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getOrganizersList();
      setOrganizers(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', department: '', organizationName: '' });
  };

  const handleEdit = (org) => {
    setFormData({ 
      name: org.name, 
      email: org.email, 
      password: '', 
      department: org.department, 
      organizationName: org.organizationName || org.organization 
    });
    setEditingId(org.id);
    setShowModal(true);
  };

  const confirmDelete = (id) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    setCreating(true);
    try {
      await analyticsService.deleteOrganizer(deletingId);
      setShowDeleteModal(false);
      setDeletingId(null);
      await fetchOrganizers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete organizer');
    } finally {
      setCreating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      if (editingId) {
        await analyticsService.updateOrganizer(editingId, formData);
      } else {
        await analyticsService.createOrganizer(formData);
      }
      closeModal();
      await fetchOrganizers();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} organizer`);
    } finally {
      setCreating(false);
    }
  };

  const filteredOrganizers = organizers.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.organization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#172033]">Organizers Registry</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Review active coordinators, rating scores, and total events generated.</p>
        </div>
        <button
          onClick={() => { closeModal(); setShowModal(true); }}
          className="px-4 py-2 bg-[#FF5A1F] hover:bg-[#E94712] text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus size={15} /> Create Organizer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search coordinator or organization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5A1F] transition-colors"
        />
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(n => <div key={n} className="h-12 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl animate-pulse"></div>)}
        </div>
      ) : filteredOrganizers.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-[#E2E8F0] rounded-2xl bg-[#FFFFFF] shadow-xs">
          <ShieldAlert size={22} className="mx-auto text-[#94A3B8]" />
          <h3 className="text-sm font-semibold text-[#172033]">No organizers found</h3>
        </div>
      ) : (
        <div className="border border-[#E2E8F0] bg-[#FFFFFF] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                  <th className="px-5 py-3.5">Coordinator Name</th>
                  <th className="px-5 py-3.5">Faculty Department</th>
                  <th className="px-5 py-3.5">Affiliated Branch / Club</th>
                  <th className="px-5 py-3.5">Events Created</th>
                  <th className="px-5 py-3.5 text-right">Student Rating</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredOrganizers.map(o => (
                  <tr key={o.id} className="hover:bg-[#F8FAFC] text-[#172033] transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-xs text-[#172033]">{o.name}</td>
                    <td className="px-5 py-3.5 text-[#64748B]">{o.department}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-[#FF5A1F]">
                        <Building size={12} className="text-[#94A3B8]" />
                        <span>{o.organization}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#172033]">{o.eventsCount} events</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 font-bold text-[#D97706]">
                        <Star size={12} fill="currentColor" />
                        <span>{o.rating}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(o)} className="text-[#64748B] hover:text-[#172033] cursor-pointer" title="Edit Organizer">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => confirmDelete(o.id)} className="text-[#64748B] hover:text-[#DC2626] cursor-pointer" title="Delete Organizer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Organizer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/30 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 rounded-2xl w-full max-w-md shadow-xl relative">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#172033] cursor-pointer"
            >
              <X size={15} />
            </button>
            
            <h2 className="text-lg font-bold text-[#172033] mb-4">{editingId ? 'Edit Organizer' : 'Create New Organizer'}</h2>
            {error && <div className="mb-4 p-2 bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] rounded-lg text-xs">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[#64748B] font-bold block mb-1 uppercase tracking-wider text-[10px]">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]" />
              </div>
              <div>
                <label className="text-[#64748B] font-bold block mb-1 uppercase tracking-wider text-[10px]">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]" />
              </div>
              <div>
                <label className="text-[#64748B] font-bold block mb-1 uppercase tracking-wider text-[10px]">Password {editingId && '(Leave blank to keep current)'}</label>
                <input required={!editingId} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#64748B] font-bold block mb-1 uppercase tracking-wider text-[10px]">Department</label>
                  <input required type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]" />
                </div>
                <div>
                  <label className="text-[#64748B] font-bold block mb-1 uppercase tracking-wider text-[10px]">Organization</label>
                  <input required type="text" value={formData.organizationName} onChange={e => setFormData({...formData, organizationName: e.target.value})} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#FF5A1F]" />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2 bg-[#FF5A1F] hover:bg-[#E94712] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer mt-2"
              >
                {creating ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Organizer' : 'Create Organizer Account')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/30 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 rounded-2xl w-full max-w-sm shadow-xl relative text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-[#FEE2E2] text-[#DC2626] rounded-full flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h2 className="text-lg font-bold text-[#172033]">Delete Organizer?</h2>
            <p className="text-xs text-[#64748B]">This action cannot be undone. This organizer will lose access to the platform.</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 px-4 bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#172033] border border-[#E2E8F0] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={creating}
                className="flex-1 py-2 px-4 bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {creating ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default AdminOrganizers;
