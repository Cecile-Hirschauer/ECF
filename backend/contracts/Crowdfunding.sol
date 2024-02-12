// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Crowdfunding is Ownable, ReentrancyGuard {
    struct Campaign {
        address creator;
        uint256 goal;
        uint256 raisedAmount;
        bool isSuccessful;
        bool isActive;
        string name;
        string description;
        string imageUrl;
    }

    struct Contribution {
        uint256 amount;
        address tokenAddress;
    }

    uint256 public nextCampaignId;
    mapping(uint256 => Campaign) public campaigns;
    mapping(address => bool) public acceptedTokens;
    mapping(uint256 => mapping(address => Contribution)) public contributions;


    event CampaignAdded(uint256 campaignId, address indexed creator, string name, uint256 goal);
    event CampaignUpdated(uint256 campaignId, address indexed creator, string name, uint256 goal);
    event TokenAuthorisationChanged(address indexed tokenAddress, bool isAuthorised);
    event CampaignSuccessStatusChanged(uint256 campaignId, bool status);
    event ContributionMade(uint256 campaignId, address indexed contributor, uint256 amount, address tokenAddress);
    event Refunded(uint256 campaignId, address indexed contributor, uint256 amount, address tokenAddress);


    constructor() Ownable(msg.sender){}

    // ************* CAMPAIGN MANAGEMENT ************* //

    function validateCampaignParameters(
        uint256 _goal,
        string memory _name,
        string memory _description,
        string memory _imageUrl
    ) internal pure {
        require(_goal > 0, "Crowdfunding: goal must be greater than 0");
        require(bytes(_name).length > 0, "Crowdfunding: name cannot be empty");
        require(bytes(_description).length > 0, "Crowdfunding: description cannot be empty");
        require(bytes(_imageUrl).length > 0, "Crowdfunding: imageUrl cannot be empty");
    }

    function addCampaign(uint256 _goal, string calldata _name, string calldata _description, string calldata _imageUrl) external {
        validateCampaignParameters(_goal, _name, _description, _imageUrl);

        campaigns[nextCampaignId] = Campaign({
            creator: msg.sender,
            goal: _goal,
            raisedAmount: 0,
            isSuccessful: false,
            isActive: true,
            name: _name,
            description: _description,
            imageUrl: _imageUrl
        });

        emit CampaignAdded(nextCampaignId, msg.sender, _name, _goal);
        nextCampaignId++;
    }

    function updateCampaign(uint256 _campaignId, uint256 _goal, string calldata _name, string calldata _description, string calldata _imageUrl) external {
        require(campaigns[_campaignId].isActive, "Campaign does not exist");
        require(msg.sender == campaigns[_campaignId].creator || msg.sender == owner(), "Caller is not the creator or the owner");

        validateCampaignParameters(_goal, _name, _description, _imageUrl);

        campaigns[_campaignId].goal = _goal;
        campaigns[_campaignId].name = _name;
        campaigns[_campaignId].description = _description;
        campaigns[_campaignId].imageUrl = _imageUrl;

        emit CampaignUpdated(_campaignId, msg.sender, _name, _goal);
    }

    function modifyCampaignSuccessStatus(uint256 _campaignId, bool _status) external {
        require(msg.sender == owner() || msg.sender == campaigns[_campaignId].creator, "Caller is not the creator or the owner");
        require(campaigns[_campaignId].isActive, "Campaign does not exist");

        campaigns[_campaignId].isSuccessful = _status;

        emit CampaignSuccessStatusChanged(_campaignId, _status);
    }


    function getCampaign(uint256 _campaignId) external view returns (
        address creator,
        uint256 goal,
        uint256 raisedAmount,
        bool isSuccessful,
        bool isActive,
        string memory name,
        string memory description,
        string memory imageUrl
    ) {
        require(campaigns[_campaignId].isActive, "Campaign does not exist");
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.creator,
            campaign.goal,
            campaign.raisedAmount,
            campaign.isSuccessful,
            campaign.isActive,
            campaign.name,
            campaign.description,
            campaign.imageUrl
        );
    }

    // ************* TOKEN MANAGEMENT ************* //
    function setAuthorisedToken(address _tokenAddress, bool _isAuthorised) external onlyOwner {
        acceptedTokens[_tokenAddress] = _isAuthorised;
        emit TokenAuthorisationChanged(_tokenAddress, _isAuthorised);
    }

    function unsetAuthorisedToken(address _tokenAddress) external onlyOwner {
        acceptedTokens[_tokenAddress] = false;
        emit TokenAuthorisationChanged(_tokenAddress, false);
    }

    function isAuthorisedToken(address _tokenAddress) external view returns (bool) {
        return acceptedTokens[_tokenAddress];
    }
    // ************* CONTRIBUTION ************* //
    function contributeWithToken(uint256 _campaignId, uint256 _amount, address _tokenAddress) external {
        require(campaigns[_campaignId].isActive && !campaigns[_campaignId].isSuccessful, "Campaign is not active or already successful");
        require(_amount > 0, "Amount must be greater than 0");
        require(acceptedTokens[_tokenAddress], "Token not accepted");

        IERC20 token = IERC20(_tokenAddress);
        token.transferFrom(msg.sender, address(this), _amount);

        contributions[_campaignId][msg.sender] = Contribution({
            amount: _amount,
            tokenAddress: _tokenAddress // Corrigez ici
        });
        campaigns[_campaignId].raisedAmount += _amount;

        emit ContributionMade(_campaignId, msg.sender, _amount, _tokenAddress); // C'est correct
    }

    function contributeWithEther(uint256 _campaignId) external payable {
        require(campaigns[_campaignId].isActive && !campaigns[_campaignId].isSuccessful, "Campaign is not active or already successful");
        require(msg.value > 0, "Amount must be greater than 0");

        contributions[_campaignId][msg.sender] = Contribution({
            amount: msg.value,
            tokenAddress: address(0)
        });

        campaigns[_campaignId].raisedAmount += msg.value;
        emit ContributionMade(_campaignId, msg.sender, msg.value, address(0)); // C'est correct
    }


    function refund(uint256 _campaignId) external nonReentrant {
        require(!campaigns[_campaignId].isSuccessful, "Campaign is successful, no refunds");
        Contribution memory contrib = contributions[_campaignId][msg.sender];
        require(contrib.amount > 0, "No contribution to refund");

        if (contrib.tokenAddress == address(0)) { // Ether
            payable(msg.sender).transfer(contrib.amount);
        } else { // Tokens ERC20
            IERC20 token = IERC20(contrib.tokenAddress);
            require(token.transfer(msg.sender, contrib.amount), "Failed to refund token contribution");

            contributions[_campaignId][msg.sender].amount = 0;

        }
        emit Refunded(_campaignId, msg.sender, contrib.amount, contrib.tokenAddress);


    }
}
