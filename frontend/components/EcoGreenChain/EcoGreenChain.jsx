import React from 'react';
import {Card, CardBody, Flex, Heading, Text} from "@chakra-ui/react";

const NotConnected = () => {
    return (
        <Flex
            direction="column"
            justifyContent="center"
            alignItems="center"
            height="80vh"
            width="80vw"
            mt="4rem"
        >

            <Card bg="#4A9953" opacity={'75%'}>
                <CardBody color="white">
                    <Text>
                        Log in and discover the power of collaboration for the good of our environment.
                        Your eco-responsible journey starts here.
                    </Text>
                </CardBody>
            </Card>
        </Flex>
    );
};

const EcoGreenChain = () => {
    return (
        <Flex>
            <Heading>
                <NotConnected />
            </Heading>
        </Flex>
    )
}

export default EcoGreenChain;