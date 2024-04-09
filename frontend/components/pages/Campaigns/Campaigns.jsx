"use client"

import React from 'react';
// React
import {useEffect, useState} from "react";

// Chakra UI
import {
    Flex,
    SimpleGrid,
} from "@chakra-ui/react"

// WAGMI
import { useContractRead, useContractReads} from "wagmi";

import {crowdFundingAddress, crowdFundingAbi} from "@/constants";


import {formatEther} from "viem";
import CampaignCard from "@/components/CampaignCard/CampaignCard";



const Campaigns = () => {

    const [campaignIds, setCampaignIds] = useState([]);
    const [campaigns, setCampaigns] = useState([]);

    // Get the total number of campaigns
    const {data: totalCampaigns} = useContractRead({
        address: crowdFundingAddress,
        abi: crowdFundingAbi,
        functionName: 'getCampaignsCount',
    });

    useEffect(() => {
        if (Number(totalCampaigns) > 0) {
            const total = Number(totalCampaigns);
            setCampaignIds(Array.from({length: total}, (_, i) => i));
        }
    }, [totalCampaigns]);

    // get the details of all campaigns
    const {data: campaignsData} = useContractReads({
        contracts: campaignIds.map((id) => ({
            address: crowdFundingAddress,
            abi: crowdFundingAbi,
            functionName: 'getCampaign',
            args: [id],
        })),
    });

    useEffect(() => {
        if (campaignsData) {
            setCampaigns(campaignsData);
        }

    }, [campaignsData, campaigns]);

    // Helper function to format the date
    const formatDate = (timestamp) => {
        // Create a new date object from the timestamp
        const date = new Date(timestamp * 1000);
        // Format the date to a human-readable format
        return date.toLocaleDateString();
    };


    return (
        <Flex direction={'column'} justifyContent={'center'} color={'black'}>
            <SimpleGrid spacing={10} columns={{base: 1, md: 2, lg: 4}} mt={'20px'}>
                {
                    campaigns.map((campaign, index) => (
                        <CampaignCard
                            key={index}
                            name={campaign.result.name}
                            description={campaign.result.description}
                            creator={campaign.result.creator}
                            image={campaign.result.image}
                            targetAmount={formatEther(campaign.result.targetAmount).toString()}
                            amountCollected={!campaign.result.claimedByOwner ? formatEther(campaign.result.amountCollected.toString()): "Funded"}
                            startAt={formatDate(Number(campaign.result.startAt))}
                            endAt={formatDate(Number(campaign.result.endAt))}
                            campaignId={Number(campaign.result.id)}
                        />
                    ))

                }
            </SimpleGrid>

        </Flex>
    );
};

export default Campaigns;