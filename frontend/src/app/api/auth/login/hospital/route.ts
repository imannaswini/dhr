import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Hospital from '@/models/Hospital';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();
    if (body.role !== 'hospital') return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });

    // Login uses registrationNumber and password
    const { registrationNumber, password } = body;

    // 1. Find Hospital by unique registration number
    const hospital = await Hospital.findOne({ registrationNumber }).select('+password');
    if (!hospital) {
        return NextResponse.json({ success: false, error: 'Hospital not found' }, { status: 404 });
    }

    // 2. Verify Password: Compare hashed password from DB with plain text password from frontend
    const isMatch = await bcrypt.compare(password, hospital.password);
    if (!isMatch) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Login Success: Return minimal secure user info to the frontend
    return NextResponse.json({ 
      success: true, 
      user: {
        id: hospital._id, 
        name: hospital.name, 
        email: hospital.email, 
        role: 'hospital',
        regNo: hospital.registrationNumber
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, error: 'Server error during login.' }, { status: 500 });
  }
}
