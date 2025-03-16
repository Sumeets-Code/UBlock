import React from 'react';
import './AdminP.css';

const AdminP = () => {
    return (
        <div>
            <header>
                <div className="logo">UBlock - Admin Panel</div>
                <nav>
                    <ul>
                        <li><a href="/home" className="btn">Logout</a></li>
                    </ul>
                </nav>
            </header>

            <section className="admin-container">
                <div className="admin-box">
                    <h2>Admin Dashboard</h2>
                    <div className="admin-options">
                        <a href="#manage-users" className="btn">Manage Users</a>
                        <a href="#review-evidence" className="btn">Review Evidence</a>
                        <a href="#review-logs" className="btn">Review Logs</a>
                    </div>
                </div>
            </section>

            <footer>
                <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default AdminP;