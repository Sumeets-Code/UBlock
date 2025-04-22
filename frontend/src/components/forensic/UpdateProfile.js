import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Added axios import
import styles from "./UpdateProfile.module.css";

const UpdateProfile = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    rank: document.getElementById('rank').value,
    department: document.getElementById('deparment').value,
    employeeId:document.getElementById('employeeId').value,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:3300/update",
        formData
      ); // Send POST request with form data
      console.log("Response from server:", response.data);
      navigate("/forensic"); // Redirect to /forensic after success
    } catch (error) {
      console.error("Error updating profile:", error);
      // Handle any errors here (e.g., show an alert or message)
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Update Profile</h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label>Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>Phone:</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        <label>Rank:</label>
        <input
          type="text"
          name="rank"
          value={formData.rank}
          onChange={handleChange}
          required
        />

        <label>Department:</label>
        <input
          type="text"
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
        />

        <label>EmployeeId:</label>
        <textarea
          name="employeeId"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.saveBtn}>
            Save Changes
          </button>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => navigate("/forensic")}
          >
            Cancel
          </button>
        </div>
      </form>

      <footer className={styles.footer}>
        <p>&copy; 2025 Forensic Evidence Management</p>
      </footer>
    </div>
  );
};

export default UpdateProfile;
