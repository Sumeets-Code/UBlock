// ForensicProfile.js
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./ForensicProfile.module.css";

const ForensicProfile = () => {
  const [profile, setProfile] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation(); // ✅ moved here to top-level

  useEffect(() => {
    // Get state passed from login (if any)
    const { username, email, contact, rank, department, employeeid, dateOfJoining } = location.state || {};

    const fetchProfile = async () => {
      // You can replace this mock with an API call later
      const mockData = {
        name: username || "Unknown",
        email: email || "unknown@example.com",
        phone: contact || "0000000000",
        rank: rank || "Sub-Inspector",
        department: department || "Forensic Engineering",
        employeeId: employeeid || "Unknown",
        dateOfJoining: dateOfJoining || "Unknown",
        profilePic: null,
      };
      setProfile(mockData);
    };

    fetchProfile();
  }, [location]);

  const handleProfilePicChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, profilePic: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    navigate("/");
  };

  if (!profile) return <div className={styles.loading}>Loading Profile...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Forensic Team Member Profile</h1>
      </header>

      <section className={styles.profileSection}>
        <div className={styles.photoContainer}>
          <img
            src={profile.profilePic || "https://via.placeholder.com/150"}
            alt="Profile"
            className={styles.profilePhoto}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleProfilePicChange}
            className={styles.fileInput}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className={styles.uploadBtn}
          >
            Upload Photo
          </button>
        </div>

        <div className={styles.details}>
          <h2>{profile.name}</h2>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          <p>
            <strong>Phone:</strong> {profile.phone}
          </p>
          <p>
            <strong>Rank:</strong> {profile.rank}
          </p>
          <p>
            <strong>Department:</strong> {profile.department}
          </p>
          <p>
            <strong>Employee ID:</strong> {profile.employeeId}
          </p>
          <p>
            <strong>Date of Joining:</strong> {profile.dateOfJoining}
          </p>
        </div>

        <div className={styles.buttonGroup}>
          <Link to="/forensic/manage-evidence" className={styles.manageBtn}>
            Manage Evidences
          </Link>
          <Link to="/forensic/change-password" className={styles.changeBtn}>
            Change Password
          </Link>
          <Link to="/forensic/update-profile" className={styles.updateBtn}>
            Update Profile
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>&copy; 2025 Forensic Evidence Management</p>
      </footer>
    </div>
  );
};

export default ForensicProfile;
