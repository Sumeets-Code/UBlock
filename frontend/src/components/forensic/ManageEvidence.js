import React, { useState, useEffect } from "react";
import styles from "./ManageEvidence.module.css";
import axios from "axios";
import Web3 from "web3";

function ManageEvidence() {
  const [evidenceItems, setEvidenceItems] = useState([
    {
      id: 1,
      timestamp: "2025-04-18 08:45:00",
      description: "Fingerprint on knife",
      file: null,
    },
    {
      id: 2,
      timestamp: "2025-04-18 09:00:00",
      description: "CCTV footage from hallway",
      file: null,
    },
    {
      id: 3,
      timestamp: "2025-04-18 09:30:00",
      description: "Email conversation with suspect",
      file: null,
    },
  ]);

  const [newDescription, setNewDescription] = useState("");
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [web3, setWeb3] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Initialize Web3 and connect to MetaMask on component mount
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

  // Fetch evidence items from backend on component mount
  useEffect(() => {
    const fetchEvidenceItems = async () => {
      try {
        const response = await axios.get('http://localhost:3300/viewEvidence', {evidenceId});
        if (response.data && response.data.success) {
          setEvidenceItems(response.data.evidence);
        }
      } catch (error) {
        console.error("Error fetching evidence items:", error);
      }
    };

    fetchEvidenceItems();
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

  const addEvidence = () => {
    if (newDescription.trim() === "") return;
    
    // Check if wallet is connected
    if (!walletAddress) {
      alert("Please connect your MetaMask wallet first");
      return;
    }
    
    const newId = Date.now();
    const newEvidence = {
      id: newId,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      description: newDescription,
      file: null,
    };
    
    // Add new evidence to local state
    setEvidenceItems([...evidenceItems, newEvidence]);
    setNewDescription("");
    setSelectedEvidenceId(newId);
    setShowUploadPopup(true);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Store the actual file object for upload
    setSelectedFile(file);
    
    // Create a URL for preview
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
  };

  const uploadToBackend = async () => {
    if (!selectedFile || !walletAddress) return;
    
    setIsUploading(true);
    setUploadError("");
    setUploadSuccess(false);
    
    try {
      // Create form data for the file upload
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("description", evidenceItems.find(item => item.id === selectedEvidenceId)?.description || "");
      formData.append("walletAddress", walletAddress);
      formData.append("evidenceId", selectedEvidenceId);
      
      // Get file type
      const fileType = selectedFile.type;
      formData.append("fileType", fileType);
      
      // Upload to backend
      const response = await axios.post('http://localhost:3300/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Check if upload was successful
      if (response.data && response.data.success) {
        const { ipfsHash, transactionHash } = response.data;
        
        // Update the evidence item with IPFS and blockchain information
        setEvidenceItems(prev => 
          prev.map(item => 
            item.id === selectedEvidenceId 
              ? { 
                  ...item, 
                  file: previewUrl,
                  ipfsHash,
                  transactionHash,
                  status: "Secured"
                } 
              : item
          )
        );
        
        setUploadSuccess(true);
        
        // Close popup after short delay to show success message
        setTimeout(() => {
          closeUploadPopup();
        }, 2000);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError(error.response?.data?.message || "Failed to upload evidence file");
    } finally {
      setIsUploading(false);
    }
  };

  const closeUploadPopup = () => {
    setShowUploadPopup(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError("");
    setUploadSuccess(false);
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

  const closeViewPopup = () => {
    setShowViewPopup(false);
    setViewItem(null);
  };

  const downloadFile = async (fileUrl, id, ipfsHash) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `evidence_${id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Record this download access
    if (ipfsHash && walletAddress) {
      try {
        await recordAccess(id, ipfsHash);
      } catch (error) {
        console.error("Failed to record download access:", error);
      }
    }
  };

  const getAccessLogs = async (evidenceId) => {
    try {
      const response = await axios.get(`http://localhost:3300/getLogs?evidenceId=${evidenceId}`);
      if (response.data && response.data.success) {
        // Display access logs (you could show them in a new popup or panel)
        console.log("Access logs:", response.data.accessLogs);
        alert(`This evidence has been accessed ${response.data.totalViews} times.`);
      }
    } catch (error) {
      console.error("Failed to fetch access logs:", error);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Manage Evidence</h1>
        <div className={styles.walletInfo}>
          {walletAddress ? (
            <div className={styles.connected}>
              <span className={styles.dot}></span>
              <span className={styles.address}>
                {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
              </span>
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.connectBtn}>
              Connect Wallet
            </button>
          )}
        </div>
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
          <button onClick={addEvidence} className={styles.button}>
            Add Evidence
          </button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {evidenceItems.map((item) => (
              <tr key={item.id}>
                <td>{item.timestamp}</td>
                <td>{item.description}</td>
                <td>{item.ipfsHash ? "Secured" : "Pending"}</td>
                <td className={styles.actions}>
                  <button
                    onClick={() => viewEvidence(item)}
                    className={styles.actionBtn}
                    disabled={!item.file}
                  >
                    View
                  </button>
                  {item.ipfsHash && (
                    <button
                      onClick={() => getAccessLogs(item.id)}
                      className={styles.logsBtn}
                    >
                      Logs
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showUploadPopup && (
          <div className={styles.popupOverlay}>
            <div className={styles.popupCard}>
              <h2>Upload Evidence File</h2>
              <input
                type="file"
                onChange={handleFileUpload}
                className={styles.fileInput}
              />
              {selectedFile && (
                <div className={styles.uploadActions}>
                  <p className={styles.uploadNotice}>File selected: {selectedFile.name}</p>
                  {previewUrl && selectedFile.type.startsWith('image/') && (
                    <img src={previewUrl} alt="Preview" className={styles.previewImage} style={{maxHeight: '150px'}} />
                  )}
                  <button 
                    onClick={uploadToBackend} 
                    className={`${styles.uploadBtn} ${isUploading ? styles.uploading : ''}`}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload to Blockchain'}
                  </button>
                </div>
              )}
              {uploadError && <p className={styles.errorMessage}>{uploadError}</p>}
              {uploadSuccess && <p className={styles.successMessage}>Evidence successfully stored on blockchain!</p>}
              <button onClick={closeUploadPopup} className={styles.closeBtn}>
                {uploadSuccess ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {showViewPopup && viewItem && (
          <div className={styles.popupOverlay}>
            <div className={styles.popupCard}>
              <h2>Evidence Details</h2>
              <p>
                <strong>ID:</strong> {viewItem.id}
              </p>
              <p>
                <strong>Timestamp:</strong> {viewItem.timestamp}
              </p>
              <p>
                <strong>Description:</strong> {viewItem.description}
              </p>
              {viewItem.ipfsHash && (
                <p>
                  <strong>IPFS Hash:</strong> {viewItem.ipfsHash}
                </p>
              )}
              {viewItem.transactionHash && (
                <p>
                  <strong>Blockchain TX:</strong> {viewItem.transactionHash.substring(0, 10)}...
                </p>
              )}
              {viewItem.file && (
                <>
                  {viewItem.file.endsWith(".mp4") ||
                  viewItem.file.endsWith(".webm") ? (
                    <video controls className={styles.previewMedia}>
                      <source src={viewItem.file} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : viewItem.file.endsWith(".mp3") ||
                    viewItem.file.endsWith(".wav") ? (
                    <audio controls className={styles.previewMedia}>
                      <source src={viewItem.file} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  ) : viewItem.file.endsWith(".txt") ||
                    viewItem.file.endsWith(".pdf") ? (
                    <a
                      href={viewItem.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.textLink}
                    >
                      View Text/PDF File
                    </a>
                  ) : (
                    <img
                      src={viewItem.file}
                      alt="Evidence"
                      className={styles.previewImage}
                    />
                  )}
                  <button
                    onClick={() => downloadFile(viewItem.file, viewItem.id, viewItem.ipfsHash)}
                    className={styles.actionBtn}
                  >
                    Download File
                  </button>
                </>
              )}
              <button onClick={closeViewPopup} className={styles.closeBtn}>
                Close
              </button>
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