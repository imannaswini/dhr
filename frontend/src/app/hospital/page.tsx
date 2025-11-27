'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { UserPlus, ListOrdered, Bell, Search, Download, Edit, Printer, X, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 
import api from '@/lib/api'; 

// --- TYPES ---
type Worker = {
  id: string;
  workerId: string; // Add the new custom ID field
  name: string;
  registeredOn: string;
  dob: string;
  gender: string;
  contact: string;
  homeState: string;
  idType: string;
  idNumber: string;
  hospitalName: string; // Add hospital name field
  [key: string]: any; 
};

type Alert = {
  id: number;
  title: string;
  date: string;
  severity: 'Urgent' | 'Informational' | 'Critical';
  content: string;
};

type ValidationData = {
  name: string;
  dob: string;
  contact: string;
  idNumber: string;
  [key: string]: string | number | undefined;
};

const defaultFormState = { name: '', dob: '', gender: 'Male', contact: '', homeState: '', idType: 'Aadhaar', idNumber: '' };

export default function HospitalDashboardPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('recent');
  const [formData, setFormData] = useState(defaultFormState);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal States
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [deletingWorker, setDeletingWorker] = useState<Worker | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [newlyRegisteredWorker, setNewlyRegisteredWorker] = useState<Worker | null>(null);

  const ITEMS_PER_PAGE = 5;

  // --- 1. QUERIES (Fetch Data) ---

  // Fetch Logged-in Hospital Profile
  const { data: hospitalProfile } = useQuery({
    queryKey: ['hospitalProfile'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data;
    },
  });

  // Fetch Workers List
  const { data: allRegistrations = [], isLoading: isLoadingWorkers } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const response = await api.get('/hospital/workers');
      return response.data;
    },
  });

  // Fetch Health Alerts
  const { data: healthAlerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await api.get('/hospital/alerts');
      return response.data;
    },
  });

  // --- 2. MUTATIONS (Modify Data) ---

  const registerMutation = useMutation({
    mutationFn: async (newWorkerData: any) => {
      return await api.post('/hospital/workers', newWorkerData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workers'] }); 
      toast.success(`${formData.name} successfully registered!`);
      setNewlyRegisteredWorker(data.data); 
      setIsIdCardModalOpen(true);
      setFormData(defaultFormState);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Registration failed.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Worker) => {
      return await api.put(`/hospital/workers/${updatedData.id}`, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setIsEditModalOpen(false);
      toast.success('Worker details updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update worker.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (workerId: string) => {
      return await api.delete(`/hospital/workers/${workerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      setIsDeleteModalOpen(false);
      toast.success('Record deleted successfully.');
      setDeletingWorker(null);
    },
    onError: () => {
      toast.error('Failed to delete record.');
    }
  });

  // --- HELPER FUNCTIONS ---

  const validateForm = (data: ValidationData) => {
    const errors: { [key: string]: string } = {};
    if (!data.name.trim()) errors.name = "Name is required.";
    if (!data.dob) errors.dob = "Date of Birth is required.";
    if (!/^\d{10}$/.test(data.contact)) errors.contact = "Must be a 10-digit number.";
    if (!data.idNumber.trim()) errors.idNumber = "ID Number is required.";
    return errors;
  };

  const filteredWorkers = useMemo(() =>
    allRegistrations.filter((worker: Worker) =>
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (worker.workerId && worker.workerId.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [allRegistrations, searchTerm]);

  const paginatedWorkers = useMemo(() =>
    filteredWorkers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filteredWorkers, currentPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors in the form.');
      return;
    }
    
    // Send hospital name to backend so it can generate initials
    const payload = {
        ...formData,
        registeredOn: new Date().toISOString().split('T')[0],
        hospitalName: hospitalProfile?.name || 'Unknown Hospital'
    };

    registerMutation.mutate(payload);
  };

  const handleExportCSV = () => {
    const headers = "Worker ID,Name,Registered On,Date of Birth,Gender,Contact,Home State,ID Type,ID Number\n";
    const csvContent = filteredWorkers.map((w: Worker) => `${w.workerId || w.id},${w.name},${w.registeredOn},${w.dob},${w.gender},${w.contact},${w.homeState},${w.idType},${w.idNumber}`).join("\n");
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `registrations_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast.success("Data exported to CSV!");
  };

  const handleViewProfile = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsProfileModalOpen(true);
  };

  const handleOpenEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setIsEditModalOpen(true);
  };

  const handleUpdateWorker = (updatedWorker: Worker) => {
    updateMutation.mutate(updatedWorker);
  };

  const handleOpenDeleteModal = (worker: Worker) => {
    setDeletingWorker(worker);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingWorker) return;
    deleteMutation.mutate(deletingWorker.id);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'register':
        return (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`w-full p-2 border rounded-lg mt-1 ${formErrors.name ? 'border-red-500' : ''}`} />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Date of Birth</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className={`w-full p-2 border rounded-lg mt-1 ${formErrors.dob ? 'border-red-500' : ''}`} />
                {formErrors.dob && <p className="text-red-500 text-xs mt-1">{formErrors.dob}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-2 border rounded-lg mt-1"><option>Male</option><option>Female</option><option>Other</option></select>
              </div>
              <div>
                <label className="text-sm font-medium">Contact Number</label>
                <input type="tel" name="contact" value={formData.contact} onChange={handleInputChange} className={`w-full p-2 border rounded-lg mt-1 ${formErrors.contact ? 'border-red-500' : ''}`} />
                {formErrors.contact && <p className="text-red-500 text-xs mt-1">{formErrors.contact}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Home State</label>
                <input type="text" name="homeState" value={formData.homeState} onChange={handleInputChange} className="w-full p-2 border rounded-lg mt-1" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">ID Proof</label>
                <div className="flex gap-2 mt-1">
                  <select name="idType" value={formData.idType} onChange={handleInputChange} className="p-2 border rounded-lg"><option>Aadhaar</option><option>Voter ID</option><option>Passport</option></select>
                  <div className="flex-grow">
                    <input type="text" name="idNumber" value={formData.idNumber} onChange={handleInputChange} placeholder="ID Number" className={`w-full p-2 border rounded-lg ${formErrors.idNumber ? 'border-red-500' : ''}`} />
                    {formErrors.idNumber && <p className="text-red-500 text-xs mt-1">{formErrors.idNumber}</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={registerMutation.isPending} 
                className="flex items-center bg-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                {registerMutation.isPending ? 'Submitting...' : 'Register Worker'}
              </button>
            </div>
          </form>
        );
      case 'recent':
        if (isLoadingWorkers) return <div className="p-8 text-center text-gray-500">Loading workers...</div>;
        
        return (
          <div className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
              </div>
              <button onClick={handleExportCSV} className="flex items-center bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto"><Download className="w-5 h-5 mr-2" />Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-gray-100"><th className="p-3 font-semibold">Worker ID</th><th className="p-3 font-semibold">Name</th><th className="p-3 font-semibold">Registered On</th><th className="p-3 font-semibold">Contact</th><th className="p-3 font-semibold">Actions</th></tr></thead>
                <tbody>
                  {paginatedWorkers.map((worker: Worker) => (
                    <tr key={worker.id} className="border-b hover:bg-gray-50">
                      {/* Display Custom ID if available, else fallback to system ID */}
                      <td className="p-3 font-medium text-blue-700">{worker.workerId || worker.id}</td>
                      <td className="p-3">{worker.name}</td>
                      <td className="p-3">{worker.registeredOn}</td>
                      <td className="p-3">{worker.contact}</td>
                      <td className="p-3 flex items-center gap-2 flex-wrap">
                        <button onClick={() => handleViewProfile(worker)} className="text-blue-600 hover:underline font-medium">View</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => handleOpenEditModal(worker)} className="text-green-600 hover:underline font-medium">Edit</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => handleOpenDeleteModal(worker)} className="text-red-600 hover:underline font-medium">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalItems={filteredWorkers.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
          </div>
        );
      case 'alerts':
        return (
          <div className="p-4 space-y-4">
            {healthAlerts.length === 0 && <p className="text-gray-500">No active alerts.</p>}
            {healthAlerts.map((alert: Alert) => (
              <div key={alert.id} className={`border-l-4 p-4 rounded-r-lg ${alert.severity === 'Urgent' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'}`}>
                <div className="flex justify-between items-center"><h4 className="font-bold text-lg">{alert.title}</h4><span className="text-sm text-gray-600">{alert.date}</span></div>
                <p className="mt-2 text-gray-700">{alert.content}</p>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <Toaster position="top-center" />
      <div className="container mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Hospital Portal</h1>
          <p className="text-gray-500 mt-1">
            Welcome, {hospitalProfile?.name || 'Loading...'} | {new Date().toDateString()}
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon={<UserPlus className="w-8 h-8 text-green-500" />} title="Today's Registrations" value={allRegistrations.filter((w: Worker) => w.registeredOn === new Date().toISOString().split('T')[0]).length.toString()} />
          <StatCard icon={<ListOrdered className="w-8 h-8 text-blue-500" />} title="Total Registrations" value={allRegistrations.length.toString()} />
          <StatCard icon={<Bell className="w-8 h-8 text-red-500" />} title="Active Alerts" value={healthAlerts.filter((a: Alert) => a.severity === 'Urgent').length.toString()} />
        </div>
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b"><nav className="flex space-x-2 p-2"><TabButton icon={<ListOrdered />} label="Registrations" isActive={activeTab === 'recent'} onClick={() => setActiveTab('recent')} /><TabButton icon={<UserPlus />} label="New Registration" isActive={activeTab === 'register'} onClick={() => setActiveTab('register')} /><TabButton icon={<Bell />} label="Health Alerts" isActive={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} /></nav></div>
          <div>{renderTabContent()}</div>
        </div>
      </div>
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} worker={selectedWorker} />
      <IdCardModal isOpen={isIdCardModalOpen} onClose={() => setIsIdCardModalOpen(false)} worker={newlyRegisteredWorker} />
      <EditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} worker={editingWorker} onSave={handleUpdateWorker} validateForm={validateForm} />
      <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} workerName={deletingWorker?.name || ''} onConfirm={handleConfirmDelete} />
    </div>
  );
}

// --- HELPER & MODAL COMPONENTS ---
const StatCard = ({ icon, title, value }: { icon: React.ReactNode; title: string; value: string; }) => <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4"><div className="bg-gray-100 p-3 rounded-full">{icon}</div><div><p className="text-gray-500 text-sm font-medium">{title}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div></div>;
const TabButton = ({ icon, label, isActive, onClick }: { icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }) => <button onClick={onClick} className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isActive ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{icon}<span>{label}</span></button>;

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }: { currentPage: number; totalItems: number; itemsPerPage: number; onPageChange: (page: number) => void; }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-between items-center mt-4">
      <span className="text-sm text-gray-700">Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results</span>
      <div className="flex space-x-2"><button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg disabled:opacity-50 hover:bg-gray-100"><ChevronLeft className="w-5 h-5" /></button><button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg disabled:opacity-50 hover:bg-gray-100"><ChevronRight className="w-5 h-5" /></button></div>
    </div>
  );
};

const ProfileModal = ({ isOpen, onClose, worker }: { isOpen: boolean; onClose: () => void; worker: Worker | null }) => {
  if (!isOpen || !worker) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4"><X className="w-6 h-6 text-gray-500 hover:text-gray-800" /></button>
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">Worker Profile</h2>
        <div className="space-y-3">
          <p><strong>Name:</strong> {worker.name}</p>
          <p><strong>Worker ID:</strong> {worker.workerId || worker.id}</p>
          <p><strong>Date of Birth:</strong> {worker.dob}</p>
          <p><strong>Gender:</strong> {worker.gender}</p>
          <p><strong>Contact:</strong> {worker.contact}</p>
          <p><strong>Home State:</strong> {worker.homeState}</p>
          <p><strong>ID Proof:</strong> {worker.idType} - {worker.idNumber}</p>
          <p><strong>Registered On:</strong> {worker.registeredOn}</p>
          <p><strong>Registered At:</strong> {worker.hospitalName || 'Unknown'}</p>
        </div>
      </div>
    </div>
  );
};

const IdCardModal = ({ isOpen, onClose, worker }: { isOpen: boolean; onClose: () => void; worker: Worker | null }) => {
  if (!isOpen || !worker) return null;
  const handlePrint = () => window.print();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <div className="printable-area">
          <h2 className="text-2xl font-bold mb-4 text-center">Migrant Worker Health ID</h2>
          <div className="border-2 border-gray-300 p-4 rounded-lg space-y-2">
            <p><strong>Name:</strong> {worker.name}</p>
            <p><strong>Worker ID:</strong> {worker.workerId || worker.id}</p>
            <p><strong>Date of Birth:</strong> {worker.dob}</p>
            <p><strong>Registered at:</strong> {worker.hospitalName || 'Unknown'}</p>
            <p className="text-xs text-gray-500 pt-2">This is a temporary ID. Please keep it safe.</p>
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6 non-printable">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Close</button>
          <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Printer className="w-5 h-5 mr-2" />Print ID</button>
        </div>
        <style jsx global>{`
          @media print {
            body * { visibility: hidden; }
            .printable-area, .printable-area * { visibility: visible; }
            .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
            .non-printable { display: none; }
          }
        `}</style>
      </div>
    </div>
  );
};

// ... (EditModal and DeleteModal remain the same)
const EditModal = ({ isOpen, onClose, worker, onSave, validateForm }: { isOpen: boolean; onClose: () => void; worker: Worker | null; onSave: (worker: Worker) => void; validateForm: (data: ValidationData) => Record<string, string>; }) => {
    const [localData, setLocalData] = useState<Worker | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (worker) {
            setLocalData({ ...worker });
        }
    }, [worker]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!localData) return;
        const { name, value } = e.target;
        setLocalData({ ...localData, [name]: value });
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSave = () => {
        if (!localData) return;
        const formErrors = validateForm(localData);
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            toast.error("Please fix the errors before saving.");
            return;
        }
        onSave(localData);
    };

    if (!isOpen || !localData) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4"><X className="w-6 h-6 text-gray-500 hover:text-gray-800" /></button>
                <h2 className="text-2xl font-bold mb-4">Edit Worker Details</h2>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {Object.keys(defaultFormState).map((key) => {
                        const fieldKey = key as keyof typeof defaultFormState;
                        const label = fieldKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                            <div key={fieldKey}>
                                <label className="text-sm font-medium">{label}</label>
                                <input
                                    type={fieldKey === 'dob' ? 'date' : 'text'}
                                    name={fieldKey}
                                    value={localData[fieldKey]}
                                    onChange={handleChange}
                                    className={`w-full p-2 border rounded-lg mt-1 ${errors[fieldKey] ? 'border-red-500' : ''}`}
                                />
                                {errors[fieldKey] && <p className="text-red-500 text-xs mt-1">{errors[fieldKey]}</p>}
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const DeleteModal = ({ isOpen, onClose, onConfirm, workerName }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; workerName: string; }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-red-100 p-3 rounded-full mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Confirm Deletion</h2>
                    <p className="text-gray-600 mb-6">Are you sure you want to permanently delete the record for <strong className="text-gray-800">{workerName}</strong>? This action cannot be undone.</p>
                    <div className="flex justify-center space-x-4 w-full">
                        <button onClick={onClose} className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 w-full">Cancel</button>
                        <button onClick={onConfirm} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 w-full">Confirm Delete</button>
                    </div>
                </div>
            </div>
        </div>
    );
};