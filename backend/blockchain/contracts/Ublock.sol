// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EvidenceProtection {
    struct Evidence {
        uint256 id;
        string ipfsHash;       // IPFS CID of the evidence file
        string fileType;       // e.g., "PDF", "JPEG"
        address uploader;      // Address of the uploader
        uint256 timestamp;     // Block timestamp of upload
    }

    struct AccessLog {
        address accessor;      // Address of the user accessing the evidence
        uint256 timestamp;     // Block timestamp of access
    }

    // Storage
    Evidence[] private _evidences;
    mapping(uint256 => AccessLog[]) private _accessLogs;
    uint256 private _nextId = 1;

    // Events
    event EvidenceRegistered(
        uint256 indexed id,
        string ipfsHash,
        address indexed uploader,
        uint256 timestamp
    );
    event EvidenceAccessed(
        uint256 indexed id,
        address indexed accessor,
        uint256 timestamp
    );

    // Modifiers
    modifier validEvidence(uint256 _id) {
        require(_id > 0 && _id < _nextId, "Invalid evidence ID");
        _;
    }

    // Register new evidence
    function registerEvidence(
        string memory _ipfsHash,
        string memory _fileType
    ) external {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_fileType).length > 0, "File type cannot be empty");

        _evidences.push(Evidence({
            id: _nextId,
            ipfsHash: _ipfsHash,
            fileType: _fileType,
            uploader: msg.sender,
            timestamp: block.timestamp
        }));

        emit EvidenceRegistered(_nextId, _ipfsHash, msg.sender, block.timestamp);
        _nextId++;
    }

    // Get evidence metadata
    function getEvidence(uint256 _id)
        external
        view
        validEvidence(_id)
        returns (Evidence memory)
    {
        return _evidences[_id - 1];
    }

    // Log access to evidence (call this when a user views/downloads evidence)
    function logAccess(uint256 _id)
        external
        validEvidence(_id)
    {
        _accessLogs[_id].push(AccessLog({
            accessor: msg.sender,
            timestamp: block.timestamp
        }));
        emit EvidenceAccessed(_id, msg.sender, block.timestamp);
    }

    // Get access logs for an evidence (paginated to avoid gas limits)
    function getAccessLogs(
        uint256 _id,
        uint256 _start,
        uint256 _limit
    )
        external
        view
        validEvidence(_id)
        returns (AccessLog[] memory)
    {
        AccessLog[] memory logs = _accessLogs[_id];
        uint256 end = _start + _limit;
        require(end <= logs.length, "Exceeds log length");

        AccessLog[] memory result = new AccessLog[](_limit);
        for (uint256 i = 0; i < _limit; i++) {
            result[i] = logs[_start + i];
        }
        return result;
    }

    // Get total evidence count
    function getTotalEvidences() external view returns (uint256) {
        return _evidences.length;
    }
}