// src/components/admin/ManageUsers.jsx
import React from "react";
import styles from "./ManageUsers.module.css";

const ManageUsers = () => {
    const users = [
        { id: 1, name: "Alice", role: "Admin" },
        { id: 2, name: "Bob", role: "User" },
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Manage Users</h1>
                <nav>
                    <a href="/admin">Dashboard</a>
                </nav>
            </header>
            <main className={styles.main}>
                {users.map(user => (
                    <div key={user.id} className={styles.userCard}>
                        <span>{user.name} ({user.role})</span>
                        <button>Delete</button>
                    </div>
                ))}
            </main>
            <footer className={styles.footer}>
                &copy; 2025 DecentraEvidence
            </footer>
        </div>
    );
};

export default ManageUsers;