import Company from '../models/companyModel.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new company
// @route   POST /api/companies/signup
// @access  Public
const registerCompany = async (req, res) => {
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
};

// Add other company-related functions here later (e.g., createCourse)
export { registerCompany };