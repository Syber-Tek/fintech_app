import { View, Text, Image, TouchableOpacity, Modal } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AllDoneProps {
    visible: boolean;
    onContinue: () => void;
}

const AllDone = ({ visible, onContinue }: AllDoneProps) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            statusBarTranslucent={true}

        >
            {/* SafeAreaView ensures the content and button respect device notches and home bars */}
            <SafeAreaView className="flex-1 bg-[#007b4b]">

                {/* Main Content Area */}
                <View className="items-center justify-center flex-1 px-8">
                    {/* Confetti / Party Popper Image */}
                    <Image
                        source={require('@/assets/hurray.png')}
                        className="w-56 h-56 mb-10"
                        resizeMode="contain"
                    />

                    <Text className="mb-4 text-4xl font-extrabold text-center text-white">
                        All done!
                    </Text>

                    <Text className="px-4 text-base leading-6 text-center text-white opacity-90">
                        Your account has been created. You&apos;re now ready to explore and enjoy all the features and benefits we have to offer.
                    </Text>
                </View>

                {/* Bottom Button Section - Stays at the bottom naturally */}
                <View className="px-6 pb-6">
                    <TouchableOpacity
                        onPress={onContinue}
                        activeOpacity={0.9}
                        className="items-center py-4 bg-white shadow-sm rounded-xl"
                    >
                        <Text className="text-[#007b4b] text-lg font-bold">
                            Start exploring App
                        </Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </Modal>
    );
};

export default AllDone;