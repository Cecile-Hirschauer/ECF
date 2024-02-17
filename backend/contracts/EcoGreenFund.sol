// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

    error CrowdFunding__WithdrawFailed();


contract EcoGreenFund is  ReentrancyGuard {
    IERC20 public leafToken;

    struct CampaignInfo {
        string name;
        string description;
        string image;
        address payable creator;
        uint256 startAt;
        uint256 endAt;
        uint32 id;
        uint256 targetAmount;
        uint256 amountCollected;
        uint256 amountWithdrawnByOwner;
        bool claimedByOwner;
        bool isActive;
    }


    uint256 private constant THIRTY_DAYS = 2592000; // 30 * 86400
    uint256 public constant RATE = 100; // 100 LEAF pour 1 ETH

    uint32 private campaignsCount;
    mapping(uint256 campaignId => CampaignInfo) public campaigns;
    mapping(address creator => CampaignInfo[] campaigns) public campaignCreatedBy;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    mapping(uint256 => mapping(address => bool)) public rewardsClaimed;


    event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint256 indexed targetAmount, uint256 startAt, uint256 endAt);
    event CampaignFunded(uint256 indexed campaignId, address indexed funder, uint256 indexed amount);
    event WithdrawSuccessful(uint256 indexed campaignId, address indexed owner, uint256 indexed amount);
    event RefundIssued(uint256 indexed campaignId, address indexed funder, uint256 indexed amount);
    event RewardClaimed(address indexed claimant, uint256 indexed campaignId, uint256 reward);


    constructor(address _leafToken) {
        leafToken = IERC20(_leafToken);
    }

    modifier onlyCreator(uint256 campaignId) {
        require(campaigns[campaignId].creator == msg.sender, "Only the campaign creator can call this function.");
        _;
    }

    modifier onlyContributor(uint256 campaignId) {
        require(contributions[campaignId][msg.sender] > 0, "Not a contributor");
        _;
    }


    function createCampaign(
        string memory _name,
        string memory _description,
        uint256 _targetAmount,
        uint256 _startAt,
        uint256 _endAt,
        string memory _image
    ) external returns (uint256) {
        require(_startAt < _endAt, "End date should be after start date");
        require(bytes(_name).length != 0, "Name cannot be empty");
        require(bytes(_description).length != 0, "Description cannot be empty");
        require(bytes(_image).length != 0, "Image URL cannot be empty");
        require(_targetAmount > 0, "Target amount should be greater than zero");

        CampaignInfo storage newCampaign = campaigns[campaignsCount];
        newCampaign.creator = payable(msg.sender);
        newCampaign.name = _name;
        newCampaign.description = _description;
        newCampaign.targetAmount = _targetAmount;
        newCampaign.amountCollected = 0;
        newCampaign.amountWithdrawnByOwner = 0;
        newCampaign.startAt = block.timestamp;
        newCampaign.endAt = _endAt;
        newCampaign.image = _image;
        newCampaign.claimedByOwner = false;
        newCampaign.isActive = true;
        newCampaign.id = uint32(campaignsCount);

        campaignCreatedBy[msg.sender].push(newCampaign);

        emit CampaignCreated(campaignsCount, msg.sender, _targetAmount, block.timestamp, _endAt);
        campaignsCount++;
        return campaignsCount;

    }

    function getCampaignsCount() public view returns (uint256) {
        return campaignsCount;
    }



    function toggleCampaignStatus(uint256 campaignId) external onlyCreator(campaignId) {
        CampaignInfo storage campaign = campaigns[campaignId];
        campaign.isActive = !campaign.isActive;
    }


    function fundCampaign(uint256 campaignId) external payable {
        require(msg.value > 0, "Amount must be greater than zero");
        CampaignInfo storage campaign = campaigns[campaignId];
        require(campaigns[campaignId].claimedByOwner, "Campaign already funded");
        require(campaign.isActive, "Campaign is not active");
        require(block.timestamp < campaign.endAt, "Campaign is expired");

        // Utilisez directement le mapping `contributions` pour mettre à jour la contribution.
        uint256 currentContribution = contributions[campaignId][msg.sender];
        contributions[campaignId][msg.sender] = currentContribution + msg.value;

        if (currentContribution == 0) {
            // Ici, vous pouvez augmenter `uniqueContributorsCount` si nécessaire.
            // Notez que si vous avez besoin de suivre le nombre unique de contributeurs,
            // vous devriez gérer cela séparément car `CampaignInfo` n'a pas ce champ maintenant.
        }

        // Mettez à jour `amountCollected` dans `CampaignInfo`.
        campaign.amountCollected += msg.value;

        emit CampaignFunded(campaignId, msg.sender, msg.value);
    }



    function withdraw(uint256 campaignId) external nonReentrant onlyCreator(campaignId) {
        address creator = campaigns[campaignId].creator;
        uint256 currentTime = block.timestamp;
        uint256 campaignEndTime = campaigns[campaignId].endAt;

        require(currentTime < campaignEndTime, 'Campaign is not ended');
        require(campaigns[campaignId].claimedByOwner, 'Amount already withdrawn');
        require(campaigns[campaignId].amountCollected == 0, 'Balance is equal to zero');

        campaigns[campaignId].claimedByOwner = true;

        uint256 totalAmount = campaigns[campaignId].amountCollected;

        campaigns[campaignId].amountWithdrawnByOwner = totalAmount;
        campaigns[campaignId].amountCollected = 0;

        emit WithdrawSuccessful(campaignId, msg.sender, totalAmount);

        (bool success,) = creator.call{value: totalAmount}("");
        if (!success) {
            revert CrowdFunding__WithdrawFailed();
        }
    }

    function refund(uint256 campaignId) external nonReentrant onlyContributor(campaignId) {
        CampaignInfo storage campaign = campaigns[campaignId];

        require(block.timestamp > campaign.endAt, 'Campaign is not ended');
        uint256 contributedAmount = contributions[campaignId][msg.sender];
        require(contributedAmount > 0, 'No contribution found');

        bool isRefundDueToFailure = campaign.amountCollected < campaign.targetAmount;
        bool isRefundDueToSurplus = campaign.amountCollected > campaign.targetAmount && !campaign.claimedByOwner;

        require(isRefundDueToFailure || isRefundDueToSurplus, 'No refund condition met');

        uint256 refundAmount = contributedAmount;

        contributions[campaignId][msg.sender] = 0;

        (bool success,) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund failed");

        if (isRefundDueToSurplus) {
            campaign.amountCollected -= refundAmount;
        }
        emit RefundIssued(campaignId, msg.sender, refundAmount);
    }

    function getTotalCampaigns() external view returns (uint256) {
        return campaignsCount;

    }

    function claimReward(uint256 campaignId) public nonReentrant onlyContributor(campaignId) {
        CampaignInfo storage campaign = campaigns[campaignId];
        require(block.timestamp > campaign.endAt, 'Campaign is not ended');
        require(!rewardsClaimed[campaignId][msg.sender], 'Reward already claimed');

        uint256 rewardAmount = calculateReward(campaignId, msg.sender);

        rewardsClaimed[campaignId][msg.sender] = true;
        require(leafToken.transfer(msg.sender, rewardAmount), 'Rewards transfer failed');

        emit RewardClaimed(msg.sender, campaignId, rewardAmount);
    }


    function calculateReward(uint256 campaignId, address contributor) internal view returns (uint256) {
        uint256 userContribution = contributions[campaignId][contributor];
        uint256 rewardAmount = (userContribution * RATE) / 1 ether;
        return rewardAmount;
    }

    // Fonction pour obtenir la contribution d'un utilisateur à une campagne spécifique
    function getContribution(uint256 campaignId, address user) external view returns (uint256) {
        return contributions[campaignId][user];
    }

    // Fonction pour vérifier si un utilisateur a réclamé sa récompense pour une campagne spécifique
    function hasClaimedReward(uint256 campaignId, address user) external view returns (bool) {
        return rewardsClaimed[campaignId][user];
    }

    receive() external payable {}
}
