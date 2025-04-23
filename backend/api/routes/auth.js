import express from 'express';
import ldata from '../models/user_model.js';
import sendEmail from '../../email_service/sendemail.js';
import argon2 from 'argon2';
import { fetchLogs } from '../middleware/helperFunc.js';

const router = express.Router();

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

router.post('/update', async (req, res) => {
    const data = req.body;

    try {
        const user = await ldata.findOne({ email: data.email });

        // Check if user exists
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await ldata.updateOne(
            { email: user.email },
            { $set : {
                photo: data.photo,
                username: data.name,
                contact: data.phone,
                rank: data.rank,
                department: data.department,
                employeeId:data.employeeId,
            }}
        )

        res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
});

router.get('/getLogs', async (req, res) => {
    try {
        const logs = await fetchLogs(req);
        
        res.status(200).json({
            success: true,
            evidenceId: req.query.evidenceId,
            accessLogs: logs,
            totalViews: logs.length
        });
    } catch (error) {
        console.error('Error fetching access logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve evidence access logs',
            error: error.message
        });
    }
});

export default router;