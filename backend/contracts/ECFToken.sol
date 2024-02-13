// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ECFToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(uint256 initialSupply) ERC20("EcoFundChain", "ECF") {
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender); // Correct use of _grantRole
        _grantRole(MINTER_ROLE, msg.sender);

        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
