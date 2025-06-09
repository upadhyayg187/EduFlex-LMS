import Student from '../models/Student.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new student
// @route   POST /api/students/signup
// @access  Public
const registerStudent = async (req, res) => {
  const { name, email, password } = req.body;

  const studentExists = await Student.findOne({ email });
  if (studentExists) {
    return res.status(400).json({ message: 'Student already exists' });
  }

  const student = await Student.create({ name, email, password });

  if (student) {
    generateToken(res, student._id, 'student');
    res.status(201).json({
      _id: student._id,
      name: student.name,
      email: student.email,
      role: 'student',
    });
  } else {
    res.status(400).json({ message: 'Invalid student data' });
  }
};

// Add other student-related functions here later (e.g., getProfile)
export { registerStudent };