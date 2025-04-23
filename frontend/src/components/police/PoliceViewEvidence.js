import React, { useState, useEffect } from 'react';
import styles from './PoliceViewEvidence.module.css';

const PoliceViewEvidence = () => {
    const [evidence, setEvidence] = useState([]);
    const [selectedEvidence, setSelectedEvidence] = useState(null);
    
    useEffect(() => {
    const initWeb3 = async () => {
          try {
            // Check if MetaMask is installed
            if (window.ethereum) {
              const web3Instance = new Web3(window.ethereum);
              setWeb3(web3Instance);
              
              // Request account access
              try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setWalletAddress(accounts[0]);
                
                // Listen for account changes
                window.ethereum.on('accountsChanged', (accounts) => {
                  setWalletAddress(accounts[0]);
                });
              } catch (error) {
                console.log("User denied account access");
              }
            } else {
              console.log("Please install MetaMask to use this application");
            }
          } catch (error) {
            console.error("Error initializing Web3:", error);
          }
        };
    
        initWeb3();
        
        // Cleanup event listener on component unmount
        return () => {
          if (window.ethereum) {
            window.ethereum.removeAllListeners('accountsChanged');
          }
        };
    }, []);

    useEffect(() => {
        const fetchEvidence = async () => {
            try {
                const response = await axios.get('http://localhost:3300/evidences');
                setEvidence(response.data.map(item => ({
                    ...item,
                    // Convert MongoDB Date to readable format
                    date: new Date(item.date).toLocaleDateString()
                })));
                setLoading(false);
            } catch (err) {
                console.error("Error fetching evidence:", err);
                setError('Failed to load evidence');
                setLoading(false);
            }
        };

        fetchEvidence();
    }, []);

    useEffect(() => {
        const mockEvidenceData = [
            {
                id: 1,
                title: "Handgun",
                description: "A firearm found at the crime scene",
                date: "2025-04-01",
                fileUrl: "https://via.placeholder.com/300" // image
            },
            {
                id: 2,
                title: "Wallet",
                description: "A wallet containing a driver's license",
                date: "2025-04-02",
                fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4" // video
            },
            {
                id: 3,
                title: "Security Camera",
                description: "A security camera from a nearby shop",
                date: "2025-04-03",
                fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" // pdf
            }
        ];
        setEvidence(mockEvidenceData);
    }, []);

    const connectWallet = async () => {
        try {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setWalletAddress(accounts[0]);
            } else {
                alert("Please install MetaMask to use this application");
            }
        } catch (error) {
            console.error("Error connecting to wallet:", error);
        }
    };

    const viewEvidence = async (item) => {
        // Record this access in the blockchain
        if (item.ipfsHash && walletAddress) {
          try {
            await recordAccess(item.id, item.ipfsHash);
          } catch (error) {
            console.error("Failed to record access:", error);
          }
        }
        
        setViewItem(item);
        setShowViewPopup(true);
      };
      
      const recordAccess = async (evidenceId, ipfsHash) => {
        try {
          // Call your backend to record this access
          await axios.post('http://localhost:3300/recordAccess', {
            evidenceId,
            ipfsHash,
            walletAddress
          });
        } catch (error) {
          console.error("Failed to record access:", error);
        }
      };    

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
                <p>&copy; 2025 Police Evidence Management</p>
            </footer>
        </div>
    );
};

export default PoliceViewEvidence;

/**
 import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Web3 from 'web3';
import styles from './PoliceViewEvidence.module.css';

const PoliceViewEvidence = () => {
    const [evidence, setEvidence] = useState([]);
    const [selectedEvidence, setSelectedEvidence] = useState(null);
    const [web3, setWeb3] = useState(null);
    const [walletAddress, setWalletAddress] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Web3 initialization remains the same
    useEffect(() => {
        const initWeb3 = async () => {
            try {
                if (window.ethereum) {
                    const web3Instance = new Web3(window.ethereum);
                    setWeb3(web3Instance);
                    
                    try {
                        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                        setWalletAddress(accounts[0]);
                        
                        window.ethereum.on('accountsChanged', (accounts) => {
                            setWalletAddress(accounts[0]);
                        });
                    } catch (error) {
                        console.log("User denied account access");
                    }
                } else {
                    console.log("Please install MetaMask");
                }
            } catch (error) {
                console.error("Web3 init error:", error);
            }
        };

        initWeb3();
        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners('accountsChanged');
            }
        };
    }, []);

    // Fetch evidence from backend
    useEffect(() => {
        const fetchEvidence = async () => {
            try {
                const response = await axios.get('http://localhost:3300/api/evidences');
                setEvidence(response.data.map(item => ({
                    ...item,
                    // Convert MongoDB Date to readable format
                    date: new Date(item.date).toLocaleDateString()
                })));
                setLoading(false);
            } catch (err) {
                console.error("Error fetching evidence:", err);
                setError('Failed to load evidence');
                setLoading(false);
            }
        };

        fetchEvidence();
    }, []);

    // recordAccess function remains the same
    const recordAccess = async (evidenceId, ipfsHash) => {
        try {
            await axios.post('http://localhost:3300/recordAccess', {
                evidenceId,
                ipfsHash,
                walletAddress
            });
        } catch (error) {
            console.error("Record access error:", error);
        }
    };

    // viewEvidence function remains the same
    const viewEvidence = async (item) => {
        if (item.ipfsHash && walletAddress) {
            try {
                await recordAccess(item._id, item.ipfsHash);
            } catch (error) {
                console.error("Access recording failed:", error);
            }
        }
        setSelectedEvidence(item);
    };

    // renderPreview function remains the same
    const renderPreview = (fileUrl) => {
        // ... existing renderPreview implementation ...
    };

    if (loading) {
        return <div className={styles.loading}>Loading evidence...</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>View Evidence</h1>
                {walletAddress && (
                    <div className={styles.walletInfo}>
                        Connected Wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                    </div>
                )}
            </header>

            <section className={styles.evidenceSection}>
                {evidence.length === 0 ? (
                    <p className={styles.noEvidence}>No evidence found in database</p>
                ) : (
                    <ul className={styles.evidenceList}>
                        {evidence.map((item) => (
                            <li key={item._id} className={styles.evidenceItem}>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                                <p><strong>Date: </strong>{item.date}</p>
                                <button
                                    className={styles.viewBtn}
                                    onClick={() => viewEvidence(item)}
                                >
                                    View Details
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* Popup remains the same **}
            {selectedEvidence && (
                <div className={styles.popupOverlay} onClick={() => setSelectedEvidence(null)}>
                    <div className={styles.popupCard} onClick={(e) => e.stopPropagation()}>
                        <h2>{selectedEvidence.title}</h2>
                        <p>{selectedEvidence.description}</p>
                        <p><strong>Date:</strong> {selectedEvidence.date}</p>
                        {renderPreview(selectedEvidence.fileUrl)}
                        <button onClick={() => setSelectedEvidence(null)} className={styles.closeBtn}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            <footer className={styles.footer}>
                <p>&copy; 2025 Police Evidence Management</p>
            </footer>
        </div>
    );
};

export default PoliceViewEvidence;
 */