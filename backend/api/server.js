import express from 'express';
import connectDB from './config/mongodbconn';
import ldata from './models/user_model';
import bodyParser from 'body-parser';
import argon2 from 'argon2';     // argon2 is a password hashing library

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.post('/signup', async (req, res) => {
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
        res.redirect("<login_page>");
    } catch (err) {
        console.error("Error inserting data:", err);
        res.status(500).send("Internal Server Error");
    }
})

app.post("/signin", async (req, res) => {
    try {
        // Find the user by email
        const user = await ldata.findOne({ email: req.body.email });

        // Check if the user exists
        if (!user) {
            return res.status(404).send("User not found. Please do Signup With us");
        }

        // Comparing the provided password with the hashed password
        if(user) {
            const isMatch = await bcrypt.compare(req.body.password, user.password);
            if (isMatch) {
                res.render("home.ejs", {
                    data1: user.name
                });
            } else {
                res.status(406).send("Wrong Password");
            }

        } else if (user) {
            const isMatch = await argon2.verify(req.body.password, user2.password);
            if (isMatch) {
                res.render("ngoHome.ejs", {
                    data1: user2.name
                });
            } else {
                res.status(406).send("Wrong Password");
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


app.listen( port, () => {
    console.log(`Server is running on port ${port}`);
    connectDB();
})