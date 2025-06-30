import Company from '../models/companyModel.js';
import { v2 as cloudinary } from 'cloudinary';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';

const generateToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new company
export const registerCompany = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const companyExists = await Company.findOne({ email });
    if (companyExists) {
        res.status(400);
        throw new Error('Company with this email already exists');
    }
    const company = await Company.create({ name, email, password });
    if (company) {
        const token = generateToken(company._id, 'company');
        res.status(201).json({
            _id: company._id,
            name: company.name,
            email: company.email,
            role: 'company',
            token: token,
        });
    } else {
        res.status(400);
        throw new Error('Invalid company data');
    }
});

// @desc    Get the logged-in company's profile
export const getCompanyProfile = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.user._id).select('-password');
    if (company) {
        res.json(company);
    } else {
        res.status(404);
        throw new Error('Company not found');
    }
});

// @desc    Update the logged-in company's profile
export const updateCompanyProfile = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.user._id);
    if (company) {
        company.name = req.body.name || company.name;
        company.industry = req.body.industry || company.industry;

        if (req.body.email && req.body.email !== company.email) {
            res.status(400);
            throw new Error('Email address cannot be changed.');
        }

        if (req.file) {
            if (company.avatar && company.avatar.public_id) {
                await cloudinary.uploader.destroy(company.avatar.public_id);
            }
            company.avatar = {
                url: req.file.path,
                public_id: req.file.filename,
            };
        }

        const updatedCompany = await company.save();
        res.json({
            _id: updatedCompany._id,
            name: updatedCompany.name,
            email: updatedCompany.email,
            avatar: updatedCompany.avatar,
            industry: updatedCompany.industry,
        });
    } else {
        res.status(404);
        throw new Error('Company not found');
    }
});

// @desc    Update company password
export const updateCompanyPassword = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.user._id);
    if (!company) {
        res.status(404);
        throw new Error('Company not found');
    }
    const { currentPassword, newPassword } = req.body;
    if (!(await company.matchPassword(currentPassword))) {
        res.status(401);
        throw new Error('Invalid current password');
    }
    company.password = newPassword;
    await company.save();
    res.json({ message: 'Password updated successfully' });
});