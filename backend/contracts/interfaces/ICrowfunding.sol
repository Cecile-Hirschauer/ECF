// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface ICrowfunding {
    function fundCampaign(uint256 _campaignId, uint256 _amount) external;
}
