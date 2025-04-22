// src/components/PoliceUpdateProfile.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PoliceUpdateProfile.module.css";

const PoliceUpdateProfile = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rank, setRank] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const navigate = useNavigate();

  const handleUpdateProfile = () => {
    if (name && phone && rank && department && employeeId) {
      navigate("/police"); // Redirect after update
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
            type="text"
            className={styles.input}
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
        </div>
        <button className={styles.submitBtn} onClick={handleUpdateProfile}>
          Update Profile
        </button>
      </section>

      <footer className={styles.footer}>
        <p>&copy; 2025 Forensic Evidence Management</p>
      </footer>
    </div>
  );
};

export default PoliceUpdateProfile;
