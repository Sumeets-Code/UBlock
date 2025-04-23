// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Ublock {
    struct Evidence {
        uint256 id;
        address uploader;
        uint256 timestamp;
        string ipfsHash;
        string fileType;
    }

    struct AccessLog {
        address user;
        uint256 timestamp;
        uint256 evidenceId;
    }

    Evidence[] private evidences;
    AccessLog[] private accessLogs;
    uint256 private nextId = 1;

    // Mapping from evidence ID to array of access log indices
    mapping(uint256 => uint256[]) private evidenceToAccessLogs;

    event EvidenceRegistered(
        uint256 indexed id,
        address indexed uploader,
        uint256 timestamp,
        string ipfsHash,
        string fileType
    );

    event EvidenceAccessed(
        uint256 indexed evidenceId,
        address indexed user,
        uint256 timestamp
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
            })
        );

        emit EvidenceRegistered(
            nextId,
            msg.sender,
            block.timestamp,
            _ipfsHash,
            _fileType
        );

        nextId++;
    }

    function getEvidence(uint256 _id) public returns (uint256, address, uint256, string memory, string memory) {
        require(_id > 0 && _id < nextId, "Invalid evidence ID");

        // Log this access
        _logAccess(_id);

        Evidence memory evidence = evidences[_id - 1];

        return (
            evidence.id,
            evidence.uploader,
            evidence.timestamp,
            evidence.ipfsHash,
            evidence.fileType
        );
    }

    // Internal function to log access
    function _logAccess(uint256 _evidenceId) internal {
        uint256 logIndex = accessLogs.length;
        
        accessLogs.push(
            AccessLog({
                user: msg.sender,
                timestamp: block.timestamp,
                evidenceId: _evidenceId
            })
        );
        
        evidenceToAccessLogs[_evidenceId].push(logIndex);
        
        emit EvidenceAccessed(_evidenceId, msg.sender, block.timestamp);
    }

    // Function to record access externally (e.g., when viewing on IPFS directly)
    function recordAccess(uint256 _evidenceId) public {
        require(_evidenceId > 0 && _evidenceId < nextId, "Invalid evidence ID");
        _logAccess(_evidenceId);
    }

    function getAccessLogs(uint256 _evidenceId) public view returns (address[] memory, uint256[] memory) {
        require(_evidenceId > 0 && _evidenceId < nextId, "Invalid evidence ID");
        
        uint256[] memory logIndices = evidenceToAccessLogs[_evidenceId];
        address[] memory users = new address[](logIndices.length);
        uint256[] memory timestamps = new uint256[](logIndices.length);
        
        for (uint256 i = 0; i < logIndices.length; i++) {
            AccessLog memory log = accessLogs[logIndices[i]];
            users[i] = log.user;
            timestamps[i] = log.timestamp;
        }
        
        return (users, timestamps);
    }

    function getAllAccessLogs() public view returns (address[] memory, uint256[] memory, uint256[] memory) {
        address[] memory users = new address[](accessLogs.length);
        uint256[] memory timestamps = new uint256[](accessLogs.length);
        uint256[] memory evidenceIds = new uint256[](accessLogs.length);
        
        for (uint256 i = 0; i < accessLogs.length; i++) {
            users[i] = accessLogs[i].user;
            timestamps[i] = accessLogs[i].timestamp;
            evidenceIds[i] = accessLogs[i].evidenceId;
        }
        
        return (users, timestamps, evidenceIds);
    }

    function getTotalEvidences() public view returns (uint256) {
        return evidences.length;
    }
    
    function getTotalAccessLogs() public view returns (uint256) {
        return accessLogs.length;
    }
    
    function getTotalAccessLogsForEvidence(uint256 _evidenceId) public view returns (uint256) {
        require(_evidenceId > 0 && _evidenceId < nextId, "Invalid evidence ID");
        return evidenceToAccessLogs[_evidenceId].length;
    }
}