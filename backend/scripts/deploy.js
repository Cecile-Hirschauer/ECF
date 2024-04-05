// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const dateToUNIX = require("../utils/dateToUNIX");
const dayjs = require("dayjs");

function formatTimestamp(timestamp) {
    const timestampNumber = Number(timestamp);
    return dayjs.unix(timestampNumber).format("DD/MM/YYYY");
}

async function main() {
    let initialSupply;
    // Get signers
    const [owner, addr1, addr2, ...addrs] = await hre.ethers.getSigners();


    console.log("Deploying contracts with the account:", owner.address);

    /****************** LEAF TOKEN ******************/
    const LeafToken = await hre.ethers.getContractFactory("LeafToken");
    initialSupply = hre.ethers.parseEther("1000000"); // 1 000 000 LEAF
    let leaf = await LeafToken.connect(owner).deploy(initialSupply);
    await leaf.waitForDeployment();
    let leafTokenAddress = leaf.target;
    console.log("LeafToken deployed to:", leafTokenAddress);

    /******************* CROWDFUNDING *******************/
    const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
    let crowdfunding = await Crowdfunding.deploy(leafTokenAddress);
    await crowdfunding.waitForDeployment();
    let crowdfundingAddress = crowdfunding.target;
    console.log("Crowdfunding deployed to :", crowdfundingAddress);

    /******************* MOCK DAI *******************/
    const MockDai = await hre.ethers.getContractFactory("MockDai");
    initialSupply = hre.ethers.parseEther("1000000"); // 1 000 000 mDAI
    let mockDai = await MockDai.connect(owner).deploy(initialSupply);
    await mockDai.waitForDeployment();
    let mockDaiAddress = mockDai.target;
    console.log("MockDai deployed to :", mockDaiAddress);

    /******************* STAKING *******************/
    const Staking = await hre.ethers.getContractFactory("Staking");
    let staking = await Staking.deploy(mockDaiAddress, crowdfundingAddress);
    await staking.waitForDeployment();
    let stakingAddress = staking.target;
    console.log("Staking deployed to :", stakingAddress);

    /******************************************************************/
    /******************* INTERACTIONS WITH BACKEND *******************/
    /******************************************************************/

    /********************** CREATE A CAMPAIGN **********************/
    let name, description, targetAmount, image, startAt, endAt, tx, campaignId, campaign;
    crowdfunding = await hre.ethers.getContractAt("Crowdfunding", crowdfundingAddress, owner);

    // Details of the campaign
    name = "Green Project";
    description = "This project aims to plant trees in urban areas.";
    targetAmount = hre.ethers.parseEther("100");
    image = "../../frontend/public/images/tree_in_urban_zone.png";
    startAt = Math.floor(Date.now() / 1000); // timestamp de début
    endAt = startAt + 604800 * 8; // 8 weeks later


    // Campaign creation
    tx = await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startAt, endAt, image);
    await tx.wait(); // Wait for the transaction to be mined

    // Get the campaign ID
    campaignId = await crowdfunding.getCampaignsCount() - BigInt(1);

    // Get the campaign details
    campaign = await crowdfunding.getCampaign(campaignId);
    console.log(`Campaign ${campaignId} created  with success by ${campaign.creator} : 
     Name: ${campaign.name}, 
     Description: ${campaign.description}, 
     Target Amount: ${hre.ethers.formatEther(campaign.targetAmount)} ETH, 
     Start At: ${formatTimestamp(campaign.startAt)}, 
     End At: ${formatTimestamp(campaign.endAt)}   
    `
    );

    /********************** FUND A CAMPAIGN **********************/
    let amount;
    amount = hre.ethers.parseEther("10");
    tx = await crowdfunding.connect(addr2).fundCampaign(campaignId, { value: amount });
    await tx.wait(); // Wait for the transaction to be mined

    // Get the campaign details
    campaign = await crowdfunding.getCampaign(campaignId);
    console.log(`Donation of ${hre.ethers.formatEther(amount)} ETH to campaign ${campaignId} by ${addr2.address} : 
     Name: ${campaign.name}, 
     Description: ${campaign.description}, 
     Target Amount: ${hre.ethers.formatEther(campaign.targetAmount)} ETH, 
     Amount collected: ${hre.ethers.formatEther(campaign.amountCollected)} ETH,
     Start At: ${formatTimestamp(campaign.startAt)}, 
     End At: ${formatTimestamp(campaign.endAt)}   
    `
    );

    /********************** UPDATE CAMPAIGN **********************/
    let newEndAt, newTargetAmount;

    // Update the end date of the campaign TO END CAMPAIGN
    newEndAt = startAt + 1;
    newTargetAmount = amount;

    tx = await crowdfunding.connect(addr1).updateCampaign(campaignId, name, description, newTargetAmount, startAt, newEndAt, image);
    await tx.wait(); // Wait for the transaction to be mined

    // Get the campaign details
    campaign = await crowdfunding.getCampaign(campaignId);
    console.log(`Campaign ${campaignId} updated by ${addr1.address} : 
     Name: ${campaign.name}, 
     Description: ${campaign.description}, 
     Target Amount: ${hre.ethers.formatEther(campaign.targetAmount)} ETH, 
     Amount collected: ${hre.ethers.formatEther(campaign.amountCollected)} ETH,
     Start At: ${formatTimestamp(campaign.startAt)}, 
     End At: ${formatTimestamp(campaign.endAt)}   
    `
    );

    /********************** WITHDRAW  **********************/




}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});