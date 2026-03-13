import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";

const ScreenLayout = () => {
    const { colorScheme } = useColorScheme();
    return (
        <>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            <Stack>
                <Stack.Screen name="onboarding"  options={{ headerShown: false }}/>
            </Stack>
        
        </>
    )
}

export default ScreenLayout