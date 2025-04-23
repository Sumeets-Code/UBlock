import React, { useState, useEffect } from 'react';
import styles from './ViewEvidence.module.css';

const ViewEvidence = () => {
    const [evidence, setEvidence] = useState([]);
    const [selectedEvidence, setSelectedEvidence] = useState(null);

    useEffect(() => {
        const mockEvidenceData = [
            {
                id: 1,
                title: "Laptop",
                description: "A laptop found at the crime scene",
                date: "2025-04-01",
                fileUrl: "https://via.placeholder.com/300", // image
            },
            {
                id: 2,
                title: "Phone",
                description: "A smartphone found in the suspect's possession",
                date: "2025-04-02",
                fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // video
            },
            {
                id: 3,
                title: "Hard Drive",
                description: "External hard drive with encrypted data",
                date: "2025-04-03",
                fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", // pdf
            },
        ];
        setEvidence(mockEvidenceData);
    }, []);

    const handleViewClick = (item) => {
        setSelectedEvidence(item);
    };

    const renderPreview = (fileUrl) => {
        const ext = fileUrl.split('.').pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
            return <img src={fileUrl} alt="evidence" className={styles.previewMedia} />;
        } else if (["mp4", "webm", "ogg"].includes(ext)) {
            return (
                <video controls className={styles.previewMedia}>
                    <source src={fileUrl} type={`video/${ext}`} />
                    Your browser does not support the video tag.
                </video>
            );
        } else if (["mp3", "wav"].includes(ext)) {
            return <audio controls src={fileUrl} className={styles.previewMedia}></audio>;
        } else if (ext === "pdf") {
            return <iframe src={fileUrl} className={styles.previewMedia}></iframe>;
        } else {
            return <p>Unsupported file type</p>;
        }
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
                                onClick={() => handleViewClick(item)}
                            >
                                View Details
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            {selectedEvidence && (
                <div className={styles.popupOverlay} onClick={() => setSelectedEvidence(null)}>
                    <div className={styles.popupCard} onClick={(e) => e.stopPropagation()}>
                        <h2>{selectedEvidence.title}</h2>
                        <p>{selectedEvidence.description}</p>
                        <p><strong>Date:</strong> {selectedEvidence.date}</p>
                        {renderPreview(selectedEvidence.fileUrl)}
                        <button onClick={() => setSelectedEvidence(null)} className={styles.closeBtn}>Close</button>
                    </div>
                </div>
            )}

            <footer className={styles.footer}>
                <p>&copy; 2025 Forensic Evidence Management</p>
            </footer>
        </div>
    );
};

export default ViewEvidence;