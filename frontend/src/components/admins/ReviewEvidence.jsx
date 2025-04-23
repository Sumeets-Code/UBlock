import React, { useState } from "react";
import styles from "./ReviewEvidence.module.css";

const ReviewEvidence = () => {
    const [evidences, setEvidences] = useState([
        {
            id: 201,
            title: "Crime Scene Photo",
            status: "Pending",
            fileUrl: "https://via.placeholder.com/150",
        },
        {
            id: 202,
            title: "Investigation Video",
            status: "Approved",
            fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        },
        {
            id: 203,
            title: "Evidence Report",
            status: "Pending",
            fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        },
    ]);

    const markAsReviewed = (id) => {
        const updatedEvidences = evidences.map((evidence) =>
            evidence.id === id ? { ...evidence, status: "Reviewed" } : evidence
        );
        setEvidences(updatedEvidences);
    };

    const renderFilePreview = (fileUrl) => {
        const ext = fileUrl.split('.').pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
            return <img src={fileUrl} alt="evidence" className={styles.thumbnail} />;
        } else if (["mp4", "webm", "ogg"].includes(ext)) {
            return (
                <video controls className={styles.videoPreview}>
                    <source src={fileUrl} type={`video/${ext}`} />
                    Your browser does not support the video tag.
                </video>
            );
        } else if (ext === "pdf") {
            return (
                <iframe
                    src={fileUrl}
                    title="PDF Preview"
                    className={styles.pdfPreview}
                ></iframe>
            );
        } else {
            return <p>Unsupported file type</p>;
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Review Evidence</h1>
                <nav><a href="/admin">Dashboard</a></nav>
            </header>
            <main className={styles.main}>
                {evidences.map((item) => (
                    <div key={item.id} className={styles.evidenceCard}>
                        <div className={styles.evidenceInfo}>
                            <strong>{item.title}</strong>
                            <p>Status: {item.status}</p>
                            {renderFilePreview(item.fileUrl)}
                        </div>
                        <div className={styles.buttons}>
                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                <button className={styles.viewBtn}>View</button>
                            </a>
                            {item.status !== "Reviewed" && (
                                <button
                                    className={styles.reviewBtn}
                                    onClick={() => markAsReviewed(item.id)}
                                >
                                    Mark Reviewed
                                </button>
                            )}
                        </div>
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