import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // ✅ useLocation added
import styles from "./StaffProfile.module.css";

const StaffProfile = () => {
  const [profile, setProfile] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Hook used at top-level

  useEffect(() => {
    const { username, email, contact, rank, department, employeeid, dateOfJoining } = location.state || {};
    const fetchProfile = async () => {
      const mockData = {
        name: username,
        email: email,
        phone: contact,
        position: rank || "Support Staff",
        department: department || "Forensic Operations",
        employeeId: employeeid|| "STF-1023",
        dateOfJoining: dateOfJoining || "15 March 2021",
        profilePic: null,
      };
      setProfile(mockData);
    };

    fetchProfile();
  }, [location.state]); // ✅ Proper dependency

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
    navigate("/"); // Redirect to login/logout page
  };

  if (!profile) return <div className={styles.loading}>Loading Profile...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Staff Profile</h1>
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
            <strong>Position:</strong> {profile.position}
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
          <Link to="/staff/update-profile" className={styles.updateBtn}>
            Update Profile
          </Link>
          <Link to="/staff/change-password" className={styles.changeBtn}>
            Change Password
          </Link>
          <Link to="/staff/view-evidence" className={styles.viewBtn}>
            View Evidence
          </Link>
          <Link to="/staff/manage-logs" className={styles.manageBtn}>
            Manage Logs
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

export default StaffProfile;
