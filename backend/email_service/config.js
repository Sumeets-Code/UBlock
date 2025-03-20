import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Replace with your SMTP server
    port: 465, // Replace with your SMTP port
    secure: true, // true for 465, false for other ports
    auth: {
        user: "ublock461@gmail.com", // Your email
        pass: process.env.SENDER_PASSWORD, // Your email password
    },
});

export default transporter;