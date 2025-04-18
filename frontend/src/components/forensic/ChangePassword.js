// src/pages/ChangePassword.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ChangePassword.module.css';

function ChangePassword() {
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
            navigate('/forensic'); // Redirect after success
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
                            required
                        />
                    </label>
                    <label>
                        Confirm Password:
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            required
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

export default ChangePassword;