// src/components/admin/ReviewLogs.jsx
import React from "react";
import styles from "./ReviewLogs.module.css";

const ReviewLogs = () => {
    const logs = [
        { id: 301, message: "Admin reviewed Evidence A" },
        { id: 302, message: "User Bob uploaded new file" },
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Review Logs</h1>
                <nav><a href="/admin">Dashboard</a></nav>
            </header>
            <main className={styles.main}>
                {logs.map(log => (
                    <div key={log.id} className={styles.logEntry}>
                        {log.message}
                    </div>
                ))}
            </main>
            <footer className={styles.footer}>
                &copy; 2025 DecentraEvidence
            </footer>
        </div>
    );
};

export default ReviewLogs;