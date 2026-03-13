import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, RefreshControl } from 'react-native'
import { Feather } from '@expo/vector-icons'
import useCurrency from '@/hooks/useCurrency'
import { useRouter } from 'expo-router'
import { TrendDownIcon, MoneyIcon, PiggyBankIcon } from "phosphor-react-native"
import { supabase } from '@/lib/supabase'
import { Toast } from '@/components/CustomToast'

const emerald600 = '#059669'

const quickAccess = [
    { label: 'Savings', icon: <PiggyBankIcon size={22} color='#111827' />, link: "/screens/savings" },
    { label: 'Payment', icon: <MoneyIcon size={22} color='#111827' />, link: "/screens/payment" },
    { label: 'Expenses', icon: <TrendDownIcon size={22} color='#111827' />, link: "/screens/expenses" },
    { label: 'Settings', icon: <Feather name="settings" size={22} color='#111827' />, link: "/screens/settings" },
]

const currencySymbols: { [key: string]: string } = {
    GHS: 'GH₵',
    NGN: '₦',
    USD: '$',
}

interface Transaction {
    id: string;
    description: string;
    merchant_name: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    created_at: string;
    category?: { name: string, icon: string, color: string };
}

const AddMoneyModal = ({ visible, onClose, onAdded, currencySymbol, currentBalance }: { visible: boolean, onClose: () => void, onAdded: () => void, currencySymbol: string, currentBalance: number }) => {
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)

    const handleAddMoney = async () => {
        if (!amount) return
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not found')

            const newBalance = Number(currentBalance) + parseFloat(amount)

            // 1. Update Profile Balance (Source of Truth)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ account_balance: newBalance })
                .eq('id', user.id)

            if (profileError) throw profileError

            // 2. Record transaction for history
            await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    amount: parseFloat(amount),
                    type: 'income',
                    description: 'Wallet Top-up',
                    merchant_name: 'Self',
                    status: 'completed'
                })

            Toast.show({ type: 'success', text1: 'Success', text2: `Added ${currencySymbol}${amount} to your wallet` })
            onAdded()
            onClose()
            setAmount('')
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="justify-end flex-1 bg-black/40">
                <View className="px-5 pt-5 pb-10 bg-white rounded-t-3xl">
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-xl font-bold text-gray-900">Add Money</Text>
                        <TouchableOpacity onPress={onClose}><Feather name="x" size={24} color="#9ca3af" /></TouchableOpacity>
                    </View>

                    <Text className="mb-2 text-xs font-semibold text-gray-500 uppercase">Amount</Text>
                    <View className="flex-row items-center px-4 py-4 mb-8 border border-gray-200 rounded-2xl bg-gray-50">
                        <Text className="mr-2 text-xl text-gray-400">{currencySymbol}</Text>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor="#9ca3af"
                            className="flex-1 text-xl font-bold text-gray-900"
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity
                        className={`items-center py-4 rounded-2xl ${amount && !loading ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'}`}
                        onPress={handleAddMoney}
                        disabled={!amount || loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-base font-bold text-white">Confirm Top-up</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

export default function HomeScreen() {
    const [balanceVisible, setBalanceVisible] = useState(true)
    const [profileBalance, setProfileBalance] = useState(0)
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [showAddMoney, setShowAddMoney] = useState(false)
    
    const currency = useCurrency()
    const currencySymbol = currencySymbols[currency]
    const router = useRouter()

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Fetch balance directly from profiles table
            const { data: profile, error: profError } = await supabase
                .from('profiles')
                .select('account_balance')
                .eq('id', user.id)
                .single()
            
            if (!profError && profile) {
                setProfileBalance(Number(profile.account_balance || 0))
            }

            // 2. Fetch latest transactions
            const { data: txs, error: txError } = await supabase
                .from('transactions')
                .select('*, category:categories(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5)
            
            if (!txError && txs) setRecentTransactions(txs)

        } catch (error) {} finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const onRefresh = () => {
        setRefreshing(true)
        fetchData()
    }

    if (loading && !refreshing) {
        return (
            <View className="items-center justify-center flex-1 bg-white">
                <ActivityIndicator size="large" color={emerald600} />
            </View>
        )
    }

    return (
        <ScrollView
            className="flex-1 bg-white"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={{ backgroundColor: emerald600 }} className="px-5 pt-6 pb-16">
                <Text className="mb-1 text-sm font-medium text-white opacity-90">Total Wallet Balance</Text>
                <View className="flex-row items-center gap-2 mb-5">
                    <Text className="font-bold text-white" style={{ fontSize: 36, letterSpacing: -1 }}>
                        {currencySymbol}{balanceVisible ? profileBalance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '••••••••••'}
                    </Text>
                    <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)} className="ml-2">
                        <Feather name={balanceVisible ? 'eye' : 'eye-off'} size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <View className="flex-row gap-3">
                    <TouchableOpacity 
                        className="px-5 py-2 bg-white rounded-full"
                        onPress={() => router.push('/screens/payment')}
                    >
                        <Text className="text-sm font-medium text-emerald-700">Make Transfer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        className="px-5 py-2 border border-white rounded-full"
                        onPress={() => setShowAddMoney(true)}
                    >
                        <Text className="text-sm font-medium text-white">Add Money</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="px-5 py-5 -mt-8 bg-white rounded-tl-3xl rounded-tr-3xl">
                <Text className="mb-4 text-base font-semibold text-gray-900">Quick Access</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
                    {quickAccess.map((item) => (
                        <TouchableOpacity
                            key={item.label}
                            className="items-center px-4 py-6 mx-2 bg-gray-50 rounded-2xl"
                            style={{ width: 100 }}
                            onPress={() => router.navigate(item.link as any)}
                        >
                            <View className='p-3 bg-white rounded-full mb-2'>
                                {item.icon}
                            </View>
                            <Text className="text-xs font-medium text-center text-gray-700">{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View className="h-px my-5 bg-gray-200" />

                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-base font-semibold text-gray-900">Recent Transactions</Text>
                    <TouchableOpacity onPress={() => router.push('/(drawer)/(tabs)/transactions')}>
                        <Text style={{ color: emerald600 }} className="text-sm font-medium">See all</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ gap: 12 }}>
                    {recentTransactions.length === 0 ? (
                        <Text className="text-center text-gray-400 py-10">No recent transactions.</Text>
                    ) : (
                        recentTransactions.map((item) => (
                            <View key={item.id} className="flex-row items-center p-4 bg-gray-50 rounded-2xl shadow-sm">
                                <View
                                    style={{ backgroundColor: item.category?.color || (item.type === 'income' ? '#d1fae5' : '#fee2e2') }}
                                    className="items-center justify-center w-11 h-11 mr-3 rounded-full"
                                >
                                    <Feather name={(item.category?.icon || (item.type === 'income' ? 'plus' : 'minus')) as any} size={18} color="white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                                        {item.merchant_name || item.description || 'Transaction'}
                                    </Text>
                                    <Text className="text-xs text-gray-400 mt-0.5">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={{ color: item.type === 'income' ? emerald600 : '#ef4444' }} className="text-sm font-bold">
                                    {item.type === 'income' ? '+' : '-'}{currencySymbol}{Math.abs(item.amount).toLocaleString()}
                                </Text>
                            </View>
                        ))
                    )}
                </View>
            </View>

            <AddMoneyModal 
                visible={showAddMoney} 
                onClose={() => setShowAddMoney(false)} 
                onAdded={fetchData}
                currencySymbol={currencySymbol}
                currentBalance={profileBalance}
            />
        </ScrollView>
    )
}
