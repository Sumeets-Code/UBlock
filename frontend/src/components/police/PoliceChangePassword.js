// src/components/PoliceChangePassword.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PoliceChangePassword.module.css';

const PoliceChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();  // Hook to navigate after successful password change

    const handlePasswordChange = () => {
        if (newPassword === confirmPassword) {
            setMessage("Password changed successfully!");
            // Redirect to the police profile page after 1 second
            setTimeout(() => navigate('/police'), 1000);
        } else {
            setMessage("Passwords do not match!");
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Change Password</h1>
            </header>

            <section className={styles.changePasswordSection}>
                <div className={styles.inputContainer}>
                    <input
                        type="password"
                        className={styles.input}
                        placeholder="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        className={styles.input}
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        className={styles.input}
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
                <button className={styles.submitBtn} onClick={handlePasswordChange}>
                    Change Password
                </button>
                {message && <p className={styles.message}>{message}</p>}
            </section>

            <footer className={styles.footer}>
                <p>&copy; 2025 Forensic Evidence Management</p>
            </footer>
        </div>
    );
};

export default PoliceChangePassword;