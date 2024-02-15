// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

contract ChainlinkPricesOracleMock {
    constructor(){}

    function getLatestGreenLeafTokenPriceInEth() public pure returns (uint256) {
        // 0.1 ETH en Wei
        return 10 ** 17; // équivalent à 0.1 * 10 ** 18
    }

    function getLatestEthPriceInGreenLeafToken() public pure returns (uint256) {
        return 10;
    }
}
