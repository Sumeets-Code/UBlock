import express from 'express';
import ldata from '../models/user_model.js';
import argon2 from 'argon2';     // argon2 is a password hashing library
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hello World!');
})

router.post('/signup', async (req, res) => {
    const hashedpassword = argon2.hash(req.body.password);

    const data = {
        "username": req.body.username,
        "password": hashedpassword,
        "email": req.body.email,
        "role": req.body.role,
        "contact": req.body.contact
    }
        
    try{
        await ldata.insertMany([data]);
        res.redirect("/login").send("User created successfully");
    } catch (err) {
        console.error("Error inserting data: ", err);
        res.status(500).send("Internal Server Error");
    }
})

router.post("/signin", async (req, res) => {
    try {
        // Find the user by email
        const user = await ldata.findOne({ email: req.body.email });

        // Check if the user exists
        if (!user) {
            return res.status(404).send("User not found. Please do Signup With us");
        }

        // Comparing the provided password with the hashed password
        if(user) {
            const isMatch = await argon2.verify(req.body.password, user.password);
            if (isMatch) {
                res.send(alert("Login Successfull"));

                // Depending upon the Role it login to the respective page
                if (user.role === "admin"){
                    res.redirect("/admin", {
                        data1: user.name
                    });
                } else if (user.role === "forensic offier"){
                    res.redirect("/forensic", {
                        data1: user.name
                    });
                } else if (user.role === "police officer"){
                    res.redirect("/police", {
                        data1: user.name
                    });
                } else if (user.role === "jury"){
                    res.redirect("/jury", {
                        data1: user.name
                    });
                }    

            } else {
                res.status(406).send("Wrong Password");
            }
        }

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


export default router;