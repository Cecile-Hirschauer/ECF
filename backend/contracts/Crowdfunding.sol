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

    function addCampaign(
        uint256 _goal,
        string memory _name,
        string memory _description,
        string memory _imageUrl
    ) external {
        require(_goal > 0, "Crowdfunding: goal must be greater than 0");
        require(bytes(_name).length > 0, "Crowdfunding: name cannot be empty");
        require(bytes(_description).length > 0, "Crowdfunding: description cannot be empty");
        require(bytes(_imageUrl).length > 0, "Crowdfunding: imageUrl cannot be empty");

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
}
