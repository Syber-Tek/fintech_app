import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, RefreshControl } from 'react-native'
import { Feather } from '@expo/vector-icons'
import useCurrency from '@/hooks/useCurrency'
import { supabase } from '@/lib/supabase'
import { Toast } from '@/components/CustomToast'

const emerald600 = '#059669'

type FilterType = 'All' | 'income' | 'expense' | 'transfer'

interface Transaction {
    id: string;
    amount: number;
    type: FilterType;
    description: string;
    merchant_name: string;
    status: string;
    created_at: string;
    category?: { name: string, icon: string, color: string };
    account_id: string;
}

const currencySymbols: { [key: string]: string } = {
    GHS: 'GH₵',
    NGN: '₦',
    USD: '$',
}

const filters: { label: string, value: FilterType }[] = [
    { label: 'All', value: 'All' as any },
    { label: 'Income', value: 'income' },
    { label: 'Expense', value: 'expense' },
    { label: 'Transfer', value: 'transfer' }
]

export default function TransactionsScreen() {
    const [activeFilter, setActiveFilter] = useState<FilterType | 'All'>('All')
    const [search, setSearch] = useState('')
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
    
    const currency = useCurrency()
    const currencySymbol = currencySymbols[currency]

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let query = supabase
                .from('transactions')
                .select('*, category:categories(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (activeFilter !== 'All') {
                query = query.eq('type', activeFilter);
            }

            if (search) {
                query = query.or(`description.ilike.%${search}%,merchant_name.ilike.%${search}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setTransactions(data || []);

        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Fetch Error', text2: error.message });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeFilter, search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const totalSpending = transactions.reduce((s, t) => s + Math.abs(Number(t.amount)), 0)

    const groupByDate = (items: Transaction[]) => {
        const groups: Record<string, Transaction[]> = {}
        items.forEach(item => {
            const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            if (!groups[date]) groups[date] = []
            groups[date].push(item)
        })
        return groups
    }

    const grouped = groupByDate(transactions)

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color={emerald600} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <View className="px-5 pt-5 pb-4 bg-white border-b border-gray-100">
                <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-2xl font-bold text-gray-900">Transactions</Text>
                </View>

                <View className="mb-4">
                    <Text className="text-xs text-gray-400">Total volume</Text>
                    <Text className="text-2xl font-bold text-gray-900">
                        {currencySymbol}{totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                </View>

                <View className="flex-row items-center px-4 py-3 mb-4 bg-gray-100 rounded-2xl">
                    <Feather name="search" size={18} color="#9ca3af" />
                    <TextInput
                        placeholder="Search transactions..."
                        value={search}
                        onChangeText={setSearch}
                        className="flex-1 ml-2 text-sm text-gray-700"
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                    {filters.map(f => (
                        <TouchableOpacity
                            key={f.value}
                            onPress={() => setActiveFilter(f.value)}
                            className="px-5 py-2 rounded-full mr-2"
                            style={{ backgroundColor: activeFilter === f.value ? emerald600 : '#f3f4f6' }}
                        >
                            <Text className="text-sm font-medium" style={{ color: activeFilter === f.value ? 'white' : '#6b7280' }}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View className="flex-row justify-between px-5 py-4 mx-5 mt-4 bg-white border border-gray-200 rounded-lg ">
                <View className="items-center flex-1">
                    <View className="flex-row items-center gap-1 mb-1">
                        <View className="w-2 h-2 rounded-full bg-emerald-500" />
                        <Text className="text-xs text-gray-400">Income</Text>
                    </View>
                    <Text className="text-base font-bold text-gray-900">
                        {currencySymbol}{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                </View>
                <View className="w-px bg-gray-200" />
                <View className="items-center flex-1">
                    <View className="flex-row items-center gap-1 mb-1">
                        <View className="w-2 h-2 bg-red-400 rounded-full" />
                        <Text className="text-xs text-gray-400">Expense</Text>
                    </View>
                    <Text className="text-base font-bold text-gray-900">
                        {currencySymbol}{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                </View>
            </View>

            <ScrollView
                className="flex-1 mt-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {Object.keys(grouped).length === 0 ? (
                    <View className="items-center justify-center py-20 ">
                        <Feather name="inbox" size={40} color="#d1d5db" />
                        <Text className="mt-3 text-sm text-gray-400">No transactions found</Text>
                    </View>
                ) : (
                    Object.entries(grouped).map(([date, items]) => (
                        <View key={date} className="mb-4">
                            <Text className="mb-2 text-xs font-semibold text-gray-400 uppercase">{date}</Text>
                            <View className="gap-y-2">
                                {items.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        className="flex-row items-center px-4 py-4 rounded-2xl bg-gray-50 shadow-sm"
                                        onPress={() => setSelectedTx(item)}
                                    >
                                        <View 
                                            style={{ backgroundColor: item.category?.color || '#f3f4f6' }} 
                                            className="items-center justify-center mr-3 rounded-full w-11 h-11"
                                        >
                                            <Feather name={(item.category?.icon as any) || 'activity'} size={17} color="white" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                                                {item.merchant_name || item.description || item.category?.name || 'Transaction'}
                                            </Text>
                                            <Text className="text-gray-400 text-xs mt-0.5">{item.type.toUpperCase()}</Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className={`text-sm font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                {item.type === 'income' ? '+' : '-'}{currencySymbol}{Math.abs(Number(item.amount)).toLocaleString()}
                                            </Text>
                                            <Text className="text-gray-400 text-xs mt-0.5">
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={selectedTx !== null} transparent animationType="slide" statusBarTranslucent>
                <View className="justify-end flex-1 bg-black/40">
                    <View className="px-6 pt-6 pb-10 bg-white rounded-t-3xl">
                        <TouchableOpacity className="self-end mb-2" onPress={() => setSelectedTx(null)}>
                            <Feather name="x" size={22} color="#9ca3af" />
                        </TouchableOpacity>

                        <View className="items-center mb-5">
                            <View style={{ backgroundColor: '#d1fae5' }} className="items-center justify-center w-12 h-12 mb-3 rounded-full">
                                <Feather name="check" size={22} color={emerald600} />
                            </View>
                            <Text className="text-lg font-bold text-gray-900">Transaction {selectedTx?.status}</Text>
                            <Text className="mt-1 text-xl font-bold text-gray-800 text-center">
                                {selectedTx?.merchant_name || selectedTx?.description || 'FINANCIAL TRANSACTION'}
                            </Text>
                        </View>

                        <View style={{ borderStyle: 'dashed', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 }} />

                        {[
                            { label: 'Date', value: selectedTx ? new Date(selectedTx.created_at).toLocaleDateString() : '' },
                            { label: 'Time', value: selectedTx ? new Date(selectedTx.created_at).toLocaleTimeString() : '' },
                            { label: 'Type', value: selectedTx?.type.toUpperCase() },
                            { label: 'Category', value: selectedTx?.category?.name || 'Uncategorized' },
                            { label: 'Status', value: selectedTx?.status.toUpperCase() },
                        ].map((row) => (
                            <View key={row.label} className="flex-row items-center justify-between mb-3">
                                <Text className="text-sm text-gray-400">{row.label}</Text>
                                <Text className="flex-1 ml-4 text-sm font-medium text-right text-gray-800">{row.value}</Text>
                            </View>
                        ))}

                        <View style={{ borderStyle: 'dashed', borderWidth: 1, borderColor: '#e5e7eb', marginVertical: 16 }} />

                        <View className="flex-row items-center justify-between mb-6">
                            <Text className="text-base font-bold text-gray-800">Amount</Text>
                            <Text className={`text-lg font-bold ${selectedTx?.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {currencySymbol}{Math.abs(Number(selectedTx?.amount ?? 0)).toLocaleString()}
                            </Text>
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity className="flex-1 border border-gray-200 rounded-2xl py-3.5 items-center flex-row justify-center gap-2">
                                <Feather name="share-2" size={16} color="#374151" />
                                <Text className="font-semibold text-gray-700">Share</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ backgroundColor: emerald600 }}
                                className="flex-1 rounded-2xl py-3.5 items-center flex-row justify-center gap-2"
                                onPress={() => setSelectedTx(null)}
                            >
                                <Text className="font-semibold text-white">Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}