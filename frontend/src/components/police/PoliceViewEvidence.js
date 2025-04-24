import React, { useState, useEffect } from "react";
import axios from "axios";
import Web3 from "web3";
import styles from "./PoliceViewEvidence.module.css";

const PoliceViewEvidence = () => {
  const [evidence, setEvidence] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Initialize Web3 and get wallet
  useEffect(() => {
    const initWeb3 = async () => {
      try {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          try {
            const accounts = await window.ethereum.request({
              method: "eth_requestAccounts",
            });
            setWalletAddress(accounts[0]);

            window.ethereum.on("accountsChanged", (accounts) => {
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

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
      }
    };
  }, []);

  // Fetch evidence from backend
  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const response = await axios.get("http://localhost:3300/getEvidences");
        setEvidence(
          response.data.map((item) => ({
            ...item,
            date: new Date(item.date).toLocaleDateString(),
          }))
        );
        setLoading(false);
      } catch (err) {
        console.error("Error fetching evidence:", err);
        setError("Failed to load evidence");
        setLoading(false);
      }
    };

    fetchEvidence();
  }, []);

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

  const recordAccess = async (evidenceId, ipfsHash) => {
    try {
      await axios.post("http://localhost:3300/recordAccess", {
        evidenceId,
        ipfsHash,
        walletAddress,
      });
    } catch (error) {
      console.error("Record access error:", error);
    }
  };

  const renderPreview = (fileUrl) => {
    if (!fileUrl) return <p>File URL not available</p>;

    const ext = fileUrl.split(".").pop().toLowerCase();

    if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
      return (
        <img src={fileUrl} alt="evidence" className={styles.previewMedia} />
      );
    } else if (["mp4", "webm", "ogg"].includes(ext)) {
      return (
        <video controls className={styles.previewMedia}>
          <source src={fileUrl} type={`video/${ext}`} />
          Your browser does not support the video tag.
        </video>
      );
    } else if (["mp3", "wav"].includes(ext)) {
      return (
        <audio controls src={fileUrl} className={styles.previewMedia}></audio>
      );
    } else if (ext === "pdf") {
      return <iframe src={fileUrl} className={styles.previewMedia}></iframe>;
    } else {
      return <p>Unsupported file type</p>;
    }
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
            Connected Wallet: {walletAddress.substring(0, 6)}...
            {walletAddress.slice(-4)}
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
                <p>
                  <strong>Date:</strong> {item.date}
                </p>
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

      {selectedEvidence && (
        <div
          className={styles.popupOverlay}
          onClick={() => setSelectedEvidence(null)}
        >
          <div
            className={styles.popupCard}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{selectedEvidence.title}</h2>
            <p>{selectedEvidence.description}</p>
            <p>
              <strong>Date:</strong> {selectedEvidence.date}
            </p>
            {renderPreview(selectedEvidence.fileUrl)}
            <button
              onClick={() => setSelectedEvidence(null)}
              className={styles.closeBtn}
            >
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
