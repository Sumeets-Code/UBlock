// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract EvidenceVault {
    address public owner;
    mapping(address => bool) public operators;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    modifier onlyOperator() {
        require(operators[msg.sender] || msg.sender == owner, "Not operator");
        _;
    }

    struct Evidence {
        bytes32 ipfsHash;
        address uploadedBy; // MetaMask wallet of the officer who uploaded
        uint64 uploadedAt;
        uint64 lastUpdatedAt;
        bool deleted;
    }

    mapping(uint256 => Evidence) public evidences;
    uint256 public evidenceCount;

    // ── Events ───────────────────────────────────────────────────────────────

    event EvidenceRegistered(
        uint256 indexed evidenceId,
        bytes32 indexed ipfsHash,
        address indexed uploadedBy, // the user's own wallet
        string mongoId,
        string fileType,
        uint64 timestamp
    );

    event CustodyEvent(
        uint256 indexed evidenceId,
        address indexed actor,
        string action,
        string detail,
        uint64 timestamp
    );

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        operators[msg.sender] = true;
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function addOperator(address op) external onlyOwner {
        operators[op] = true;
    }
    function removeOperator(address op) external onlyOwner {
        operators[op] = false;
    }

    // ── PUBLIC: user registers their own evidence (pays gas themselves) ───────

    /**
     * @notice Called directly from the user's MetaMask wallet via the frontend.
     *         The user pays the gas; uploadedBy = their own address.
     * @param  ipfsHash  32-byte sha2-256 digest of the IPFS CID
     * @param  mongoId   MongoDB _id for backend cross-referencing
     * @param  fileType  MIME type string
     * @return evidenceId Assigned on-chain ID
     */
    function registerEvidenceByUser(
        bytes32 ipfsHash,
        string calldata mongoId,
        string calldata fileType
    ) external returns (uint256 evidenceId) {
        require(ipfsHash != bytes32(0), "Invalid IPFS hash");

        evidenceId = ++evidenceCount;
        evidences[evidenceId] = Evidence({
            ipfsHash: ipfsHash,
            uploadedBy: msg.sender, // user's wallet
            uploadedAt: uint64(block.timestamp),
            lastUpdatedAt: uint64(block.timestamp),
            deleted: false
        });

        emit EvidenceRegistered(
            evidenceId,
            ipfsHash,
            msg.sender,
            mongoId,
            fileType,
            uint64(block.timestamp)
        );
    }

    // ── OPERATOR: custody events (backend pays gas for these) ─────────────────

    function recordAccess(
        uint256 evidenceId,
        string calldata actor
    ) external onlyOperator {
        require(_exists(evidenceId), "Evidence not found");
        emit CustodyEvent(
            evidenceId,
            msg.sender,
            "ACCESSED",
            actor,
            uint64(block.timestamp)
        );
    }

    function recordCustodyEvent(
        uint256 evidenceId,
        string calldata action,
        string calldata detail
    ) external onlyOperator {
        require(_exists(evidenceId), "Evidence not found");
        evidences[evidenceId].lastUpdatedAt = uint64(block.timestamp);
        emit CustodyEvent(
            evidenceId,
            msg.sender,
            action,
            detail,
            uint64(block.timestamp)
        );
    }

    function deleteEvidence(
        uint256 evidenceId,
        string calldata deletedBy
    ) external onlyOperator {
        require(_exists(evidenceId), "Evidence not found");
        require(!evidences[evidenceId].deleted, "Already deleted");
        evidences[evidenceId].deleted = true;
        evidences[evidenceId].lastUpdatedAt = uint64(block.timestamp);
        emit CustodyEvent(
            evidenceId,
            msg.sender,
            "DELETED",
            deletedBy,
            uint64(block.timestamp)
        );
    }

    // ── View (free) ──────────────────────────────────────────────────────────

    function getEvidence(
        uint256 evidenceId
    )
        external
        view
        returns (
            bytes32 ipfsHash,
            address uploadedBy,
            uint64 uploadedAt,
            uint64 lastUpdatedAt,
            bool deleted
        )
    {
        require(_exists(evidenceId), "Evidence not found");
        Evidence storage e = evidences[evidenceId];
        return (
            e.ipfsHash,
            e.uploadedBy,
            e.uploadedAt,
            e.lastUpdatedAt,
            e.deleted
        );
    }

    function verifyIntegrity(
        uint256 evidenceId,
        bytes32 ipfsHash
    ) external view returns (bool) {
        require(_exists(evidenceId), "Evidence not found");
        return evidences[evidenceId].ipfsHash == ipfsHash;
    }

    function _exists(uint256 id) internal view returns (bool) {
        return id > 0 && id <= evidenceCount;
    }
}
