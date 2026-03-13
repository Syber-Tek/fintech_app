import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { MoneyIcon } from 'phosphor-react-native';
import { supabase } from '@/lib/supabase';


const Sidebar = () => {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [email, setEmail] = useState<string>('');

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setEmail(user.email || '');
                const { data, error } = await supabase
                    .from('profiles')
                    .select('first_name, last_name')
                    .eq('id', user.id)
                    .single();
                if (!error) setProfile(data);
            }
        };
        fetchProfile();
    }, []);

    const menuItems = [
        { name: 'Expenses', icon: 'trending-down', lib: 'Feather', path: '/screens/expenses' },
        { name: 'Payment', lib: 'MoneyIcon', path: '/screens/payment' },
        { name: 'Savings', icon: 'savings', lib: 'MaterialIcons', path: '/screens/savings' },
        { name: 'Profile', icon: 'user', lib: 'Feather', path: '/screens/profile' },
        { name: 'Settings', icon: 'settings', lib: 'Feather', path: '/screens/settings' },
    ];

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.replace('/(auth)/login');
        } catch (error: any) {
            Alert.alert('Logout Error', error.message);
        }
    };

    const fullName = profile ? `${profile.first_name} ${profile.last_name}` : 'User';
    const initials = profile ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase() : '??';

    return (
        <View className="flex-1 px-6 pt-16 bg-white">
            {/* User Profile Section */}
            <View className="flex-row items-center mb-10">
                <View className="items-center justify-center w-12 h-12 bg-emerald-100 rounded-full">
                    <Text className="font-bold text-emerald-700">{initials}</Text>
                </View>
                <View className="ml-4">
                    <Text className="text-lg font-bold">{fullName}</Text>
                    {email ? <Text className="text-xs text-gray-400">{email}</Text> : null}
                </View>
            </View>

            {/* Navigation Links */}
            <ScrollView className="flex-1">
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        className="flex-row items-center py-4"
                        onPress={() => router.push(item.path as any)}
                    >
                        {/* Dynamically render the correct icon library */}
                        {item.lib === 'MaterialIcons' ? (
                            <MaterialIcons name={item.icon as any} size={22} color="#374151" />
                        ) : item.lib === 'MoneyIcon' ? (
                            <MoneyIcon size={22} color="#374151" />
                        ) : (
                            <Feather name={item.icon as any} size={22} color="#374151" />
                        )}


                        <Text className="ml-4 text-base font-medium text-gray-700">
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Logout Button */}
            <TouchableOpacity
                className="flex-row items-center py-10 border-t border-gray-100"
                onPress={handleLogout}
            >
                <Ionicons name="log-out" size={22} color="#374151" />
                <Text className="ml-4 text-base font-medium text-gray-700">Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Sidebar;