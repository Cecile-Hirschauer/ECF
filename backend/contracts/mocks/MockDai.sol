// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockDai is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("Mock Dai Stablecoin", "mDAI") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function buyMockDai() external payable {
        require(msg.value > 0, "Vous devez envoyer de l'ether pour acheter du MockDai");
        uint256 amountToMint = msg.value * 1000;
        _mint(msg.sender, amountToMint);
    }

    function sellMockDai(uint256 amount) external {
        require(amount > 0, "Vous devez vendre au moins 1 mDAI");
        require(balanceOf(msg.sender) >= amount, "Vous n'avez pas assez de mDAI pour vendre");
        uint256 etherAmount = amount / 1000;
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(etherAmount);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }

    receive() external payable {}
}