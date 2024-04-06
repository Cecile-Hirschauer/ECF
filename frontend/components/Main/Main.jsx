"use client"

import React from 'react';
// React
import {useEffect, useState} from "react";

// Chakra UI
import {Flex, Text, Heading, Box, Divider, useToast, Card, CardBody} from "@chakra-ui/react"

// WAGMI
import {useAccount, useContractRead, useContractReads} from "wagmi";

import {crowdFundingAddress, crowdFundingAbi} from "@/constants";
import NotConnected from "@/components/NotConnected/NotConnected";
import {log} from "next/dist/server/typescript/utils";


const Main = () => {
    const toast = useToast();

    const [userRole, setUserRole] = useState('visitor');

    const [campaignIds, setCampaignIds] = useState([]);
    const [campaigns, setCampaigns] = useState([]);

    // Préparation de la lecture multiple en utilisant useContractReads

    // Récupération du nombre total de campagnes
    const {data: totalCampaigns} = useContractRead({
        address: crowdFundingAddress,
        abi: crowdFundingAbi,
        functionName: 'getCampaignsCount',
    });

    useEffect(() => {
        if (Number(totalCampaigns) > 0) {
            // Si totalCampaigns est directement un nombre ou un BigNumber
            const total = Number(totalCampaigns); // Ou totalCampaigns.toNumber() si c'est un BigNumber
            console.log(`totalCampaigns: ${totalCampaigns}`)
            setCampaignIds(Array.from({length: total}, (_, i) => i));
        }
    }, [totalCampaigns]);

    // Récupération des détails de toutes les campagnes
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
            console.log(`campaignsData: ${campaignsData}`)
            console.log('campaigns : ', campaigns)
        }
    }, [campaignsData, campaigns]);


    return (
        <Flex direction={'column'} alignItems={'center'} color={'black'}>
            <Heading as={'h2'} fontSize={'2xl'} mb={'20px'}>All Campaigns</Heading>
            <Flex grow={1} gap={'5px'} justifyContent={'space-around'}>
                {campaigns.map((campaign, index) => (
                    <Card key={index} bg="#4A9953" opacity={'75%'} width={'25%'} >
                        <CardBody color="white" p={'20px'}>
                            <Text fontSize={'xl'} fontWeight={'medium'} textAlign={'center'} >{campaign.result.name}</Text>
                            <Text py={'5px'}>{campaign.result.description}</Text>
                            {/* Ajoutez plus de détails de campagne ici */}
                        </CardBody>
                    </Card>
                ))}
            </Flex>
        </Flex>
    );
};

export default Main;