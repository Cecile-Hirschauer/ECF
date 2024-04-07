"use client";
import React from 'react';
import {Button, ButtonGroup, Card, CardBody, CardFooter, Divider, Flex, Heading, Stack, Text} from "@chakra-ui/react";
import Image from 'next/image';
import ContributeButton from "@/components/ContributeButton/ContributeButton";

const CampaignCard = ({campaignId, name, description, creator, image, targetAmount, amountCollected, startAt, endAt, contribute}) => {
    return (
        <Card maxW='sm'>
            <CardBody>
                <Image
                    src={image}
                    alt={name}
                    borderRadius='lg'
                    width={500}
                    height={200}
                />
                <Stack spacing='2' fontSize='sm' mt={2}>
                    <Heading size='sm'>{name}</Heading>
                    <Text>
                        {description}
                    </Text>
                    <Text color='#4A9953' fontWeight={'bold'}>
                        Created by : {creator}
                    </Text>
                    <Stack direction='row' justifyContent='space-between'>
                        <Text>Start At: {startAt} </Text>
                        <Text>End At: {endAt}</Text>
                    </Stack>
                    <Stack direction='row' justifyContent='space-between'>
                        <Text>Target: {targetAmount} ETH</Text>
                        <Text>Raised: {amountCollected} ETH</Text>
                    </Stack>
                </Stack>
            </CardBody>
            <Divider/>
            <CardFooter align={'center'}>
                <Flex justifyContent='center' alignItems={'center'}>
                    <ContributeButton campaignId={campaignId} />
                </Flex>
            </CardFooter>
        </Card>
);
};

export default CampaignCard;
