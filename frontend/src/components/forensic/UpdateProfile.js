import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./UpdateProfile.module.css";

const UpdateProfile = () => {
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    rank: "",
    department: "",
    employeeId: "",
  });

  useEffect(() => {
    setFormData({
      name: storedUser.username || "",
      email: storedUser.email || "",
      phone: storedUser.contact || "",
      rank: storedUser.rank || "",
      department: storedUser.deparment || "",
      employeeId: storedUser.e_id || "",
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3300/update", formData);
      console.log("Profile updated:", response.data);
      navigate("/forensic");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Update failed. Please try again.");
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

        <label>Employee ID:</label>
        <input
          type="text"
          name="employeeId"
          value={formData.employeeId}
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