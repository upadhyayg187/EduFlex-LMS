import Admin from '../models/Admin.js';
import Company from '../models/Company.js';
import Student from '../models/Student.js';
import generateToken from '../utils/generateToken.js'; // Assuming you created this from the previous step

// @desc    Login for all roles & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password, role } = req.body;

  let user;
  try {
    if (role === 'admin') {
      user = await Admin.findOne({ email });
    } else if (role === 'company') {
      user = await Company.findOne({ email });
    } else if (role === 'student') {
      user = await Student.findOne({ email });
    } else {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    if (user && (await user.matchPassword(password))) {
      generateToken(res, user._id, role);
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: role,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
};


export { loginUser, logoutUser };