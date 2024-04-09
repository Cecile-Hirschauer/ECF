"use client"
import React, { useState } from 'react';

import Navigation from "@/components/Navigation/Navigation";
import Campaigns from "@/components/pages/Campaigns/Campaigns";
import StakeToken from "@/components/pages/StakeToken/StakeToken";
import BuyToken from "@/components/pages/BuyToken/BuyToken";
import {Box, Flex} from "@chakra-ui/react";


const componentsMap = {
    Campaigns: Campaigns,
    StakeToken: StakeToken,
    BuyToken: BuyToken,
};

const Main = () => {
    const [currentComponent, setCurrentComponent] = useState('Campaigns');

    const CurrentComponent = componentsMap[currentComponent];

    return (
        <Box>
            <Navigation setCurrentComponent={setCurrentComponent} />
            <Flex direction={'column'} height={'80vh'}>
                <CurrentComponent />
            </Flex>
        </Box>
    );
};


export default Main;
