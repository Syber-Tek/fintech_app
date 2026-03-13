import { TouchableOpacity, View } from 'react-native'
import React from 'react'
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from 'expo-router'



const BackButton = () => {
    const navigation = useNavigation()
    return (
        <View className='flex mx-5 my-5 '>
            <TouchableOpacity
                className='flex items-center justify-center w-10 h-10 p-1 text-center rounded-full shadow-md bg-emerald-700 elevation-lg'
                onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back-outline" size={24} style={{ color: "white" }} />
            </TouchableOpacity>
        </View>
    )
}

export default BackButton