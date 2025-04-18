import React, { useState, useEffect } from 'react';
import styles from './PoliceViewEvidence.module.css';

const PoliceViewEvidence = () => {
    const [evidence, setEvidence] = useState([]);

    useEffect(() => {
        // Simulating fetching evidence from a database or API
        const mockEvidenceData = [
            { id: 1, title: "Handgun", description: "A firearm found at the crime scene", date: "2025-04-01" },
            { id: 2, title: "Wallet", description: "A wallet containing a driver's license", date: "2025-04-02" },
            { id: 3, title: "Security Camera", description: "A security camera from a nearby shop", date: "2025-04-03" },
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
                <p>&copy; 2025 Police Evidence Management</p>
            </footer>
        </div>
    );
};

export default PoliceViewEvidence;