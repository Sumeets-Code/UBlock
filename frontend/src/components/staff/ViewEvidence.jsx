// src/pages/ViewEvidence.js
import React, { useState, useEffect } from 'react';
import styles from './ViewEvidence.module.css';

const ViewEvidence = () => {
    const [evidence, setEvidence] = useState([]);

    useEffect(() => {
        // Simulating fetching evidence from a database or API
        const mockEvidenceData = [
            { id: 1, title: "Laptop", description: "A laptop found at the crime scene", date: "2025-04-01" },
            { id: 2, title: "Phone", description: "A smartphone found in the suspect's possession", date: "2025-04-02" },
            { id: 3, title: "Hard Drive", description: "External hard drive with encrypted data", date: "2025-04-03" },
        ];
        setEvidence(mockEvidenceData);
    }, []);

    const handleViewClick = (id) => {
        alert(`Viewing details for evidence ID: ${id}`);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>View Evidence</h1>
            </header>

            <section className={styles.evidenceSection}>
                <ul className={styles.evidenceList}>
                    {evidence.map((item) => (
                        <li key={item.id} className={styles.evidenceItem}>
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                            <p><strong>Date: </strong>{item.date}</p>
                            <button
                                className={styles.viewBtn}
                                onClick={() => handleViewClick(item.id)}
                            >
                                View Details
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            <footer className={styles.footer}>
                <p>&copy; 2025 Forensic Evidence Management</p>
            </footer>
        </div>
    );
};

export default ViewEvidence;