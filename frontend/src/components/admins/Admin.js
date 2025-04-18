import React from "react";
import { Link } from "react-router-dom";
import styles from "./Admin.module.css";

const AdminPanel = () => {
    return (
        <div className={styles.adminPanel}>
            <header className={styles.header}>
                <div className={styles.logo}>UBlock - Admin Panel</div>
                <nav>
                    <ul className={styles.nav}>
                        <li>
                            <Link to="/" className={styles.link}>Logout</Link>
                        </li>
                    </ul>
                </nav>
            </header>

            <main className={styles.main}>
                <div className={styles.box}>
                    <h2 className={styles.title}>Admin Dashboard</h2>
                    <div className={styles.options}>
                        <Link to="/admin/manage-users" className={styles.button}>Manage Users</Link>
                        <Link to="/admin/review-evidence" className={styles.button}>Review Evidence</Link>
                        <Link to="/admin/review-logs" className={styles.button}>Review Logs</Link>
                    </div>
                </div>
            </main>

            <footer className={styles.footer}>
                <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default AdminPanel;