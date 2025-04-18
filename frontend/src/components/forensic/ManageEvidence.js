import React, { useState } from 'react';
import styles from './ManageEvidence.module.css';

function ManageEvidence() {
    const [evidenceItems, setEvidenceItems] = useState([
        { id: 1, timestamp: '2025-04-18 08:45:00', description: 'Fingerprint on knife' },
        { id: 2, timestamp: '2025-04-18 09:00:00', description: 'CCTV footage from hallway' },
        { id: 3, timestamp: '2025-04-18 09:30:00', description: 'Email conversation with suspect' },
    ]);

    const [newDescription, setNewDescription] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editDescription, setEditDescription] = useState('');

    const addEvidence = () => {
        if (newDescription.trim() === '') return;
        const newEvidence = {
            id: Date.now(),
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            description: newDescription,
        };
        setEvidenceItems([...evidenceItems, newEvidence]);
        setNewDescription('');
    };

    const deleteEvidence = (id) => {
        setEvidenceItems(evidenceItems.filter(item => item.id !== id));
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setEditDescription(item.description);
    };

    const saveEdit = (id) => {
        setEvidenceItems(evidenceItems.map(item =>
            item.id === id ? { ...item, description: editDescription } : item
        ));
        setEditingId(null);
        setEditDescription('');
    };

    const viewEvidence = (item) => {
        alert(`Evidence ID: ${item.id}\nTimestamp: ${item.timestamp}\nDescription: ${item.description}`);
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
                                <td>
                                    {editingId === item.id ? (
                                        <input
                                            type="text"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            className={styles.editInput}
                                        />
                                    ) : (
                                        item.description
                                    )}
                                </td>
                                <td className={styles.actions}>
                                    {editingId === item.id ? (
                                        <button onClick={() => saveEdit(item.id)} className={styles.actionBtn}>Save</button>
                                    ) : (
                                        <button onClick={() => startEdit(item)} className={styles.actionBtn}>Edit</button>
                                    )}
                                    <button onClick={() => deleteEvidence(item.id)} className={styles.actionBtn}>Delete</button>
                                    <button onClick={() => viewEvidence(item)} className={styles.actionBtn}>View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
            <footer className={styles.footer}>
                <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default ManageEvidence;