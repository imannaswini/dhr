import mongoose, { Schema, Document, models } from 'mongoose';

export interface IHospital extends Document {
  name: string;
  email: string;
  
  registrationNumber: string;
  password?: string; // Made optional as it might not always be returned
}

const HospitalSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name.'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
  },
  registrationNumber: {
    type: String,
    required: [true, 'Please provide a registration number.'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    select: false, // Prevents password from being returned in queries by default
  },
});

export default models.Hospital || mongoose.model<IHospital>('Hospital', HospitalSchema);
