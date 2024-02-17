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

  /****************** LEAF TOKEN ******************/
  const LeafToken = await hre.ethers.getContractFactory("LeafToken");
  const initialSupply = hre.ethers.parseEther("1000000"); // 1 000 000 LEAF
  let leaf = await LeafToken.connect(deployer).deploy(initialSupply);
  await leaf.waitForDeployment();
  let leafTokenAddress = leaf.target;
  console.log("LeafToken déployé à l'adresse :", leafTokenAddress);

  /******************* ECOGREENFUND *******************/
  const EcoGreenFund = await  hre.ethers.getContractFactory("EcoGreenFund");
  let ecoGreenFund = await EcoGreenFund.deploy(leafTokenAddress);
  await ecoGreenFund.waitForDeployment();
  let ecoGreenFundAddress = ecoGreenFund.target;
  console.log("EcoGreenFund déployé à l'adresse :", ecoGreenFundAddress);
}



// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});