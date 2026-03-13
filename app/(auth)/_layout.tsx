import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {

    return (
        <>
            <StatusBar style="dark" />
            <Stack>
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="register" options={{ headerShown: false }} />
                <Stack.Screen name="forgot_password" options={{ headerShown: false }} />

            </Stack>
        </>
    );
}