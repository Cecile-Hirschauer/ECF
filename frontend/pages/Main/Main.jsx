import React, { useState } from 'react';

import Navigation from "@/components/Navigation/Navigation";
import FundCampaign from "@/pages/FundCampaign/FundCampaign";
import StakeToken from "@/pages/StakeToken/StakeToken";
import BuyToken from "@/pages/BuyToken/BuyToken";


const componentsMap = {
    FundCampaign: FundCampaign,
    StakeToken: StakeToken,
    BuyToken: BuyToken,
};

const Main = () => {
    const [currentComponent, setCurrentComponent] = useState('FundCampaign');

    const CurrentComponent = componentsMap[currentComponent];

    return (
        <div>
            <Navigation setCurrentComponent={setCurrentComponent} />
            <CurrentComponent />
        </div>
    );
};


export default Main;
