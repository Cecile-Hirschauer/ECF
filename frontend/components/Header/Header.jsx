import React from 'react';
import {Box, Flex, Heading, Image, Text} from "@chakra-ui/react";
import {ConnectButton} from "@rainbow-me/rainbowkit";


const Header = () => {
    return (
        <Flex
            justifyContent="space-between"
            alignItems="center"
            p={4}
        >
            <Flex justifyContent={"space-between"} alignItems={'center'} px={2}>
                <Image
                    src="images/logo.png"
                    alt="EcoGreenFund"
                    width={100}
                    height={100}
                    objectFit={'cover'}
                />
                <Box>
                    <Heading as='h1' size='xl' noOfLines={1}>
                        EcoGreenFund
                    </Heading>
                    <Text fontSize='3xl' fontWeight={'medium'} color={'#0D0D0D'} >
                        A decentralized fund for green projects
                    </Text>
                </Box>
            </Flex>
            <ConnectButton/>
        </Flex>
    );
}

export default Header;