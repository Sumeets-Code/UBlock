// UBlock.js
import React from 'react';
import { ParallaxProvider, Parallax } from 'react-scroll-parallax';
import { Link } from 'react-router-dom';
import LetterGlitch from './LetterGlitch';
import ThreeDModel from './ThreeDModel'; // Import the 3D model component
import './UBlock.css';

const UBlock = () => {
    return (
        <ParallaxProvider>
            {/* Glitch Background */}
            <div className="glitch-background">
                <LetterGlitch />
            </div>

            {/* 3D Model Background */}
            <div className="three-d-background">
                <ThreeDModel modelUrl="https://modelviewer.dev/shared-assets/models/Astronaut.glb" /> {/* Correct model path */}
            </div>

            {/* Foreground Scrollable Content */}
            <div className="ublock-page">
                <div className="ublock-container">
                    <h1 className="ublock-title">UBlock - Decentralized Evidence Management</h1>
                    <div className="ublock-card">
                        <p className="ublock-description">
                            Secure, immutable, and decentralized evidence management for a transparent future.
                        </p>
                        <Link to="/registration">
                            <button className="ublock-button">Get Started</button>
                        </Link>
                    </div>
                </div>

                {/* Content Sections */}
                <Parallax y={[-20, 20]} tagOuter="section" className="features">
                    <h2>Key Features</h2>
                    <div className="feature-grid">
                        <div className="feature">
                            <h3>Blockchain Security</h3>
                            <p>Immutable records stored securely on a blockchain network.</p>
                        </div>
                        <div className="feature">
                            <h3>Access Control</h3>
                            <p>Only authorized users can access and verify evidence.</p>
                        </div>
                        <div className="feature">
                            <h3>Transparency</h3>
                            <p>Every action is recorded, ensuring full auditability.</p>
                        </div>
                    </div>
                    <div className="additional-info">
                        <p>Learn more about our features and how they can benefit you.</p>
                    </div>
                </Parallax>

                <Parallax y={[-30, 30]} tagOuter="section" className="about">
                    <h2>About Us</h2>
                    <p>
                        DecentraEvidence is dedicated to providing secure and decentralized evidence management solutions.
                        Our platform leverages blockchain technology to ensure integrity and transparency.
                    </p>
                    <div className="additional-info">
                        <p>We believe in a future where evidence management is secure and accessible to all.</p>
                    </div>
                </Parallax>

                <Parallax y={[-10, 10]} tagOuter="section" className="footer-parallax">
                    <div className="footer-content">
                        <p>&copy; 2025 DecentraEvidence. All rights reserved.</p>
                    </div>
                </Parallax>
            </div>
        </ParallaxProvider>
    );
};

export default UBlock;