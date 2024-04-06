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
    let leafToken = await LeafToken.connect(owner).deploy(initialSupply);
    await leafToken.waitForDeployment();
    let leafTokenAddress = leafToken.target;
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
    /*********************** BACKEND INTERACTIONS *******************/
    /******************************************************************/

    /********************** CREATE A CAMPAIGN **********************/
    let name, description, targetAmount, image, startAt, endAt, tx, campaignId, campaign;
    crowdfunding = await hre.ethers.getContractAt("Crowdfunding", crowdfundingAddress, owner);

    // Details of the campaign
    name = "Green Project";
    description = "This project aims to plant trees in urban areas.";
    targetAmount = hre.ethers.parseEther("100");
    image = "/images/tree_in_urban_zone.png";
    startAt = Math.floor(Date.now() / 1000);
    endAt = startAt + 604800 * 8;


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
    tx = await crowdfunding.connect(addr2).fundCampaign(campaignId, {value: amount});
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

    // Update the end date  and the target amount of the campaign
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

    /**********************  CREATOR WITHDRAWS FUNDS COLLECTED  **********************/
    const balanceBefore = await hre.ethers.provider.getBalance(addr1.address);
    console.log(`Balance before withdrawal: ${hre.ethers.formatEther(balanceBefore)} ETH`);
    try {
        const withdrawTx = await crowdfunding.connect(addr1).withdraw(campaignId);
        await withdrawTx.wait(); // Wait for the transaction to be mined

        const balanceAfter = await hre.ethers.provider.getBalance(addr1.address);
        console.log(`Balance after withdrawal: ${hre.ethers.formatEther(balanceAfter)} ETH`);

        console.log(`Successful withdrawal for ID campaign: ${campaignId}`);

        campaign = await crowdfunding.getCampaign(campaignId);

        console.log(`Details of campaign ${campaign.id} after withdrawal:
                        - Name: ${campaign.name}
                        - Description: ${campaign.description}
                        - Target Amount: ${hre.ethers.formatEther(campaign.targetAmount)} ETH
                        - Amount collected: ${hre.ethers.formatEther(campaign.amountCollected)} ETH
                        - claimed by owner: ${campaign.claimedByOwner}
        `)

    } catch (error) {
        console.error(`Withdrawal failed : ${error.message}`);
    }


    /********************** ADDR2 CLAIM REWARD **********************/
    const crowdfundingWithAddr2 = crowdfunding.connect(addr2);

    // Transfer LEAF tokens to the Crowdfunding contract
    const amountToTransfer = hre.ethers.parseEther("500000"); // Amount of leafToken to transfer
    const transferTx = await leafToken.transfer(crowdfundingAddress, amountToTransfer);
    await transferTx.wait();

    console.log(`Transferred ${hre.ethers.formatEther(amountToTransfer)} LEAF to Crowdfunding contract at ${crowdfundingAddress}`);

    // Claim rewards for the campaign
    console.log(`Attempting to claim rewards for campaign ${campaignId} by ${addr2.address}`);
    try {
        const claimTx = await crowdfundingWithAddr2.claimReward(campaignId);
        await claimTx.wait();

        console.log(`Rewards claimed successfully for campaign ${campaignId} by ${addr2.address}`);

        // Check balance of LEAF tokens of addr2 after claiming rewards
        const leafBalanceAfter = await leafToken.balanceOf(addr2.address);
        console.log(`LEAF token balance of ${addr2.address} after claiming rewards: ${leafBalanceAfter} LEAF`);
    } catch (error) {
        console.error(`Failed to claim rewards: ${error.message}`);
    }


    /********************** CREATE ADDITIONAL CAMPAIGNS **********************/
    const campaignsDetails = [
        {
            name: "Water Conservation Project",
            description: "This project focuses on reducing water waste.",
            targetAmount: hre.ethers.parseEther("200"), // 200 ETH
            duration: 30, // 1 month
            image: "/images/water_conservation.png"
        },
        {
            name: "Renewable Energy Initiative",
            description: "A project to increase the use of renewable energy sources.",
            targetAmount: hre.ethers.parseEther("300"), // 300 ETH
            duration: 90, // 3 months
            image: "/images/renewable_energy.png"
        },
        {
            name: "Community Recycling Program",
            description: "Promoting recycling in communities to reduce waste.",
            targetAmount: hre.ethers.parseEther("150"), // 150 ETH
            duration: 180, // 6 months
            image: "/images/recycling_program.png"
        }
    ];

    for (const campaignDetail of campaignsDetails) {
        const startAt = Math.floor(Date.now() / 1000);
        const endAt = startAt + 604800 * campaignDetail.duration;

        console.log(`Creating campaign: ${campaignDetail.name}`);
        tx = await crowdfunding.connect(addr1).createCampaign(
            campaignDetail.name,
            campaignDetail.description,
            campaignDetail.targetAmount,
            startAt,
            endAt,
            campaignDetail.image
        );
        await tx.wait();

        campaignId = await crowdfunding.getCampaignsCount() - BigInt(1); // Récupérer l'ID de la nouvelle campagne
        console.log(`Campaign ${campaignDetail.name} created with ID: ${campaignId}`);
    }


}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});