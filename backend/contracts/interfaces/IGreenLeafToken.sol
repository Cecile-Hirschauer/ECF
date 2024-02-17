// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface IGreenLeafToken {
    function hasLockedGreenLeafToken(address user) external view returns (bool);

}
