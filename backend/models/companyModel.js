import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    url: { type: String, default: '' },
    public_id: { type: String, default: '' },
  },
  industry: {
    type: String,
  },
  // --- NEW FIELD ---
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Suspended'],
    default: 'Pending', // New companies will require approval
  },
}, { timestamps: true });

// Hash the password before saving
companySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Add matchPassword method
companySchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Company = mongoose.model('Company', companySchema);
export default Company;
