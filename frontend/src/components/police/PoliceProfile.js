import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios"; // Added axios import
import styles from "./PoliceProfile.module.css";

const PoliceProfile = () => {
  const [profile, setProfile] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation(); // ✅ moved to top-level

  useEffect(() => {
    const { username, email, contact } = location.state || {};

    const fetchProfile = async () => {
      try {
        // Simulated API call using axios
        const response = await axios.get(
          "https://api.example.com/police/profile",
          {
            params: { username, email, contact },
          }
        );

        // Mocked response data if using axios
        const mockData = response.data || {
          name: "Inspector " + (username || "Unknown"),
          email: email || "unknown@example.com",
          phone: contact || "0000000000",
          rank: "Inspector",
          department: "Delhi Police, Crime Branch",
          badgeNumber: "DL-CB-1122",
          address: "45 Police Lines, Civil Lines, Delhi, India",
          dateOfJoining: "20 June 2015",
          profilePic: null,
        };

        setProfile(mockData);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        // Handle error, e.g., show a message or use mock data
        setProfile({
          name: "Inspector Unknown",
          email: "unknown@example.com",
          phone: "0000000000",
          rank: "Inspector",
          department: "Delhi Police, Crime Branch",
          badgeNumber: "DL-CB-1122",
          address: "45 Police Lines, Civil Lines, Delhi, India",
          dateOfJoining: "20 June 2015",
          profilePic: null,
        });
      }
    };

    fetchProfile();
  }, [location.state]); // ✅ added dependency

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
        <h1 className={styles.title}>Police Officer Profile</h1>
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
            <strong>Badge Number:</strong> {profile.badgeNumber}
          </p>
          <p>
            <strong>Address:</strong> {profile.address}
          </p>
          <p>
            <strong>Date of Joining:</strong> {profile.dateOfJoining}
          </p>
        </div>

        <div className={styles.buttonGroup}>
          <Link to="/police/view-evidence" className={styles.viewEvidenceBtn}>
            View Evidence
          </Link>
          <Link to="/police/manage-logs" className={styles.manageLogsBtn}>
            Manage Logs
          </Link>
          <Link to="/police/change-password" className={styles.changeBtn}>
            Change Password
          </Link>
          <Link to="/police/update-profile" className={styles.updateBtn}>
            Update Profile
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>&copy; 2025 Police Evidence Management</p>
      </footer>
    </div>
  );
};

export default PoliceProfile;
