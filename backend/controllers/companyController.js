import Company from '../models/companyModel.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';

// @desc    Register a new company
// @route   POST /api/companies/signup
// @access  Public
const registerCompany = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const companyExists = await Company.findOne({ email });
    if (companyExists) {
      return res.status(400).json({ message: 'Company already exists' });
    }

    const company = await Company.create({ name, email, password });

    if (company) {
      generateToken(res, company._id, 'company');
      res.status(201).json({
        _id: company._id,
        name: company.name,
        email: company.email,
        role: 'company',
      });
    } else {
      res.status(400).json({ message: 'Invalid company data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update company password
// @route   POST /api/companies/update-password
// @access  Private (Company only)
const updateCompanyPassword = async (req, res) => {
  try {
    const companyId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, company.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    company.password = newPassword;
    await company.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update password' });
  }
};

export { registerCompany, updateCompanyPassword };
