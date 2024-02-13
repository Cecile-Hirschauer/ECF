// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ECFToken.sol";

contract EcoFundChain is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public StakingToken;

    ECFToken public ecfToken;

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

    struct Stakings {
        uint256 amount;
        uint256 startTime;
        bool isStaking;
        bytes32 rewardType; // 'ECFTOKEN', 'ETHER', 'STAKINGTOKEN'
        address tokenAddress;

    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(address => bool) public acceptedTokens;
    mapping(uint256 => mapping(address => Stakings)) public stakings;


    uint256 public nextCampaignId;
    uint256 public totalStaked;
    uint256 public totalRewardsPool;
    uint256 public constant REWARD_RATE = 10;
    uint256 public constant FEE_RATE = 1;

    event CampaignAdded(uint256 campaignId, address indexed creator, string name, uint256 goal);
    event CampaignUpdated(uint256 campaignId, address indexed creator, string name, uint256 goal);
    event TokenAuthorisationChanged(address indexed tokenAddress, bool isAuthorised);
    event CampaignSuccessStatusChanged(uint256 campaignId, bool status);
    event Contribute(uint256 campaignId, address indexed contributor, uint256 amount, address tokenAddress);
    event Unstaked(uint256 campaignId, address indexed contributor, uint256 amount, address tokenAddress);
    event Refunded(uint256 campaignId, address indexed contributor, uint256 amount, address tokenAddress);
    event RewardsClaimed(address indexed contributor, uint256 amount);

    constructor(address _ecfTokenAddress) Ownable(msg.sender) {
        ecfToken = ECFToken(_ecfTokenAddress);
    }
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
                raisedAmount,
                campaign.isSuccessful,
                campaign.isActive,
                campaign.name,
                campaign.description,
                campaign.imageUrl
        );
    }

    // ************* TOKEN AUTHORIZATIONS ************* //
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

    function setStakingToken(address _stakingTokenAddress) external onlyOwner {
        StakingToken = IERC20(_stakingTokenAddress);
    }

    function setRewardsToken(address _rewardsTokenAddress) external onlyOwner {
        ecfToken = ECFToken(_rewardsTokenAddress);
    }

    //************* STAKING ************* //
    function contribute(uint256 _campaignId, address _tokenAddress, uint256 _amount) external payable {
        require(campaigns[_campaignId].isActive, "Campaign is not active");

        if (_tokenAddress == address(0)) { // Contribution en Ether
            require(msg.value == _amount, "Ether value mismatch");
            _stakeEther(_campaignId);
        } else { // Contribution en Token
            require(_amount > 0, "Amount must be greater than 0");
            _stakeToken(_campaignId, _amount, _tokenAddress);
        }

        emit Contribute(_campaignId, msg.sender, _amount, _tokenAddress);
    }


    function _stakeToken(uint256 _campaignId, uint256 _amount, address _tokenAddress) internal {
        require(_amount > 0, "Amount must be greater than 0");
        require(acceptedTokens[_tokenAddress], "Token not accepted");
        require(campaigns[_campaignId].isActive, "Campaign is not active");

        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);

        Stakings storage details = stakings[_campaignId][msg.sender];
        details.amount += _amount;
        if (!details.isStaking) {
            details.startTime = block.timestamp;
            details.isStaking = true;
        }

        totalStaked += _amount; // Vous pourriez vouloir suivre le total staké globalement ou par campagne

    }


    function unstakeToken(uint256 _campaignId, uint256 _amount, address _tokenAddress) external nonReentrant {
        Stakings storage details = stakings[_campaignId][msg.sender];
        require(details.isStaking, "Not staking");
        require(details.amount >= _amount, "Insufficient staked amount");

        details.amount -= _amount;
        if (details.amount == 0) {
            details.isStaking = false;
        }
        totalStaked -= _amount; // Ajustez en fonction de votre logique pour le total staké

        IERC20(_tokenAddress).safeTransfer(msg.sender, _amount);

        emit Unstaked(_campaignId, msg.sender, _amount, _tokenAddress);
    }

    function _stakeEther(uint256 _campaignId) internal {
        require(campaigns[_campaignId].isActive && !campaigns[_campaignId].isSuccessful, "Campaign is not active or already successful");
        require(msg.value > 0, "Amount must be greater than 0");

        // Gestion des montants stakés existants ou début d'un nouveau staking
        if (stakings[_campaignId][msg.sender].isStaking) {
            stakings[_campaignId][msg.sender].amount += msg.value;
            // Optionnellement, ajustez startTime ici si nécessaire
        } else {
            stakings[_campaignId][msg.sender] = Stakings({
                amount: msg.value,
                startTime: block.timestamp,
                isStaking: true,
                rewardType: "ETHER", // ou une valeur par défaut valide
                tokenAddress : address(0)
            });
        }

        campaigns[_campaignId].raisedAmount += msg.value;

    }

    function claimRewards(uint256 _campaignId) external nonReentrant {
        uint256 rewards = calculateRewards(_campaignId, msg.sender);
        require(rewards > 0, "No rewards available");

        _mintRewards(msg.sender, rewards); // Crée les récompenses directement pour l'utilisateur

        emit RewardsClaimed(msg.sender, rewards);
    }

    function setRewardType(uint256 _campaignId, bytes32 _rewardType) external {
        require(_rewardType == keccak256("ECFTOKEN") || _rewardType == keccak256("ETHER") || _rewardType == keccak256("STAKINGTOKEN"), "Invalid reward type");
        require(stakings[_campaignId][msg.sender].isStaking, "Not staking in this campaign");

        stakings[_campaignId][msg.sender].rewardType = _rewardType;
    }

    function distributeRewards(uint256 _campaignId, address _staker) external {
        Stakings storage details = stakings[_campaignId][_staker];
        uint256 rewards = calculateRewards(_campaignId, msg.sender);

        if (details.rewardType == keccak256("ECFTOKEN")) {
            require(ecfToken.balanceOf(address(this)) >= rewards, "Insufficient ECFToken balance");
            ecfToken.transfer(_staker, rewards);
        } else if (details.rewardType == keccak256("ETHER")) {
            require(address(this).balance >= rewards, "Insufficient Ether balance");
            payable(_staker).transfer(rewards);
        } else if (details.rewardType == keccak256("STAKINGTOKEN")) {
            require(StakingToken.balanceOf(address(this)) >= rewards, "Insufficient StakingToken balance");
            StakingToken.transfer(_staker, rewards);
        } else {
            revert("Invalid reward type");
        }
    }


    function withdrawToken(address _tokenAddress) external nonReentrant {
        IERC20 token = IERC20(_tokenAddress);
        token.transfer(owner(), token.balanceOf(address(this)));
    }

    function withdrawEther() external nonReentrant {
        payable(owner()).transfer(address(this).balance);
    }

    function calculateRewards(uint256 _campaignId, address _staker) public view returns (uint256) {
        Stakings storage details = stakings[_campaignId][_staker];
        if (totalStaked == 0 || !details.isStaking) return 0;

        uint256 userShare = details.amount * 1e18 / totalStaked; // Utilisation de 1e18 pour la précision
        return totalRewardsPool * userShare / 1e18;
    }

    function _mintRewards(address recipient, uint256 amount) private {
        ecfToken.mint(recipient, amount);
    }

    //************* REFUND ************* //

    function refund(uint256 _campaignId) external nonReentrant {
        require(!campaigns[_campaignId].isSuccessful, "Campaign is successful, no refunds");
        Stakings memory stakingDetails = stakings[_campaignId][msg.sender];
        require(stakingDetails.amount > 0, "No contribution to refund");

        if (stakingDetails.tokenAddress == address(0)) { // Ether
            payable(msg.sender).transfer(stakingDetails.amount);
        } else { // Tokens ERC20
            IERC20 token = IERC20(stakingDetails.tokenAddress);
            require(token.transfer(msg.sender, stakingDetails.amount), "Failed to refund token contribution");

            stakings[_campaignId][msg.sender].amount = 0;

        }
        emit Refunded(_campaignId, msg.sender, stakingDetails.amount, stakingDetails.tokenAddress);


    }
}
