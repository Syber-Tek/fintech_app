import { View, Image, TouchableOpacity, Text } from "react-native";
import React from "react";
import Onboarding from "react-native-onboarding-swiper";
import { useRouter } from "expo-router";
import { setItem } from "@/utils/asyncStorage";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

const OnboardingPage = () => {
    const router = useRouter();

    const handleDone = () => {
        setItem("onboarded", "true");
        router.replace("/(auth)/login");
    };

    type IoniconName = ComponentProps<typeof Ionicons>["name"];

    type CircleButtonProps = {
        icon: IoniconName;
    } & ComponentProps<typeof TouchableOpacity>;

    const CircleButton = ({ icon, ...props }: CircleButtonProps) => (
        <TouchableOpacity
            {...props}
            className="items-center justify-center mx-8 mb-8"
        >
            <View className="items-center justify-center w-12 h-12 rounded-full bg-emerald-700">
                <Ionicons name={icon} size={24} color="white" />
            </View>
        </TouchableOpacity>
    );

    const Done = (props: ComponentProps<typeof TouchableOpacity>) => (
        <CircleButton icon="checkmark" {...props} />
    );

    const Skip = (props: ComponentProps<typeof TouchableOpacity>) => (
        <CircleButton icon="play-skip-forward" {...props} />
    );

    const Next = (props: ComponentProps<typeof TouchableOpacity>) => (
        <CircleButton icon="arrow-forward" {...props} />
    );

    return (
        <View className="flex-1 bg-white">
            <Onboarding
                onDone={handleDone}
                onSkip={handleDone}
                bottomBarHighlight={false}
                DoneButtonComponent={Done}
                SkipButtonComponent={Skip}
                NextButtonComponent={Next}
                pages={[
                    {
                        backgroundColor: "#fff",
                        image: (
                            <View>
                                <Image
                                    source={require("@/assets/onboarding1.png")}
                                    className="object-contain"
                                    height={100}
                                    width={100}
                                />
                            </View>
                        ),
                        title: (
                            <Text className="text-lg font-semibold text-emerald-700">
                                Seamless Transfer Options
                            </Text>
                        ),
                        subtitle: (
                            <Text className="text-2xl font-semibold text-center">
                                Enjoy competitive exchange rates with flexible delivery methods.
                            </Text>
                        ),
                    },
                    {
                        backgroundColor: "#fff",
                        image: (
                            <View>
                                <Image
                                    source={require("@/assets/onboarding2.png")}
                                    className="object-contain"
                                    height={100}
                                    width={100}
                                />
                            </View>
                        ),
                        title: (
                            <Text className="text-lg font-semibold text-emerald-700">
                                Real-Time Transaction Tracking
                            </Text>
                        ),
                        subtitle: (
                            <Text className="text-2xl font-semibold text-center">
                                Stay informed with instant updates and complete visibility.
                            </Text>
                        ),
                    },
                    {
                        backgroundColor: "#fff",
                        image: (
                            <View>
                                <Image
                                    source={require("@/assets/onboarding3.png")}
                                    className="object-contain"
                                    height={100}
                                    width={100}
                                />
                            </View>
                        ),
                        title: (
                            <Text className="text-lg font-semibold text-emerald-700">
                                Customer-First Experience
                            </Text>
                        ),
                        subtitle: (
                            <Text className="text-2xl font-semibold text-center">
                                Secure, transparent, and designed to make every transfer effortless.
                            </Text>
                        ),
                    },
                ]}
            />
        </View>
    );
};

export default OnboardingPage;