// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Crowdfunding is Ownable {
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

    uint256 public nextCampaignId;
    mapping(uint256 => Campaign) public campaigns;
    mapping(address => bool) public acceptedTokens; // Pour gérer les tokens acceptés

    event CampaignAdded(uint256 campaignId, address indexed creator, string name, uint256 goal);
    event CampaignUpdated(uint256 campaignId, address indexed creator, string name, uint256 goal);
    event Contribution(uint256 campaignId, address indexed contributor, uint256 amount, address tokenAddress);

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

}
