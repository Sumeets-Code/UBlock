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

    Evidence[] private evidences;
    uint256 private nextId = 1;

    event EvidenceRegistered(
        uint256 indexed id,
        address indexed uploader,
        uint256 timestamp,
        string ipfsHash,
        string fileType
    );

    function registerEvidence( string memory _ipfsHash, string memory _fileType ) public {
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

    function getEvidence(uint256 _id) public view returns (uint256, address, uint256, string memory, string memory) {
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