"use client"

import React from 'react';
// React
import {useEffect, useState} from "react";

// Chakra UI
import {
    Flex,
    Text,
    Heading,
    Box,
    Divider,
    useToast,
    Card,
    CardBody,
    WrapItem,
    Wrap,
    SimpleGrid,
    CardHeader
} from "@chakra-ui/react"

// WAGMI
import {useAccount, useContractRead, useContractReads} from "wagmi";

import {crowdFundingAddress, crowdFundingAbi} from "@/constants";
import NotConnected from "@/components/NotConnected/NotConnected";
import {log} from "next/dist/server/typescript/utils";

import {ethers} from "ethers";
import CampaignCard from "@/components/CampaignCard/CampaignCard";


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
            console.log('campaigns : ', campaigns)
        }

    }, [campaignsData, campaigns]);

    // Fonction d'aide pour convertir le timestamp en date lisible
    const formatDate = (timestamp) => {
        // Créer un nouvel objet Date à partir du timestamp (en millisecondes)
        const date = new Date(timestamp * 1000);
        // Formatter la date seulement
        return date.toLocaleDateString();
    };

    return (
        <Flex direction={'column'} justifyContent={'center'} color={'black'} >
           <SimpleGrid spacing={10} columns={{ base: 1, md: 2, lg: 4 }} mt={'20px'}>
               {
                   campaigns.map((campaign, index) => (
                       <CampaignCard
                           key={index}
                           name={campaign.result.name}
                           description={campaign.result.description}
                           creator={campaign.result.creator}
                           image={campaign.result.image}
                           targetAmount={ethers.formatEther(campaign.result.targetAmount)}
                           amountCollected={ethers.formatEther(campaign.result.amountCollected)}
                           startAt={formatDate(Number(campaign.result.startAt))}
                           endAt={formatDate(Number(campaign.result.endAt))}

                       />
                   ))

               }
           </SimpleGrid>

        </Flex>
    );
};

export default Main;