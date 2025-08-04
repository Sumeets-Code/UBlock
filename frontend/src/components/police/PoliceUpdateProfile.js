import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./PoliceUpdateProfile.module.css";

const UpdateProfile = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user")) || {}; // get user data from local storage
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(storedUser.profilePic || "");

  const [formData, setFormData] = useState({
    name: storedUser.username || "",
    email: storedUser.email || "",
    phone: storedUser.contact || "",
    rank: storedUser.rank || "",
    department: storedUser.department || "",
    employeeId: storedUser.e_id || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      // Append profile picture if selected
      if (profilePic) {
        formDataToSend.append('profilePic', profilePic);
      }

      const response = await axios.post("http://localhost:3300/update", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update local storage with new data
      const updatedUser = {
        ...storedUser, 
        ...formData,
        profilePic: previewUrl 
      };
      console.log(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      navigate("/police", {state: updatedUser});
    } catch (error) {
      console.error("Update error:", error);
      alert("Update failed. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Update Profile</h1>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label>Photo: </label>
        <div className={styles.profilePicContainer}>
          {previewUrl && (
            <img 
              src={previewUrl} 
              alt="Profile Preview" 
              className={styles.profilePicPreview}
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePicChange}
            className={styles.fileInput}
          />
        </div>

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