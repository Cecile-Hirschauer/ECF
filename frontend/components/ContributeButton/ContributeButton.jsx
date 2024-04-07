"use client";

import {useEffect, useState} from 'react';
import {Button, Input, useToast} from '@chakra-ui/react';
import {useNetwork, useAccount} from 'wagmi';
import {prepareWriteContract, waitForTransaction, writeContract, getPublicClient} from "@wagmi/core";
import { parseAbiItem, parseEther, parseUnits} from 'viem';
import {crowdFundingAddress, crowdFundingAbi} from "@/constants";


const ContributeButton = ({campaignId}) => {
    const toast = useToast();
    const client = getPublicClient();

    const [amount, setAmount] = useState('');
    const [campaignFundedEvent, setCampaignFundedEvent] = useState(1)

    const {chain} = useNetwork();

    const {address} = useAccount();

    useEffect(() => {

    }, [chain])

    const fundCampaign = async () => {
        if (!chain?.id) {
            return;
        }

        try {
            const {request} = await prepareWriteContract({
                address: crowdFundingAddress,
                abi: crowdFundingAbi,
                functionName: 'fundCampaign',
                args: [campaignId],
                value: parseEther(amount),
                account: address,
            })
            console.log("request", request)
            const { hash } = await writeContract(request);
            console.log(`Transaction hash: ${hash}`);
            await waitForTransaction({hash})
            await getEvent();
            console.log("event in fundCampaign fn", campaignFundedEvent)
            setAmount('');
            toast({
                title: 'Transaction sent',
                description: `Campaign ${campaignId} funded with ${amount} ETH`,
                status: 'info',
                duration: 9000,
                isClosable: true,
            });
        } catch (e) {
            console.error(e);
            toast({
                title: 'Error',
                description: e.message,
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
        }
    }

    const getEvent = async () => {
        const fundCampaignLogs = await client.getLogs({
            event: parseAbiItem('event CampaignFunded(uint256 campaignId, address funder, uint256 amount)'),
            fomBlock: 0n,
            toBlock: 'latest',
        })
        setCampaignFundedEvent(fundCampaignLogs.map((log) => ({
            funder: log.account,
            amount: log.value,

        })))
        console.log("event", campaignFundedEvent)

    }



    return (
        <div>
            <Input
                placeholder="Amount in ETH"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                mb={2}
            />
            <Button
                onClick={fundCampaign}
                colorScheme="green"
            >
                Contribute
            </Button>

        </div>
    );
};

export default ContributeButton;
