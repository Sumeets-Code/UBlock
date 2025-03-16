import React from 'react';
import { Link } from 'react-router-dom';
import './StaffPF.css';

const StaffPF = () => {
    return (
        <div>
            <header>
                <div className="logo">UBlock</div>
                <nav>
                    <ul>
                        <li><Link to="/home" className="btn">Logout</Link></li>
                    </ul>
                </nav>
            </header>

            <section className="profile-header">
                <div className="profile-avatar">
                    <img src="https://via.placeholder.com/150" alt="User Avatar" />
                </div>
                <div className="profile-info">
                    <h2>Staff Team</h2>
                    <p>Name: Jane Smith</p>
                    <p>Role: Staff Coordinator</p>
                    <p>Email: jane.smith@example.com</p>
                </div>
            </section>

            <section className="profile-details">
                <h3>Assigned Tasks</h3>
                <div className="task-list">
                    <div className="task-item">
                        <h4>Task #001 - Document Review</h4>
                        <p>Status: In Progress</p>
                    </div>
                    <div className="task-item">
                        <h4>Task #002 - Case File Organization</h4>
                        <p>Status: Completed</p>
                    </div>
                    <div className="task-item">
                        <h4>Task #003 - Evidence Labeling</h4>
                        <p>Status: Pending</p>
                    </div>
                </div>
            </section>

            <footer>
                <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default StaffPF;