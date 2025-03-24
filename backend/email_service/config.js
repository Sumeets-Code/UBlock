import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // SMTP server
    port: 465,
    secure: true,
    auth: {
        user: "ublock461@gmail.com",
        pass: process.env.SENDER_PASSWORD,
    },
});

export default transporter;