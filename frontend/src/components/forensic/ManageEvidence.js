import React, { useState } from "react";
import styles from "./ManageEvidence.module.css";
import axios from "axios"; // Corrected axios import

function ManageEvidence() {
    const [evidenceItems, setEvidenceItems] = useState([
        { id: 1, timestamp: '2025-04-18 08:45:00', description: 'Fingerprint on knife', image: null },
        { id: 2, timestamp: '2025-04-18 09:00:00', description: 'CCTV footage from hallway', image: null },
        { id: 3, timestamp: '2025-04-18 09:30:00', description: 'Email conversation with suspect', image: null },
    ]);

    const [newDescription, setNewDescription] = useState('');
    const [showUploadPopup, setShowUploadPopup] = useState(false);
    const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [showViewPopup, setShowViewPopup] = useState(false);
    const [viewItem, setViewItem] = useState(null);

    const addEvidence = () => {
        if (newDescription.trim() === '') return;
        const newId = Date.now();
        const newEvidence = {
            id: newId,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            description: newDescription,
            image: null,
        };
        setEvidenceItems([...evidenceItems, newEvidence]);
        setNewDescription('');
        setSelectedEvidenceId(newId);
        setShowUploadPopup(true);
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        const imageUrl = URL.createObjectURL(file);
        setUploadedImage(imageUrl);

        setEvidenceItems((prev) =>
            prev.map((item) =>
                item.id === selectedEvidenceId ? { ...item, image: imageUrl } : item
            )
        );
    };

    const closeUploadPopup = () => {
        setShowUploadPopup(false);
        setUploadedImage(null);
    };

    const viewEvidence = (item) => {
        setViewItem(item);
        setShowViewPopup(true);
    };

    const closeViewPopup = () => {
        setShowViewPopup(false);
        setViewItem(null);
    };

    const downloadImage = (imageUrl, id) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `evidence_${id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const uploadEvidence = () => {
        if (!uploadFile) return;
        const formData = new FormData();
        formData.append("file", uploadFile);

        axios
            .post("/upload", formData)
            .then((response) => {
                console.log(response.data);
                alert("Evidence uploaded successfully!");
            })
            .catch((error) => {
                console.error(error);
                alert("Error uploading evidence");
            });
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Manage Evidence</h1>
            </header>
            <main className={styles.main}>
                <div className={styles.form}>
                    <input
                        type="text"
                        placeholder="Enter evidence description"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className={styles.input}
                    />
                    <button onClick={addEvidence} className={styles.button}>Add Evidence</button>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {evidenceItems.map((item) => (
                            <tr key={item.id}>
                                <td>{item.timestamp}</td>
                                <td>{item.description}</td>
                                <td className={styles.actions}>
                                    <button onClick={() => viewEvidence(item)} className={styles.actionBtn}>View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Upload Popup */}
                {showUploadPopup && (
                    <div className={styles.popupOverlay}>
                        <div className={styles.popupCard}>
                            <h2>Upload Image Evidence</h2>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className={styles.fileInput} />
                            {uploadedImage && <img src={uploadedImage} alt="Uploaded" className={styles.previewImage} />}
                            <button onClick={closeUploadPopup} className={styles.closeBtn}>Done</button>
                        </div>
                    </div>
                )}

                {/* View Popup */}
                {showViewPopup && viewItem && (
                    <div className={styles.popupOverlay}>
                        <div className={styles.popupCard}>
                            <h2>Evidence Details</h2>
                            <p><strong>ID:</strong> {viewItem.id}</p>
                            <p><strong>Timestamp:</strong> {viewItem.timestamp}</p>
                            <p><strong>Description:</strong> {viewItem.description}</p>
                            {viewItem.image && (
                                <>
                                    <img src={viewItem.image} alt="Evidence" className={styles.previewImage} />
                                    <button onClick={() => downloadImage(viewItem.image, viewItem.id)} className={styles.actionBtn}>
                                        Download Image
                                    </button>
                                </>
                            )}
                            <button onClick={closeViewPopup} className={styles.closeBtn}>Close</button>
                        </div>
                    </div>
                )}
            </main>
            <footer className={styles.footer}>
                <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default ManageEvidence;
