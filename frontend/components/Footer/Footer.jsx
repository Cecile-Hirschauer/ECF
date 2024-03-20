"use client"
import { Flex, Text } from '@chakra-ui/react'

const Footer = () => {
    return (
        <Flex
            p="2rem"
            justifyContent="center"
            alignItems="center"
        >
            <Text color={'#0D0D0D'} fontSize={'md'} fontWeight={'medium'} >All rights reserved &copy; EcoGreenChain {new Date().getFullYear()}</Text>
        </Flex>
    )
}

export default Footer