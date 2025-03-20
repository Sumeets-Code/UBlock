import transporter from './config.js';

const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: 'ublock461@gmail.com', // Sender address
        to,
        subject,
        text
    };

    return transporter.sendMail(mailOptions);
};

export default sendEmail;