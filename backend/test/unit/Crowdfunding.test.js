const {ethers} = require('hardhat')
const {expect, assert} = require('chai')

describe('Crowdfunding Tests', function () {
    let crowdfundingContract;
    let owner, addr1, addr2, addr3;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const Crowdfunding = await ethers.getContractFactory('Crowdfunding');
        crowdfundingContract = await Crowdfunding.deploy();
    })

    it("Should deploy the smart contract with the right Owner", async function () {
        let admin = await crowdfundingContract.owner()
        assert.equal(admin, owner.address)
    })

    describe('Campaign creation tests', function () {
        it('Should revert if the goal is less than 1', async function () {
            await expect(crowdfundingContract.addCampaign(
                0, // _goal
                "Test Campaign", // _name
                "Test Description", // _description
                "Test ImageUrl" // _imageUrl
            )).to.be.revertedWith("Crowdfunding: goal must be greater than 0");
        })

        it('Should revert if the name is empty', async function () {
            await expect(crowdfundingContract.addCampaign(
                100, // _goal
                "", // _name
                "Test Description", // _description
                "Test ImageUrl" // _imageUrl
            )).to.be.revertedWith("Crowdfunding: name cannot be empty");
        })

        it('Should revert if the description is empty', async function () {
            await expect(crowdfundingContract.addCampaign(
                100, // _goal
                "Test Campaign", // _name
                "", // _description
                "Test ImageUrl" // _imageUrl
            )).to.be.revertedWith("Crowdfunding: description cannot be empty");
        })

        it('Should revert if the imageUrl is empty', async function () {
            await expect(crowdfundingContract.addCampaign(
                100, // _goal
                "Test Campaign", // _name
                "Test Description", // _description
                "" // _imageUrl
            )).to.be.revertedWith("Crowdfunding: imageUrl cannot be empty");
        })

        it('Should add a campaign', async function () {
            await crowdfundingContract.addCampaign(
                100, // _goal
                "Test Campaign", // _name
                "Test Description", // _description
                "Test ImageUrl" // _imageUrl
            )
            let campaign = await crowdfundingContract.campaigns(0)
            assert.equal(campaign.goal, 100)
            assert.equal(campaign.name, "Test Campaign")
            assert.equal(campaign.description, "Test Description")
            assert.equal(campaign.imageUrl, "Test ImageUrl")
        })

        it('Should emit a CampaignAdded event with the correct information', async function () {
            await expect(crowdfundingContract.connect(addr1).addCampaign(
                100, // _goal
                "Test Campaign", // _name
                "Test Description", // _description
                "Test ImageUrl" // _imageUrl
            ))
                .to.emit(crowdfundingContract, 'CampaignAdded')
                .withArgs(
                    0,
                    addr1.address,
                    "Test Campaign",
                    100
                );
        });



    })
})