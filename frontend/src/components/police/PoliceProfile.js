import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from './PoliceProfile.module.css';

const PoliceProfile = () => {
    const [profile, setProfile] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            const mockData = {
                name: "Inspector Raj Malhotra",
                email: "raj.malhotra@police.gov",
                phone: "+91 91234 56789",
                rank: "Inspector",
                department: "Delhi Police, Crime Branch",
                badgeNumber: "DL-CB-1122",
                address: "45 Police Lines, Civil Lines, Delhi, India",
                dateOfJoining: "20 June 2015",
                profilePic: null
            };
            setProfile(mockData);
        };

        fetchProfile();
    }, []);

    const handleProfilePicChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, profilePic: reader.result }));
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
                    <button onClick={() => fileInputRef.current.click()} className={styles.uploadBtn}>
                        Upload Photo
                    </button>
                </div>

                <div className={styles.details}>
                    <h2>{profile.name}</h2>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Phone:</strong> {profile.phone}</p>
                    <p><strong>Rank:</strong> {profile.rank}</p>
                    <p><strong>Department:</strong> {profile.department}</p>
                    <p><strong>Badge Number:</strong> {profile.badgeNumber}</p>
                    <p><strong>Address:</strong> {profile.address}</p>
                    <p><strong>Date of Joining:</strong> {profile.dateOfJoining}</p>
                </div>

                <div className={styles.buttonGroup}>
                    {/* New Buttons: View Evidence and Manage Logs */}
                    <Link to="/police/view-evidence" className={styles.viewEvidenceBtn}>View Evidence</Link>
                    <Link to="/police/manage-logs" className={styles.manageLogsBtn}>Manage Logs</Link>
                    <Link to="/police/change-password" className={styles.changeBtn}>Change Password</Link>
                    <Link to="/police/update-profile" className={styles.updateBtn}>Update Profile</Link>
                    <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
                </div>
            </section>

            <footer className={styles.footer}>
                <p>&copy; 2025 Police Evidence Management</p>
            </footer>
        </div>
    );
};

export default PoliceProfile;