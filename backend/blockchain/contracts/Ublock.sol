// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// NO CONTRACT IS FINALIZED YET

// Issue: The contract is not properly deployed because the constructor is not called.

contract EvidenceTamperProtection {
    struct Evidence {
        string description;
        bytes32 hash; // Hash of the evidence file
        uint256 timestamp;
        address submittedBy;
    }

    mapping(uint256 => Evidence) public evidences;
    uint256 public evidenceCount;

    event EvidenceSubmitted(uint256 indexed evidenceId, string description, bytes32 hash, address indexed submittedBy);

    // Function to submit evidence
    function submitEvidence(string memory _description, bytes32 _hash) public {
        evidenceCount++;
        evidences[evidenceCount] = Evidence(_description, _hash, block.timestamp, msg.sender);
        emit EvidenceSubmitted(evidenceCount, _description, _hash, msg.sender);
    }

    // Function to verify evidence
    function verifyEvidence(uint256 _evidenceId, string memory _description, bytes32 _hash) public view returns (bool) {
        Evidence memory evidence = evidences[_evidenceId];
        return (evidence.hash == _hash && keccak256(abi.encodePacked(evidence.description)) == keccak256(abi.encodePacked(_description)));
    }
}

/* 
2nd code alernative:

pragma solidity ^0.8.0;

contract EvidenceStorage {
    struct Evidence {
        string ipfsHash;
        address uploader;
        uint256 timestamp;
    }

    mapping(uint256 => Evidence) public evidences;
    uint256 public evidenceCount;

    event EvidenceUploaded(uint256 indexed evidenceId, string ipfsHash, address indexed uploader, uint256 timestamp);

    function uploadEvidence(string memory _ipfsHash) public {
        evidenceCount++;
        evidences[evidenceCount] = Evidence(_ipfsHash, msg.sender, block.timestamp);
        emit EvidenceUploaded(evidenceCount, _ipfsHash, msg.sender, block.timestamp);
    }

    function getEvidence(uint256 _evidenceId) public view returns (string memory, address, uint256) {
        Evidence memory evidence = evidences[_evidenceId];
        return (evidence.ipfsHash, evidence.uploader, evidence.timestamp);
    }
}


3rd code alernative:

pragma solidity ^0.8.0;

contract EvidenceStorage {
    struct Evidence {
        string ipfsHash;
        address uploader;
        uint256 timestamp;
    }

    mapping(uint256 => Evidence) public evidences;
    uint256 public evidenceCount;

    event EvidenceUploaded(uint256 indexed evidenceId, string ipfsHash, address indexed uploader, uint256 timestamp);

    function uploadEvidence(string memory _ipfsHash) public {
        evidenceCount++;
        evidences[evidenceCount] = Evidence({
            ipfsHash: _ipfsHash,
            uploader: msg.sender,
            timestamp: block.timestamp
        });

        emit EvidenceUploaded(evidenceCount, _ipfsHash, msg.sender, block.timestamp);
    }

    function getEvidence(uint256 _evidenceId) public view returns (string memory, address, uint256) {
        Evidence memory evidence = evidences[_evidenceId];
        return (evidence.ipfsHash, evidence.uploader, evidence.timestamp);
    }
}


4th code alernative: Deepseek code

pragma solidity ^0.8.0;

contract EvidenceRegistry {
    struct Evidence {
        uint256 id;
        address uploader;
        uint256 timestamp;
        string ipfsHash;
        string fileType;
    }

    Evidence[] private evidences;
    uint256 private nextId = 1;

    event EvidenceRegistered(
        uint256 indexed id,
        address indexed uploader,
        uint256 timestamp,
        string ipfsHash,
        string fileType
    );

    function registerEvidence(string memory _ipfsHash, string memory _fileType) public {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_fileType).length > 0, "File type cannot be empty");

        evidences.push(
        Evidence({
            id: nextId,
            uploader: msg.sender,
            timestamp: block.timestamp,
            ipfsHash: _ipfsHash,
            fileType: _fileType
        }));

        emit EvidenceRegistered(
            nextId,
            msg.sender,
            block.timestamp,
            _ipfsHash,
            _fileType
        );

        nextId++;
    }

    function getEvidence(uint256 _id) public view returns (uint256,address,uint256,string memory,string memory) {
        require(_id > 0 && _id < nextId, "Invalid evidence ID");

        Evidence memory evidence = evidences[_id - 1];
        return (
            evidence.id,
            evidence.uploader,
            evidence.timestamp,
            evidence.ipfsHash,
            evidence.fileType
        );
    }

    function getTotalEvidences() public view returns (uint256) {
        return evidences.length;
    }
}


# Schema for Evidence protection: 
A structure to store evidence metadata:

Unique ID
Uploader's address
Timestamp of registration
IPFS hash
File type


5th code alernative: 

pragma solidity ^0.8.0;

contract EvidenceStorage {
    struct Evidence {
        string ipfsHash;
        address uploader;
        uint256 timestamp;
    }

    mapping(uint256 => Evidence) public evidences;
    uint256 public evidenceCount;

    event EvidenceUploaded(uint256 indexed evidenceId, string ipfsHash, address indexed uploader, uint256 timestamp);

    function uploadEvidence(string memory _ipfsHash) public {
        evidenceCount++;
        evidences[evidenceCount] = Evidence({
            ipfsHash: _ipfsHash,
            uploader: msg.sender,
            timestamp: block.timestamp
        });

        emit EvidenceUploaded(evidenceCount, _ipfsHash, msg.sender, block.timestamp);
    }

    function getEvidence(uint256 _evidenceId) public view returns (string memory, address, uint256) {
        Evidence memory evidence = evidences[_evidenceId];
        return (evidence.ipfsHash, evidence.uploader, evidence.timestamp);
    }
}


Backend Code:

Uploads files to IPFS (using libraries like ipfs-http-client).
Stores the IPFS hash in MongoDB along with any other relevant metadata


// Backend code to be implemented on the api part:

const express = require('express');
const { create } = require('ipfs-http-client');
const Web3 = require('web3');
const mongoose = require('mongoose');
const Evidence = require('./models/Evidence'); // Mongoose model for MongoDB

const app = express();
const ipfs = create({ url: 'https://ipfs.infura.io:5001' });
const web3 = new Web3('YOUR_ETHEREUM_NODE_URL');
const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

app.use(express.json());

app.post('/upload', async (req, res) => {
    const { file } = req.body; // Assume file is base64 encoded or similar

    // Upload to IPFS
    const { path } = await ipfs.add(file);
    const ipfsHash = path;

    // Store in MongoDB
    const evidence = new Evidence({ ipfsHash, uploader: req.user.id });
    await evidence.save();

    // Call smart contract to store the hash
    const accounts = await web3.eth.getAccounts();
    await contract.methods.uploadEvidence(ipfsHash).send({ from: accounts[0] });

    res.json({ ipfsHash });
});

app.get('/evidence/:id', async (req, res) => {
    const evidenceId = req.params.id;
    const [ipfsHash, uploader, timestamp] = await Evidence.findById(evidenceId);
    
    res.json({ ipfsHash, uploader, timestamp });
    })
    res.json(evidences[evidenceId]);
    // Return the evidence object if it exists in MongoDB
} else {
res.status(404).json({ error: 'Evidence not found' });
})();

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

*/