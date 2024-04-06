'use client';

import {ChakraProvider} from '@chakra-ui/react';
import {Merriweather_Sans, Lato} from 'next/font/google'
import "./globals.css";
import {extendTheme} from '@chakra-ui/react';

import '@rainbow-me/rainbowkit/styles.css';

import {
    getDefaultConfig, lightTheme,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {WagmiProvider} from 'wagmi';
import {
    hardhat,
} from 'wagmi/chains';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";


const config = getDefaultConfig({
    appName: 'EcoGreenFund',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT,
    chains: [hardhat],
    ssr: true,
});

const queryClient = new QueryClient();

const lato = Lato({
    subsets: ["latin"],
    display: "swap",
    weight: ["400", "700"]
});
export const merriweather = Merriweather_Sans({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
});

const theme = extendTheme({
    styles: {
        global: {
            body: {
                bg: "#24280a",
                color: "white",
                fontFamily: lato,
            },
            a: {
                textDecoration: "none",
            },
            h1: {
                fontFamily: merriweather,
                fontWeight: "700",
            },
        },
    },
});


export default function RootLayout({children}) {
    return (
        <html lang="en">
        <body className={lato.className}>
        <ChakraProvider theme={theme}>
            <WagmiProvider config={config}>
                <QueryClientProvider client={queryClient}>

                    <RainbowKitProvider
                        theme={lightTheme({
                            accentColor: "#4A9953",
                            accentColorForeground: "#ffffff",
                        })}
                    >
                        {children}
                    </RainbowKitProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </ChakraProvider>
        </body>
        </html>
    );
}

