// src/pages/StaffUpdateProfile.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from './StaffUpdateProfile.module.css';

const StaffUpdateProfile = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        address: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Updated Data:", formData);
        navigate("/staff"); // Redirect back to profile after update
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Update Profile</h1>
            </header>

            <form className={styles.form} onSubmit={handleSubmit}>
                <label>Name:</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />

                <label>Email:</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />

                <label>Phone:</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />

                <label>Position:</label>
                <input type="text" name="position" value={formData.position} onChange={handleChange} required />

                <label>Department:</label>
                <input type="text" name="department" value={formData.department} onChange={handleChange} required />

                <label>Address:</label>
                <textarea name="address" value={formData.address} onChange={handleChange} required />

                <div className={styles.buttonGroup}>
                    <button type="submit" className={styles.saveBtn}>Save Changes</button>
                    <button type="button" className={styles.cancelBtn} onClick={() => navigate("/staff")}>Cancel</button>
                </div>
            </form>

            <footer className={styles.footer}>
                <p>&copy; 2025 Forensic Evidence Management</p>
            </footer>
        </div>
    );
};

export default StaffUpdateProfile;