'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { User, ShieldHalf, Building2, LogOut, Mail, Phone, MapPin, Loader2, Users, Trash2, Plus, X, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// --- TYPES ---
type Staff = {
  id: string;
  staffId?: string;
  name: string;
  role: string;
  department: string;
  qualification: string;
  contact: string;
  email: string;
  address: string;
  dateOfJoining: string;
  shiftTiming: string;
  experience: string;
  salary: string;
  emergencyContact: string;
};

const emptyStaffForm: Staff = {
    id: '', name: '', role: 'Nurse', department: '', qualification: '', contact: '', 
    email: '', address: '', dateOfJoining: '', shiftTiming: '', experience: '', salary: '', emergencyContact: ''
};

// --- MAIN COMPONENT ---
export default function ProfilePage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  
  // --- FETCH REAL PROFILE DATA ---
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    },
    retry: false, 
  });

  if (error) {
    router.push('/auth/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    toast.success('You have been logged out.');
    router.push('/');
  };

  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  const renderProfileDetails = () => {
    if (!userData) return null;
    const details = userData.details || {};

    switch (userData.role) {
      case 'hospital':
        return (
          <>
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2">Hospital Details</h3>
              <ProfileDetail icon={<Building2 />} label="Hospital Name" value={details.hospitalName || userData.name} />
              <ProfileDetail icon={<ShieldHalf />} label="Registration No." value={details.registrationNumber || 'N/A'} />
              <ProfileDetail icon={<Mail />} label="Admin Email" value={details.administratorEmail || userData.email} />
              <ProfileDetail icon={<Phone />} label="Admin Contact" value={details.adminContact || 'N/A'} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button onClick={() => router.push('/hospital')} className="p-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex justify-center items-center">
                    <Building2 className="w-4 h-4 mr-2"/> Go to Dashboard
                </button>
                <button onClick={() => setIsStaffModalOpen(true)} className="p-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex justify-center items-center">
                    <Users className="w-4 h-4 mr-2"/> Manage Staff
                </button>
            </div>
          </>
        );
      case 'worker':
        return (
          <>
             <div className="mb-6 bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="font-bold text-green-900 mb-2">Worker Details</h3>
              <ProfileDetail icon={<User />} label="Full Name" value={details.name || userData.name} />
              <ProfileDetail icon={<Phone />} label="Mobile Number" value={userData.mobile} />
              <ProfileDetail icon={<ShieldHalf />} label="Aadhaar Number" value={details.aadhaarNumber || 'N/A'} />
            </div>
            <button onClick={() => router.push('/worker')} className="w-full p-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
                View Health Card
            </button>
          </>
        );
      case 'gov':
        return (
          <>
            <div className="mb-6 bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="font-bold text-purple-900 mb-2">Official Details</h3>
              <ProfileDetail icon={<Mail />} label="Official Email" value={userData.email} />
              <ProfileDetail icon={<ShieldHalf />} label="Employee ID" value={details.employeeId || 'N/A'} />
              <ProfileDetail icon={<Building2 />} label="Dept Code" value={details.verificationCode || 'N/A'} />
            </div>
            <button onClick={() => router.push('/gov')} className="w-full p-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition">
                Open Admin Portal
            </button>
          </>
        );
      default:
        return <p>Unknown Role</p>;
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
        <div className="mb-6 border-b pb-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
              <p className="text-sm text-gray-500">Manage your account settings</p>
            </div>
            {/* Only show log out if not in Navbar, but for safety we keep it accessible */}
        </div>
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center mb-4 text-3xl font-bold border-4 border-white shadow-sm">
               {getInitials(userData?.name)}
          </div>
          <div className="text-center w-full">
            <h2 className="text-xl font-bold text-gray-900">{userData?.name}</h2>
            <p className="text-sm text-gray-500 capitalize mb-6">
                {userData?.role === 'gov' ? 'Government Official' : userData?.role === 'hospital' ? 'Hospital Administrator' : 'Migrant Worker'}
            </p>
            <div className="text-left w-full">{renderProfileDetails()}</div>
          </div>
        </div>
      </div>
      {userData?.role === 'hospital' && <ManageStaffModal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} />}
    </div>
  );
}

function ProfileDetail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string; }) {
  return (
    <div className="flex items-center p-3 border-b border-gray-200/50 last:border-0">
      <div className="flex-shrink-0 w-8 text-gray-400">{icon}</div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

// --- STAFF MANAGEMENT MODAL ---
function ManageStaffModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const queryClient = useQueryClient();
    const [view, setView] = useState<'list' | 'form'>('list');
    const [formData, setFormData] = useState<Staff>(emptyStaffForm);
    const [isEditing, setIsEditing] = useState(false);

    // Fetch Staff
    const { data: staffList = [], isLoading } = useQuery({
        queryKey: ['staff'],
        queryFn: async () => (await api.get('/hospital/staff')).data
    });

    // Mutations
    const addMutation = useMutation({
        mutationFn: (data: Staff) => api.post('/hospital/staff', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            toast.success('Staff added successfully!');
            setView('list');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: Staff) => api.put(`/hospital/staff/${data.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            toast.success('Staff updated successfully!');
            setView('list');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/hospital/staff/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            toast.success('Staff deleted.');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            updateMutation.mutate(formData);
        } else {
            // Remove 'id' for new creation
            const { id, ...dataToSend } = formData;
            addMutation.mutate(dataToSend as Staff);
        }
    };

    const handleEdit = (staff: Staff) => {
        setFormData(staff);
        setIsEditing(true);
        setView('form');
    };

    const handleAddNew = () => {
        setFormData(emptyStaffForm);
        setIsEditing(false);
        setView('form');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h2 className="text-xl font-bold text-gray-800">
                        {view === 'list' ? 'Hospital Staff Directory' : (isEditing ? 'Edit Staff Details' : 'Add New Staff')}
                    </h2>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-500 hover:text-gray-800" /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {view === 'list' ? (
                        <>
                            <div className="flex justify-end mb-4">
                                <button onClick={handleAddNew} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                                    <Plus className="w-4 h-4 mr-2" /> Add Staff
                                </button>
                            </div>
                            {isLoading ? <div className="text-center py-4">Loading...</div> : (
                                <div className="grid gap-4">
                                    {staffList.length === 0 ? <p className="text-center text-gray-500">No staff found.</p> : 
                                     staffList.map((staff: Staff) => (
                                        <div key={staff.id} className="border p-4 rounded-lg flex justify-between items-center hover:shadow-md transition bg-white">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-lg">{staff.name}</h3>
                                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded border">{staff.staffId}</span>
                                                </div>
                                                <p className="text-sm text-blue-600 font-medium">{staff.role}</p>
                                                <p className="text-xs text-gray-500">{staff.email} • {staff.contact}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleEdit(staff)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="View/Edit">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => deleteMutation.mutate(staff.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Delete">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 bg-blue-50 p-3 rounded text-sm text-blue-800 border border-blue-100 mb-2">
                                Staff ID will be auto-generated based on the role (e.g. Nurse: CGC123, Doctor: CGC@321)
                            </div>
                            
                            <input placeholder="Full Name" className="p-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            <select className="p-2 border rounded" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required>
                                <option>Nurse</option>
                                <option>Doctor</option>
                                <option>Lab Technician</option>
                                <option>Pharmacist</option>
                                <option>Admin Staff</option>
                            </select>
                            <input placeholder="Department" className="p-2 border rounded" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                            <input placeholder="Qualification" className="p-2 border rounded" value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} />
                            <input placeholder="Contact Number" type="tel" className="p-2 border rounded" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} required />
                            <input placeholder="Email" type="email" className="p-2 border rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            <input placeholder="Date of Joining" type="date" className="p-2 border rounded" value={formData.dateOfJoining} onChange={e => setFormData({...formData, dateOfJoining: e.target.value})} />
                            <input placeholder="Shift Timing (e.g. 9AM - 5PM)" className="p-2 border rounded" value={formData.shiftTiming} onChange={e => setFormData({...formData, shiftTiming: e.target.value})} />
                            <input placeholder="Experience (e.g. 5 years)" className="p-2 border rounded" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} />
                            <input placeholder="Salary" className="p-2 border rounded" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} />
                            <input placeholder="Emergency Contact" className="p-2 border rounded" value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} />
                            <textarea placeholder="Address" className="md:col-span-2 p-2 border rounded h-20" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />

                            <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                                <button type="button" onClick={() => setView('list')} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">
                                    {isEditing ? 'Update Staff' : 'Save Staff'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}