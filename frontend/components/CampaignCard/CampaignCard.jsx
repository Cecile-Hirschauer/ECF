"use client";
import React from 'react';
import {Button, ButtonGroup, Card, CardBody, CardFooter, Divider, Flex, Heading, Stack, Text} from "@chakra-ui/react";
import Image from 'next/image';

const CampaignCard = ({name, description, creator, image, targetAmount, amountCollected, startAt, endAt}) => {
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
                    <Heading size='md'>{name}</Heading>
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
            <CardFooter>
                <Flex justifyContent='center' alignItems={'center'}>
                    <Button color={'white'} colorScheme={'green'}>Contribute</Button>
                </Flex>
            </CardFooter>
        </Card>
);
};

export default CampaignCard;
