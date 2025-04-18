// src/pages/ManageLogs.js
import React, { useState, useEffect } from 'react';
import styles from './ManageLogs.module.css';

const ManageLogs = () => {
    const [logs, setLogs] = useState([]);
    const [newLog, setNewLog] = useState({ action: '', date: '', by: '' });
    const [editingLog, setEditingLog] = useState(null);

    useEffect(() => {
        // Simulating fetching logs from the database
        const mockLogsData = [
            { id: 1, action: "Evidence added", date: "2025-04-01", by: "John Doe" },
            { id: 2, action: "Password changed", date: "2025-04-02", by: "Jane Smith" },
            { id: 3, action: "Evidence reviewed", date: "2025-04-03", by: "Mark Lee" },
        ];
        setLogs(mockLogsData);
    }, []);

    const handleAddLog = () => {
        const newLogData = { ...newLog, id: Date.now() }; // Generate a unique ID for the new log
        setLogs([...logs, newLogData]);
        setNewLog({ action: '', date: '', by: '' }); // Clear the input fields
    };

    const handleEditLog = (log) => {
        setEditingLog(log);
    };

    const handleSaveEdit = () => {
        const updatedLogs = logs.map((log) =>
            log.id === editingLog.id ? editingLog : log
        );
        setLogs(updatedLogs);
        setEditingLog(null); // Clear editing state
    };

    const handleDeleteLog = (id) => {
        const filteredLogs = logs.filter((log) => log.id !== id);
        setLogs(filteredLogs);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (editingLog) {
            setEditingLog({ ...editingLog, [name]: value });
        } else {
            setNewLog({ ...newLog, [name]: value });
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Manage Logs</h1>
            </header>

            <section className={styles.logsSection}>
                <div className={styles.addLogSection}>
                    <input
                        type="text"
                        name="action"
                        value={newLog.action}
                        onChange={handleChange}
                        placeholder="Action"
                        className={styles.input}
                    />
                    <input
                        type="text"
                        name="date"
                        value={newLog.date}
                        onChange={handleChange}
                        placeholder="Date"
                        className={styles.input}
                    />
                    <input
                        type="text"
                        name="by"
                        value={newLog.by}
                        onChange={handleChange}
                        placeholder="By"
                        className={styles.input}
                    />
                    <button
                        onClick={handleAddLog}
                        className={styles.addLogBtn}
                    >
                        Add Log
                    </button>
                </div>

                <ul className={styles.logsList}>
                    {logs.map((log) => (
                        <li key={log.id} className={styles.logItem}>
                            {editingLog && editingLog.id === log.id ? (
                                <>
                                    <input
                                        type="text"
                                        name="action"
                                        value={editingLog.action}
                                        onChange={handleChange}
                                        className={styles.input}
                                    />
                                    <input
                                        type="text"
                                        name="date"
                                        value={editingLog.date}
                                        onChange={handleChange}
                                        className={styles.input}
                                    />
                                    <input
                                        type="text"
                                        name="by"
                                        value={editingLog.by}
                                        onChange={handleChange}
                                        className={styles.input}
                                    />
                                    <button onClick={handleSaveEdit} className={styles.saveBtn}>
                                        Save
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p><strong>Action: </strong>{log.action}</p>
                                    <p><strong>By: </strong>{log.by}</p>
                                    <p><strong>Date: </strong>{log.date}</p>
                                    <button
                                        onClick={() => handleEditLog(log)}
                                        className={styles.editBtn}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className={styles.deleteBtn}
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
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

export default ManageLogs;