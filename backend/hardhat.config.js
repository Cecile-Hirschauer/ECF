require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const { API_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.23",
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
    },
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${API_URL}`,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 11155111,
    },
    hardhat: {
      },
    }
};
