import { Text, TouchableOpacity, View, Keyboard, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import { Foundation, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react";

const TabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    if (isKeyboardVisible) return null;

    const activeColor = "#059669"; // Emerald 600
    const inactiveColor = "#9ca3af"; // Gray 400

    const icon: any = {
        index: (props: any) => <Foundation name="home" size={26} {...props} />,
        cards: (props: any) => <Ionicons name="card" size={26} {...props} />,
        accounts: (props: any) => <MaterialCommunityIcons name="bank-outline" size={26} {...props} />,
        transactions: (props: any) => <Ionicons name="swap-vertical" size={26} {...props} />
    }

    return (
        <View className="flex-row items-center justify-between bg-white border-t border-gray-100 px-1 py-3 rounded-full absolute bottom-6 mx-8 shadow-md">
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = route.name;

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarButtonTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        className="items-center justify-center flex-1"
                    >
                        {icon[route.name as keyof typeof icon]?.({
                            color: isFocused ? activeColor : inactiveColor
                        })}

                        {/* Only show label if the tab is focused */}
                        {isFocused && (
                            <Text
                                className="text-emerald-700 capitalize font-medium mt-1 text-xs">

                                {label === 'index' ? 'Home' : label}
                            </Text>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export default TabBar;