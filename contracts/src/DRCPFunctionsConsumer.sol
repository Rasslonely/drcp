// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DRCPFunctionsConsumer
 * @notice Chainlink Functions consumer for fetching AI risk scores
 * @dev Integrates with ParametricVault to update risk scores
 */
contract DRCPFunctionsConsumer is FunctionsClient, Ownable {
    using FunctionsRequest for FunctionsRequest.Request;

    // ============ State Variables ============
    
    /// @notice The vault contract to update
    address public parametricVault;
    
    /// @notice Chainlink Functions subscription ID
    uint64 public subscriptionId;
    
    /// @notice Gas limit for callback
    uint32 public callbackGasLimit = 300_000;
    
    /// @notice DON ID for the Functions network
    bytes32 public donId;
    
    /// @notice JavaScript source code for Functions
    string public sourceCode;
    
    /// @notice Mapping of request ID to request data
    mapping(bytes32 => RequestData) public requests;
    
    /// @notice Latest risk score
    uint256 public latestRiskScore;
    
    struct RequestData {
        int256 latitude;  // Scaled by 1e6
        int256 longitude; // Scaled by 1e6
        bytes32 disasterType;
        bool fulfilled;
    }

    // ============ Events ============
    
    event RiskScoreRequested(
        bytes32 indexed requestId,
        int256 latitude,
        int256 longitude,
        bytes32 disasterType
    );
    
    event RiskScoreFulfilled(
        bytes32 indexed requestId,
        uint256 severity
    );

    // ============ Errors ============
    
    error UnexpectedRequestID(bytes32 requestId);
    error RequestNotFound(bytes32 requestId);

    // ============ Constructor ============
    
    constructor(
        address _router,
        bytes32 _donId
    ) FunctionsClient(_router) Ownable(msg.sender) {
        donId = _donId;
    }

    // ============ External Functions ============
    
    /**
     * @notice Request a risk score prediction from the AI engine
     * @param _latitude Latitude scaled by 1e6 (e.g., -6208800 for -6.2088)
     * @param _longitude Longitude scaled by 1e6
     * @param _disasterType Disaster type ("FLOOD", "EARTHQUAKE", "WILDFIRE")
     */
    function requestRiskScore(
        int256 _latitude,
        int256 _longitude,
        bytes32 _disasterType
    ) external onlyOwner returns (bytes32 requestId) {
        // Build the request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(sourceCode);
        
        // Add arguments
        string[] memory args = new string[](3);
        args[0] = _int256ToString(_latitude, 6);  // e.g., "-6.2088"
        args[1] = _int256ToString(_longitude, 6); // e.g., "106.8456"
        args[2] = _bytes32ToString(_disasterType);
        req.setArgs(args);
        
        // Send request
        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            callbackGasLimit,
            donId
        );
        
        // Store request data
        requests[requestId] = RequestData({
            latitude: _latitude,
            longitude: _longitude,
            disasterType: _disasterType,
            fulfilled: false
        });
        
        emit RiskScoreRequested(requestId, _latitude, _longitude, _disasterType);
    }
    
    /**
     * @notice Callback function for Chainlink Functions
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        RequestData storage req = requests[requestId];
        
        if (req.latitude == 0 && req.longitude == 0) {
            revert RequestNotFound(requestId);
        }
        
        if (err.length > 0) {
            // Handle error - could emit event or store error
            return;
        }
        
        // Decode severity score
        uint256 severity = abi.decode(response, (uint256));
        latestRiskScore = severity;
        req.fulfilled = true;
        
        emit RiskScoreFulfilled(requestId, severity);
        
        // TODO: Call ParametricVault.updateRiskScore() here
    }

    // ============ Admin Functions ============
    
    function setSubscriptionId(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }
    
    function setSourceCode(string memory _sourceCode) external onlyOwner {
        sourceCode = _sourceCode;
    }
    
    function setParametricVault(address _vault) external onlyOwner {
        parametricVault = _vault;
    }
    
    function setCallbackGasLimit(uint32 _gasLimit) external onlyOwner {
        callbackGasLimit = _gasLimit;
    }

    // ============ Internal Helpers ============
    
    function _int256ToString(int256 value, uint8 decimals) internal pure returns (string memory) {
        bool negative = value < 0;
        uint256 absValue = negative ? uint256(-value) : uint256(value);
        
        uint256 divisor = 10 ** decimals;
        uint256 intPart = absValue / divisor;
        uint256 fracPart = absValue % divisor;
        
        string memory sign = negative ? "-" : "";
        
        // Simple conversion (full implementation would handle all cases)
        return string(abi.encodePacked(
            sign,
            _uintToString(intPart),
            ".",
            _uintToString(fracPart)
        ));
    }
    
    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
    
    function _bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
}
