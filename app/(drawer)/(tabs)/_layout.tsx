// app/(drawer)/(tabs)/_layout.tsx
import React from 'react'
import { Tabs } from 'expo-router'
import { TouchableOpacity, View, Image } from 'react-native'
import { Feather } from '@expo/vector-icons'
import TabBar from '@/components/TabBar'
import { DrawerActions, useNavigation } from '@react-navigation/native'



const DrawerToggle = () => {
    const navigation = useNavigation()
    return (
        <TouchableOpacity
            className="p-2 ml-5 rounded-full bg-gray-100/20"
            onPress={() => navigation.getParent()?.dispatch(DrawerActions.openDrawer())}
        >
            <Feather name="align-left" size={24} color="white" />
        </TouchableOpacity>
    )
}

const TabLayout = () => {
    const emerald600 = "#059669";

    return (
        <Tabs
            tabBar={props => <TabBar {...props} />}
            screenOptions={{
                tabBarHideOnKeyboard: true,
                headerStyle: { backgroundColor: emerald600, elevation: 0, shadowOpacity: 0 },
                headerTitleAlign: 'center',
                headerTintColor: '#fff',
                headerLeft: () => <DrawerToggle />,  
                headerTitle: () => (
                    <View className="flex-row items-center">
                        <Image
                            source={require("@/assets/frame_icon.png")}
                            className="object-contain"
                            height={80}
                            width={80}
                        />
                    </View>
                ),
                headerRight: () => (
                    <TouchableOpacity className="p-2 mr-5 rounded-full bg-gray-100/20">
                        <Feather name="bell" size={24} color="white" />
                    </TouchableOpacity>
                ),
            }}
        >
            <Tabs.Screen name="index" options={{ title: "Home" }} />
            <Tabs.Screen name="cards" options={{ title: "Cards" }} />
            <Tabs.Screen name="accounts" options={{ title: "Accounts" }} />
            <Tabs.Screen name="transactions" options={{ title: "Transactions" }} />
        </Tabs>
    )
}

export default TabLayout