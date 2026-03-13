
import { Drawer } from 'expo-router/drawer';
import Sidebar from '@/components/Sidebar';

export default function DrawerLayout() {
    return (
        <Drawer
            drawerContent={(props) => <Sidebar />}
            screenOptions={{
                headerShown: false,
                drawerStyle: { width: '70%' },
            }}
        >
            <Drawer.Screen
                name="(tabs)"
                options={{ drawerLabel: 'Home' }}
            />
        </Drawer>
    );
}