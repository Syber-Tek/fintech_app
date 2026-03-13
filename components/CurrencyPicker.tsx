import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

const emerald600 = '#059669';

const currencies = [
    { code: 'GHS', label: 'Ghanaian Cedi', flag: '🇬🇭' },
    { code: 'NGN', label: 'Nigerian Naira', flag: '🇳🇬' },
    { code: 'USD', label: 'US Dollar', flag: '🇺🇸' },
];

const CurrencyPicker = ({ visible, onClose, selected, onSelect }: {
    visible: boolean;
    onClose: () => void;
    selected: string;
    onSelect: (v: string) => void;
}) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="justify-end flex-1 bg-black/40">
                <View className="px-5 pt-5 pb-10 bg-white rounded-t-3xl">
                    <Text className="mb-4 text-lg font-bold text-gray-900">Select Currency</Text>
                    <ScrollView style={{ maxHeight: 320 }}>
                        {currencies.map(cur => (
                            <TouchableOpacity
                                key={cur.code}
                                onPress={() => { onSelect(cur.code); onClose(); }}
                                className="flex-row items-center py-4 border-b border-gray-50"
                            >
                                <Text className="mr-3 text-2xl">{cur.flag}</Text>
                                <View className="flex-1">
                                    <Text className="text-sm font-medium text-gray-800">{cur.code}</Text>
                                    <Text className="text-xs text-gray-400">{cur.label}</Text>
                                </View>
                                {selected === cur.code && <Feather name="check" size={18} color={emerald600} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default CurrencyPicker;
