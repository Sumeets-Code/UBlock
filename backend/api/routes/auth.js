import express from 'express';
import multer from 'multer';
import ldata from '../models/user_model.js';
import sendEmail from '../../email_service/sendEmail.js';
import argon2 from 'argon2';
import fs from 'node:fs';
import path from 'node:path';

const router = express.Router();
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
 });


// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const existing = await ldata.findOne({ email: req.body.email });
        if (existing) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await argon2.hash(req.body.password);

        const data = {
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email,
            role: req.body.role,
            contact: req.body.contact
        };

        await ldata.create(data);
        await sendEmail(data.email, `Welcome! ${data.username}`, `Thank you for registering with UBLock!!`);

        return res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        console.error("Error during signup: ", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post("/signin", async (req, res) => {
    try {
        const user = await ldata.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await argon2.verify(user.password, req.body.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        // Send full user data
        return res.status(200).json(user);

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post('/update', upload.single('profilePic'), async (req, res) => {
  try {
    const { email, name, phone, rank, department, employeeId } = req.body;
    
    const updateData = {
      username: name,
      contact: phone,
      rank,
      department,
      employeeId
    };

    // Handle profile photo upload if exists
    if (req.file) {
      updateData.profilePhoto = {
        data: fs.readFileSync(req.file.path),
        contentType: req.file.mimetype
      };
      // Remove temp file
        setTimeout(() => {
            fs.unlinkSync(`./uploads/${req.file.path}`)
        }, 2000);
    }

    // Use either User or ldata - they should be the same model
    const updatedUser = await ldata.findOneAndUpdate(
      { email },
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Convert binary image to base64 for frontend
    const userResponse = updatedUser.toObject();
    if (userResponse.profilePhoto && userResponse.profilePhoto.data) {
      userResponse.profilePic = `data:${userResponse.profilePhoto.contentType};base64,${userResponse.profilePhoto.data.toString('base64')}`;
      delete userResponse.profilePhoto;
    }

    res.status(200).json({ 
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;