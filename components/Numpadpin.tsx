import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface NumPadPinProps {
    title: string
    subtitle?: string
    buttonLabel: string
    onSubmit: (pin: string) => void
    loading?: boolean
}

const NumPadPin = ({ title, subtitle, buttonLabel, onSubmit, loading = false }: NumPadPinProps) => {
    const [pin, setPin] = useState<string[]>(['', '', '', ''])

    const isPinComplete = pin.every(d => d !== '')

    const handlePress = (num: string) => {
        const emptyIndex = pin.findIndex(d => d === '')
        if (emptyIndex !== -1) {
            const updated = [...pin]
            updated[emptyIndex] = num
            setPin(updated)
        }
    }

    const handleDelete = () => {
        const lastFilled = [...pin].map((v, i) => ({ v, i })).filter(x => x.v !== '').pop()
        if (lastFilled) {
            const updated = [...pin]
            updated[lastFilled.i] = ''
            setPin(updated)
        }
    }

    const handleSubmit = () => {
        if (isPinComplete) onSubmit(pin.join(''))
    }

    return (
        <ScrollView 
            className="flex-1 bg-white" 
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
        >
            <View className="flex-1 px-6 pt-4 pb-8">
                {/* Title */}
                <View className="items-center mb-10 gap-y-2">
                    <Text className="text-2xl font-bold text-gray-900">{title}</Text>
                    {subtitle && <Text className="text-gray-400 text-sm text-center">{subtitle}</Text>}
                </View>

                {/* Dot indicators */}
                <View className="flex-row justify-center gap-x-3 mb-10">
                    {pin.map((val, i) => (
                        <View
                            key={i}
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: val !== '' ? '#059669' : '#d1d5db' }}
                        />
                    ))}
                </View>

                {/* Numpad */}
                <View className="gap-y-4 mb-10">
                    {[[1, 2, 3], [4, 5, 6], [7, 8, 9]].map((row, ri) => (
                        <View key={ri} className="flex-row justify-around">
                            {row.map((num) => (
                                <TouchableOpacity
                                    key={num}
                                    className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center"
                                    onPress={() => handlePress(String(num))}
                                >
                                    <Text className="text-2xl font-semibold text-gray-800">{num}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}

                    {/* Bottom row: dot, 0, backspace */}
                    <View className="flex-row justify-around">
                        <View className="w-20 h-20 items-center justify-center">
                            <Text className="text-2xl font-semibold text-gray-800">·</Text>
                        </View>
                        <TouchableOpacity
                            className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center"
                            onPress={() => handlePress('0')}
                        >
                            <Text className="text-2xl font-semibold text-gray-800">0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="w-20 h-20 items-center justify-center"
                            onPress={handleDelete}
                        >
                            <MaterialCommunityIcons name="backspace-outline" size={26} color="#374151" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    className="py-4 rounded-2xl mt-auto"
                    style={{ backgroundColor: isPinComplete && !loading ? '#059669' : '#6ee7b7' }}
                    onPress={handleSubmit}
                    disabled={!isPinComplete || loading}
                >
                    <Text className="text-lg font-bold text-center text-white">
                        {loading ? 'Processing...' : buttonLabel}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}

export default NumPadPin