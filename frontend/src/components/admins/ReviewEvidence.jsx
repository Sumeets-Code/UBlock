// src/components/admin/ReviewEvidence.jsx
import React from "react";
import styles from "./ReviewEvidence.module.css";

const ReviewEvidence = () => {
    const evidences = [
        { id: 201, title: "Evidence A", status: "Pending" },
        { id: 202, title: "Evidence B", status: "Approved" },
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Review Evidence</h1>
                <nav><a href="/admin">Dashboard</a></nav>
            </header>
            <main className={styles.main}>
                {evidences.map(item => (
                    <div key={item.id} className={styles.evidenceCard}>
                        <div>
                            <strong>{item.title}</strong> - {item.status}
                        </div>
                        <button>Mark Reviewed</button>
                    </div>
                ))}
            </main>
            <footer className={styles.footer}>
                &copy; 2025 DecentraEvidence
            </footer>
        </div>
    );
};

export default ReviewEvidence;