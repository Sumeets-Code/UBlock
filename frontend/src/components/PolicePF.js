import React from 'react';
import { Link } from 'react-router-dom';
import './PolicePF.css';

const PolicePF = () => {
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
                    <h2>Police Team</h2>
                    <p>Name: Mark Johnson</p>
                    <p>Role: Police Officer</p>
                    <p>Email: mark.johnson@example.com</p>
                </div>
            </section>

            <section className="profile-details">
                <h3>Case Involvements</h3>
                <div className="case-list">
                    <div className="case-item">
                        <h4>Case #001 - Robbery Investigation</h4>
                        <p>Status: Under Investigation</p>
                    </div>
                    <div className="case-item">
                        <h4>Case #002 - Homicide Case</h4>
                        <p>Status: Arrest Made</p>
                    </div>
                    <div className="case-item">
                        <h4>Case #003 - Missing Person</h4>
                        <p>Status: Ongoing</p>
                    </div>
                </div>
            </section>

            <footer>
                <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default PolicePF;