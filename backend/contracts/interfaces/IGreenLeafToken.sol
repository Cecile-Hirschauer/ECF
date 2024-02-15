// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface IGreenLeafToken {
    // Déclaration de la fonction hasLockedGLT en plus des fonctions standard ERC20
    function hasLockedGLT(address user) external view returns (bool);
}
