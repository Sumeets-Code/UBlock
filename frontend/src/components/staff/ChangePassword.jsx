// src/pages/StaffChangePassword.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './StaffChangePassword.module.css';

function StaffChangePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === confirmPassword) {
            alert('Password changed successfully');
            navigate("/staff"); // Redirect to staff profile after changing password
        } else {
            alert('Passwords do not match');
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Change Password</h1>
            </header>
            <main className={styles.main}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <label>
                        New Password:
                        <input
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                        />
                    </label>
                    <label>
                        Confirm Password:
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                        />
                    </label>
                    <button type="submit">Change Password</button>
                </form>
            </main>
            <footer className={styles.footer}>
                <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default StaffChangePassword;