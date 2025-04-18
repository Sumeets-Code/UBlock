// src/components/PoliceManageLogs.js
import React, { useState, useEffect } from 'react';
import styles from './PoliceManageLogs.module.css';

const PoliceManageLogs = () => {
    const [logs, setLogs] = useState([]);
    const [newLog, setNewLog] = useState('');
    const [editLog, setEditLog] = useState(null);
    const [editMessage, setEditMessage] = useState('');

    useEffect(() => {
        // Simulating fetching logs from a database or API
        const mockLogsData = [
            { id: 1, message: "Case A investigation started", date: "2025-04-01", timestamp: "2025-04-01 10:00 AM" },
            { id: 2, message: "Case B investigation completed", date: "2025-04-02", timestamp: "2025-04-02 02:00 PM" },
        ];
        setLogs(mockLogsData);
    }, []);

    const handleAddLog = () => {
        if (newLog) {
            const newLogEntry = {
                id: logs.length + 1,
                message: newLog,
                date: new Date().toLocaleDateString(),
                timestamp: new Date().toLocaleString(),
            };
            setLogs([...logs, newLogEntry]);
            setNewLog('');
        }
    };

    const handleDeleteLog = (id) => {
        setLogs(logs.filter(log => log.id !== id));
    };

    const handleEditLog = (log) => {
        setEditLog(log);
        setEditMessage(log.message);
    };

    const handleSaveEdit = () => {
        if (editLog && editMessage) {
            setLogs(logs.map(log =>
                log.id === editLog.id ? { ...log, message: editMessage, timestamp: new Date().toLocaleString() } : log
            ));
            setEditLog(null);
            setEditMessage('');
        }
    };

    const handleViewLog = (log) => {
        alert(`Viewing log: ${log.message}`);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Manage Logs</h1>
            </header>

            <section className={styles.logsSection}>
                <div className={styles.addLogContainer}>
                    <textarea
                        className={styles.textarea}
                        value={newLog}
                        onChange={(e) => setNewLog(e.target.value)}
                        placeholder="Add new log..."
                    ></textarea>
                    <button className={styles.addLogBtn} onClick={handleAddLog}>
                        Add Log
                    </button>
                </div>

                <div className={styles.logsListContainer}>
                    <ul className={styles.logsList}>
                        {logs.map((log) => (
                            <li key={log.id} className={styles.logItem}>
                                <div className={styles.logDetails}>
                                    <p className={styles.logMessage}><strong>{log.message}</strong></p>
                                    <p className={styles.logDate}><small>{log.date}</small></p>
                                    <p className={styles.logTimestamp}><small>Timestamp: {log.timestamp}</small></p>
                                </div>

                                <div className={styles.logActions}>
                                    <button
                                        className={styles.viewLogBtn}
                                        onClick={() => handleViewLog(log)}
                                    >
                                        View
                                    </button>
                                    <button
                                        className={styles.editLogBtn}
                                        onClick={() => handleEditLog(log)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className={styles.deleteLogBtn}
                                        onClick={() => handleDeleteLog(log.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {editLog && (
                    <div className={styles.editLogContainer}>
                        <h3>Edit Log</h3>
                        <textarea
                            className={styles.textarea}
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                        ></textarea>
                        <button className={styles.saveEditBtn} onClick={handleSaveEdit}>
                            Save Edit
                        </button>
                    </div>
                )}
            </section>

            <footer className={styles.footer}>
                <p>&copy; 2025 Forensic Evidence Management</p>
            </footer>
        </div>
    );
};

export default PoliceManageLogs;