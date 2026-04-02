import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SENDER_PASSWORD,
  },
});

const sendEmail = async (to, subject, text, html) => {
  try {
    await transporter.sendMail({
      from: `"UBlock Evidence System" <${process.env.SENDER_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error('Email send error:', err.message);
    // Don't throw — email failure should never crash the main flow
  }
};

const welcome = async (email, name) => {
  await sendEmail(
    email,
    'Welcome to UBlock Evidence Protection System',
    `Hello ${name}, your UBlock account has been created successfully.`,
    `<p>Hello <strong>${name}</strong>,</p>
     <p>Your UBlock account has been created. You now have secure access to the Evidence Protection System.</p>
     <p>All access is monitored and logged.</p>`
  );
};

const notifyUpload = async (email, name, evidenceTitle, caseNumber) => {
  await sendEmail(
    email,
    `Evidence Uploaded — Case ${caseNumber}`,
    `${name}, evidence "${evidenceTitle}" has been uploaded for case ${caseNumber}.`,
    `<p>Hello <strong>${name}</strong>,</p>
     <p>Evidence <strong>${evidenceTitle}</strong> has been uploaded and secured for case <strong>${caseNumber}</strong>.</p>
     <p>It has been logged immutably on the blockchain.</p>`
  );
};

const notifyStatusChange = async (email, name, evidenceTitle, newStatus) => {
  await sendEmail(
    email,
    `Evidence Status Updated — ${evidenceTitle}`,
    `The status of "${evidenceTitle}" has been changed to ${newStatus}.`,
    `<p>Hello <strong>${name}</strong>,</p>
     <p>The status of evidence <strong>${evidenceTitle}</strong> has been updated to <strong>${newStatus}</strong>.</p>`
  );
};

export default { sendEmail, welcome, notifyUpload, notifyStatusChange };
