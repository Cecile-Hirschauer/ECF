"use client"
import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import { Flex } from '@chakra-ui/react'

const Layout = ({ children }) => {
    return (
        <Flex
            direction="column"
            h="100vh"
            justifyContent="center"
            my={2}
        >
            <Header />
            <Flex
                grow="1"
                p="2rem"
                justifyContent="center"
                alignItems="center"
                width="100%"
            >
                {children}
            </Flex>
            <Footer />
        </Flex>
    )
}

export default Layout