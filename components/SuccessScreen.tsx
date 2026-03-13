import { View, Text, Image, TouchableOpacity, Modal } from 'react-native';
import React from 'react';


interface SuccessScreenProps {
    visible: boolean;
    title: string;
    description: string;
    onContinue: () => void;
}

const SuccessScreen = ({ visible, title, description, onContinue }: SuccessScreenProps) => {


    return (

        <Modal visible={visible} animationType="fade" transparent={true} statusBarTranslucent={true}>
            <View
                className="flex-1 bg-[#007b4b]"
            // style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
            >
                <View className="items-center justify-center flex-1 px-8">
                    <Image
                        // Correct path based on your directory (components to assets/images)
                        source={require('@/assets/success.png')}
                        className="w-48 h-48 mb-8"
                        resizeMode="contain"
                    />

                    <Text className="mb-4 text-3xl font-bold text-center text-white">
                        {title}
                    </Text>

                    <Text className="text-lg leading-6 text-center text-white opacity-80">
                        {description}
                    </Text>
                </View>

                <View className="px-6 mb-10">
                    <TouchableOpacity
                        onPress={onContinue}
                        activeOpacity={0.8}
                        className="items-center py-4 bg-white rounded-2xl"
                    >
                        <Text className="text-[#007b4b] text-lg font-bold">Continue</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default SuccessScreen;