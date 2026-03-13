import { View, Image } from 'react-native'
import React from 'react'
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import BackButton from '@/components/BackButton';


const ScreensLayout = () => {
    const emerald600 = "#059669";

    return (
        <>
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: emerald600 },
                    headerTitleAlign: 'center',
                    headerLeft: () => <BackButton />,
                    headerTitle: () => (
                        <View className="flex-row items-center">
                            <Image
                                source={require("@/assets/frame_icon.png")}
                                className="object-contain"
                                height={100}
                                width={100}
                            />
                        </View>
                    ),
                }} >


                {/* tabBar={props => <TabBar {...props} />} */}

            </Stack>
        </>
    );
}

export default ScreensLayout