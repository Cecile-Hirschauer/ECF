// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ICrowdfunding.sol";
import "./interfaces/IStaking.sol";

contract Staking is ReentrancyGuard, IStaking {
    IERC20 public stakingToken;
    ICrowdfunding public crowdfunding;

    // Staking duration in seconds (for example, 1 month = 30 * 24 * 60 * 60 = 2592000)
    uint256 public constant ONE_MONTH = 2592000;
    uint256 public constant THREE_MONTHS = ONE_MONTH * 3;
    uint256 public constant SIX_MONTHS = ONE_MONTH * 6;

    // Rewards rates
    uint256 public constant REWARD_RATE_ONE_MONTH = 10; // 10% for 1 month
    uint256 public constant REWARD_RATE_THREE_MONTHS = 15; // 15% for 3 months
    uint256 public constant REWARD_RATE_SIX_MONTHS = 25; // 25% for 6 months

    struct Stake {
        uint256 amount;
        uint256 startTime;
        uint256 duration; // in seconds
    }

    mapping(address => Stake) public stakes;

    event Staked(address indexed staker, uint256 amount, uint256 duration);
    event RewardReinvested(address indexed staker, uint256 campaignId, uint256 amount);
    event RewardClaimed(address indexed staker, uint256 amount);

    constructor(address _stakingToken, address _crowdfundingContract) {
        stakingToken = IERC20(_stakingToken);
        crowdfunding = ICrowdfunding(_crowdfundingContract);
    }

    function stakeTokens(uint256 _amount, uint256 _duration) external nonReentrant {
        require(_amount > 0, "Amount must be more than 0");
        require(_duration == ONE_MONTH || _duration == THREE_MONTHS || _duration == SIX_MONTHS, "Invalid staking duration");

        stakes[msg.sender] = Stake(_amount, block.timestamp, _duration);
        stakingToken.transferFrom(msg.sender, address(this), _amount);

        emit Staked(msg.sender, _amount, _duration);
    }

    function calculateReward(address _staker) public view returns (uint256) {
        Stake storage stake = stakes[_staker];
        uint256 rewardRate;

        if (stake.duration == ONE_MONTH) {
            rewardRate = REWARD_RATE_ONE_MONTH;
        } else if (stake.duration == THREE_MONTHS) {
            rewardRate = REWARD_RATE_THREE_MONTHS;
        } else if (stake.duration == SIX_MONTHS) {
            rewardRate = REWARD_RATE_SIX_MONTHS;
        }

        uint256 stakingPeriod = block.timestamp > (stake.startTime + stake.duration) ? stake.duration : block.timestamp - stake.startTime;
        uint256 reward = stake.amount * rewardRate * stakingPeriod / (ONE_MONTH * 12) / 100; // Calcul simplifié

        return reward;
    }

    function reinvestReward(uint256 campaignId, uint256 bonusRate) external nonReentrant {
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No rewards available");

        uint256 bonus = reward * bonusRate / 100;
        uint256 totalInvestment = reward + bonus;

        stakes[msg.sender].amount = 0;

        stakingToken.approve(address(crowdfunding), totalInvestment);
        crowdfunding.fundCampaignWithToken(campaignId, totalInvestment);

        emit RewardReinvested(msg.sender, campaignId, totalInvestment);
    }

    function claimReward() external nonReentrant {
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No rewards available");

        uint256 contractBalance = stakingToken.balanceOf(address(this));
        require(contractBalance >= reward, "Insufficient funds in the contract");

        stakes[msg.sender].amount = 0;
        stakes[msg.sender].startTime = 0;
        stakes[msg.sender].duration = 0;

        stakingToken.transfer(msg.sender, reward);

        emit RewardClaimed(msg.sender, reward);
    }

}

