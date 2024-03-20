'use client'

import { ChakraProvider } from '@chakra-ui/react';
import { Merriweather_Sans, Lato } from 'next/font/google'
import "./globals.css";
import { extendTheme } from '@chakra-ui/react';

import '@rainbow-me/rainbowkit/styles.css';

import {
    getDefaultWallets, lightTheme,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  hardhat, mainnet
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
    [hardhat, mainnet],
    [
      publicProvider()
    ]
);

const { connectors } = getDefaultWallets({
  appName: 'My RainbowKit App',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT,
  chains
});

const wagmiConfig = createConfig({
  autoConnect: false,
  connectors,
  publicClient
})

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


export default function RootLayout({ children }) {
  return (
      <html lang="en">
      <body className={lato.className}>
      <ChakraProvider theme={theme}>
          <WagmiConfig config={wagmiConfig}>
              <RainbowKitProvider
                  chains={chains}
                  theme={lightTheme({
                      accentColor: "#4A9953",
                      accentColorForeground: "#ffffff",
                  })}
              >
                  {children}
              </RainbowKitProvider>
          </WagmiConfig>
      </ChakraProvider>
      </body>
      </html>
  );
}