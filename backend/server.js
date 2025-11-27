require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

// --- SCHEMAS ---

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  mobile: { type: String, unique: true, sparse: true },
  password: String,
  role: String,
  details: Object
});
const User = mongoose.model('User', UserSchema);

const WorkerSchema = new mongoose.Schema({
  name: String,
  dob: String,
  gender: String,
  contact: String,
  homeState: String,
  idType: String,
  idNumber: String,
  registeredOn: String,
  hospitalId: String, // Link to the hospital user
  workerId: String,
  hospitalName: String
});
const Worker = mongoose.model('Worker', WorkerSchema);

const StaffSchema = new mongoose.Schema({
  staffId: String,
  name: String,
  role: String,
  department: String,
  qualification: String,
  contact: String,
  email: String,
  address: String,
  dateOfJoining: String,
  shiftTiming: String,
  experience: String,
  salary: String,
  emergencyContact: String,
  hospitalId: String, 
});
const Staff = mongoose.model('Staff', StaffSchema);

// --- HELPER: Get User from Token ---
const getUserFromToken = async (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token || !token.startsWith('mock-jwt-token-')) return null;
    const userId = token.replace('mock-jwt-token-', '');
    return await User.findById(userId);
};

// --- AUTH ROUTES ---

app.post('/api/auth/signup', async (req, res) => {
  try {
    const formData = req.body;
    let existingUser;
    if (formData.role === 'worker') {
        existingUser = await User.findOne({ mobile: formData.mobileNumber });
    } else {
        existingUser = await User.findOne({ email: formData.officialEmail || formData.administratorEmail });
    }

    if (existingUser) {
      const msg = formData.role === 'worker' 
        ? 'A worker with this Mobile Number already exists.' 
        : 'An account with this Email already exists.';
      return res.status(400).json({ message: msg });
    }

    const newUser = new User({
      name: formData.name || formData.hospitalName || "Gov Official",
      email: formData.officialEmail || formData.administratorEmail,
      mobile: formData.mobileNumber,
      password: formData.password,
      role: formData.role,
      details: formData
    });

    await newUser.save();

    res.status(201).json({ 
      message: 'User registered successfully', 
      token: 'mock-jwt-token-' + newUser._id,
      user: { name: newUser.name, role: newUser.role }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error during signup' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { role, employeeId, registrationNumber, mobileNumber, password } = req.body;
    let user;
    if (role === 'worker') {
      user = await User.findOne({ mobile: mobileNumber });
    } else if (role === 'gov') {
      user = await User.findOne({ 'details.employeeId': employeeId });
    } else if (role === 'hospital') {
      user = await User.findOne({ 'details.registrationNumber': registrationNumber });
    }

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.password !== password) return res.status(400).json({ message: 'Invalid credentials' });

    res.status(200).json({ 
      message: 'Login successful', 
      token: 'mock-jwt-token-' + user._id,
      role: user.role
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error during login' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching profile' });
  }
});

// --- HOSPITAL WORKER ROUTES (SECURED) ---

// 1. Get Only YOUR Workers
app.get('/api/hospital/workers', async (req, res) => {
  try {
    // 1. Identify the logged-in hospital
    const user = await getUserFromToken(req);
    if (!user || user.role !== 'hospital') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    // 2. Find workers ONLY belonging to this hospitalId
    const workers = await Worker.find({ hospitalId: user._id }).sort({ _id: -1 });
    
    res.json(workers.map(w => ({ ...w.toObject(), id: w._id.toString() })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workers' });
  }
});

// 2. Register Worker (Auto-assign Hospital ID)
app.post('/api/hospital/workers', async (req, res) => {
  try {
    // 1. Identify the logged-in hospital
    const user = await getUserFromToken(req);
    if (!user || user.role !== 'hospital') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { hospitalName } = req.body;
    const initials = hospitalName ? hospitalName.split(' ').map(w => w[0]).join('').toUpperCase() : 'GEN';
    const randomNum = Math.floor(Math.random() * 900) + 100;

    const newWorker = new Worker({
      ...req.body,
      workerId: `${initials}_${randomNum}`,
      hospitalId: user._id // <--- THIS IS KEY: Save the hospital's ID
    });

    await newWorker.save();
    res.status(201).json({ ...newWorker.toObject(), id: newWorker._id.toString() });
  } catch (error) {
    res.status(500).json({ message: 'Error registering worker' });
  }
});

app.put('/api/hospital/workers/:id', async (req, res) => {
  try {
    const updatedWorker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ...updatedWorker.toObject(), id: updatedWorker._id.toString() });
  } catch (error) {
    res.status(500).json({ message: 'Error updating worker' });
  }
});

app.delete('/api/hospital/workers/:id', async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting worker' });
  }
});

// --- STAFF ROUTES (Already Secured) ---

app.get('/api/hospital/staff', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'hospital') return res.status(401).json({ message: 'Unauthorized' });
        const staff = await Staff.find({ hospitalId: user._id });
        res.json(staff.map(s => ({...s.toObject(), id: s._id})));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching staff' });
    }
});

app.post('/api/hospital/staff', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'hospital') return res.status(401).json({ message: 'Unauthorized' });

        const { name, role } = req.body;
        const initials = user.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase() : 'HOS';
        const randomNum = Math.floor(Math.random() * 900) + 100;
        let generatedId;

        if (role.toLowerCase().includes('nurse')) generatedId = `${initials}${randomNum}`;
        else if (role.toLowerCase().includes('doctor')) generatedId = `${initials}@${randomNum}`;
        else generatedId = `${initials}_${randomNum}`;

        const newStaff = new Staff({ ...req.body, staffId: generatedId, hospitalId: user._id });
        await newStaff.save();
        res.status(201).json(newStaff);
    } catch (error) {
        res.status(500).json({ message: 'Error adding staff' });
    }
});

app.put('/api/hospital/staff/:id', async (req, res) => {
    try {
        const updatedStaff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedStaff);
    } catch (error) {
        res.status(500).json({ message: 'Error updating staff' });
    }
});

app.delete('/api/hospital/staff/:id', async (req, res) => {
    try {
        await Staff.findByIdAndDelete(req.params.id);
        res.json({ message: 'Staff deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting staff' });
    }
});

app.get('/api/hospital/alerts', (req, res) => {
  res.json([
    { id: 1, title: 'High Fever Cluster', date: '2025-09-16', severity: 'Urgent', content: 'Screen for high fever...' },
    { id: 2, title: 'Vaccination Drive', date: '2025-09-15', severity: 'Informational', content: 'New shipment arrived.' },
  ]);
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});