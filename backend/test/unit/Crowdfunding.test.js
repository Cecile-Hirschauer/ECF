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

    describe('Campaign management tests', function () {

        // Add Campaign
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

        describe('Get and update Campaign', function () {
            beforeEach(async function () {
                await crowdfundingContract.connect(addr1).addCampaign(
                    100, // _goal
                    "Test Campaign", // _name
                    "Test Description", // _description
                    "Test ImageUrl" // _imageUrl
                )
            })

            it('Should revert if the campaign does not exist', async function () {
                await expect(crowdfundingContract.getCampaign(1))
                    .to.be.revertedWith("Campaign does not exist")
            })

            it('Should get the campaign information', async function () {
                let campaign = await crowdfundingContract.getCampaign(0)
                assert.equal(campaign.goal, 100)
                assert.equal(campaign.name, "Test Campaign")
                assert.equal(campaign.description, "Test Description")
                assert.equal(campaign.imageUrl, "Test ImageUrl")
            })

            it('Should revert if the campaign is not updated by his creator or the owner', async function () {
                await expect(crowdfundingContract.connect(addr2).updateCampaign(
                    0,
                    200, // _goal
                    "Updated Test Campaign", // _name
                    "Updated Test Description", // _description
                    "Updated Test ImageUrl" // _imageUrl
                )).to.be.revertedWith("Caller is not the creator or the owner");
            })

            it('Should update the campaign information', async function () {
                await crowdfundingContract.connect(addr1).addCampaign(
                    100, // _goal
                    "Test Campaign", // _name
                    "Test Description", // _description
                    "Test ImageUrl" // _imageUrl
                )
                await crowdfundingContract.connect(addr1).updateCampaign(
                    0,
                    200, // _goal
                    "Updated Test Campaign", // _name
                    "Updated Test Description", // _description
                    "Updated Test ImageUrl" // _imageUrl
                )
                let campaign = await crowdfundingContract.campaigns(0)
                assert.equal(campaign.goal, 200)
                assert.equal(campaign.name, "Updated Test Campaign")
                assert.equal(campaign.description, "Updated Test Description")
                assert.equal(campaign.imageUrl, "Updated Test ImageUrl")
            })

            it('Should emit a CampaignUpdated event with the correct information', async function () {
                await expect(crowdfundingContract.connect(addr1).updateCampaign(
                    0,
                    200, // _goal
                    "Updated Test Campaign", // _name
                    "Updated Test Description", // _description
                    "Updated Test ImageUrl" // _imageUrl
                ))
                    .to.emit(crowdfundingContract, 'CampaignUpdated')
                    .withArgs(
                        0,
                        addr1.address,
                        "Updated Test Campaign",
                        200
                    );
            })



        })


    })
})