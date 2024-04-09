'use client'

import Link from "next/link"

import {
    Box,
    Flex,
    HStack,
    IconButton,
    Button,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    useDisclosure,
    Stack,
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'

const menuItems = [
    { name: 'Fund Campaigns', component: 'FundCampaign', active: true },
    { name: 'Stake Tokens', component: 'StakeToken', active: true },
    { name: 'Buy Tokens', component: 'BuyToken', active: true },
    { name: 'Mint Tokens', component: 'MintToken', active: false },
];


const NavLink = ({ name, setCurrentComponent }) => {
    return (
        <Box
            as="button"
            px={2}
            py={1}
            rounded={'md'}
            _hover={{
                textDecoration: 'none',
                bg: 'green.200',
                color: 'green.800',
            }}
            onClick={() => setCurrentComponent(name)}
            style={{ cursor: 'pointer' }}
        >
            {name}
        </Box>
    );
};



const Navigation = ({ setCurrentComponent }) => {
    const { isOpen, onOpen, onClose } = useDisclosure()

    const handleClick = (component) => {
        onChange(component);
    };

    return (
        <>
            <Box bg="#4A9953" opacity={'60%'} color={'white'} px={4} fontWeight={'bold'} fontSize={'lg'} rounded={'md'}>
                <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
                    <IconButton
                        size={'md'}
                        icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
                        aria-label={'Open Menu'}
                        display={{ md: 'none' }}
                        onClick={isOpen ? onClose : onOpen}
                    />
                    <HStack spacing={8} alignItems={'center'}>
                        <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
                            {menuItems.filter((item) => item.active).map((item) => (
                                <NavLink
                                    key={item.name}
                                    name={item.component}
                                    setCurrentComponent={setCurrentComponent}
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                        </HStack>
                    </HStack>
                    <Flex alignItems={'center'}>
                        <Menu>
                            <MenuButton
                                as={Button}
                                rounded={'full'}
                                variant={'link'}
                                cursor={'pointer'}
                                minW={0}>
                            </MenuButton>
                            <MenuList>
                                <MenuItem>Link 1</MenuItem>
                                <MenuItem>Link 2</MenuItem>
                                <MenuDivider />
                                <MenuItem>Link 3</MenuItem>
                            </MenuList>
                        </Menu>
                    </Flex>
                </Flex>

                {isOpen ? (
                    <Box pb={4} display={{ md: 'none' }}>
                        <Stack as={'nav'} spacing={4}>
                            {menuItems.filter((item) => item.active).map((item) => (
                                <NavLink
                                    key={item.name}
                                    name={item.component}
                                    setCurrentComponent={setCurrentComponent}
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                        </Stack>
                    </Box>
                ) : null}
            </Box>

        </>
    )
}

export default Navigation;