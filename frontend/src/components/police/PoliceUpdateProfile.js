// src/components/PoliceUpdateProfile.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PoliceUpdateProfile.module.css';

const PoliceUpdateProfile = () => {
    const [phone, setPhone] = useState('');
    const [rank, setRank] = useState('');
    const [department, setDepartment] = useState('');
    const [badgeNumber, setBadgeNumber] = useState('');
    const [address, setAddress] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleUpdateProfile = () => {
        if (phone && rank && department && badgeNumber && address) {
            setMessage("Profile updated successfully!");
            setTimeout(() => navigate('/police'), 1000);
        } else {
            setMessage("Please fill in all fields.");
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Update Profile</h1>
            </header>

            <section className={styles.updateProfileSection}>
                <div className={styles.inputContainer}>
                    <input
                        type="tel"
                        className={styles.input}
                        placeholder="Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Rank"
                        value={rank}
                        onChange={(e) => setRank(e.target.value)}
                    />
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Department"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                    />
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Badge Number"
                        value={badgeNumber}
                        onChange={(e) => setBadgeNumber(e.target.value)}
                    />
                    <textarea
                        className={styles.input}
                        placeholder="Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                </div>
                <button className={styles.submitBtn} onClick={handleUpdateProfile}>
                    Update Profile
                </button>
                {message && <p className={styles.message}>{message}</p>}
            </section>

            <footer className={styles.footer}>
                <p>&copy; 2025 Forensic Evidence Management</p>
            </footer>
        </div>
    );
};

export default PoliceUpdateProfile;