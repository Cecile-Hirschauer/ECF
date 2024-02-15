// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  // Get signers
  const [deployer, account1, account2, account3] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  /****************** CHAINLINK MOCKS ******************/
  const ChainlinkPricesOracleMock = await hre.ethers.getContractFactory("ChainlinkPricesOracleMock");
  let chainlinkPricesOracleMock = await ChainlinkPricesOracleMock.connect(deployer).deploy();
  await chainlinkPricesOracleMock.waitForDeployment();
  let chainlinkContractAddress = chainlinkPricesOracleMock.target;
  console.log("ChainlinkPricesOracleMock déployé à l'adresse :", chainlinkContractAddress);

  /****************** GLT TOKEN ******************/
  const GreenLeafToken = await hre.ethers.getContractFactory("GreenLeafToken");
  let glt = await GreenLeafToken.connect(deployer).deploy(chainlinkContractAddress);
  await glt.waitForDeployment();
  let gltContractAddress = glt.target;
  console.log("GreenLeafToken déployé à l'adresse :", gltContractAddress);
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});