import React, { useState, useEffect, useCallback } from 'react'
import {
    View, Text, ScrollView, TouchableOpacity,
    Modal, TextInput, ActivityIndicator, RefreshControl
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import useCurrency from '@/hooks/useCurrency'
import { supabase } from '@/lib/supabase'
import { Toast } from '@/components/CustomToast'

const emerald600 = '#059669'
const emerald700 = '#047857'

type Period = 'Week' | 'Month' | 'Year'

interface CategoryExpense {
    id: string;
    label: string;
    icon: string;
    color: string;
    bg: string;
    amount: number;
    budget: number;
    txCount: number;
}

const currencySymbols: { [key: string]: string } = {
    GHS: 'GH₵',
    NGN: '₦',
    USD: '$',
}

const periods: Period[] = ['Week', 'Month', 'Year']

const AddExpenseModal = ({ visible, onClose, currencySymbol, onAdded, categories }: { visible: boolean; onClose: () => void, currencySymbol: string, onAdded: () => void, categories: any[] }) => {
    const [title, setTitle] = useState('')
    const [amount, setAmount] = useState('')
    const [selectedCat, setSelectedCat] = useState('')
    const [loading, setLoading] = useState(false)
    const [accountId, setAccountId] = useState('')
    const [accounts, setAccounts] = useState<any[]>([])

    useEffect(() => {
        const fetchAccounts = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from('accounts').select('*').eq('user_id', user.id);
            setAccounts(data || []);
            if (data && data.length > 0) setAccountId(data[0].id);
        }
        if (visible) fetchAccounts();
    }, [visible]);

    const handleSave = async () => {
        if (!amount || !selectedCat || !accountId) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            const { error } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    account_id: accountId,
                    category_id: selectedCat,
                    amount: parseFloat(amount),
                    type: 'expense',
                    description: title,
                    status: 'completed'
                });

            if (error) throw error;
            Toast.show({ type: 'success', text1: 'Success', text2: 'Expense added!' });
            onAdded();
            onClose();
            setTitle(''); setAmount(''); setSelectedCat('');
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" statusBarTranslucent>
            <View className="flex-1 bg-white">
                <View className="flex-row items-center justify-between px-5 pt-12 pb-4 mt-10 border-b border-gray-100">
                    <TouchableOpacity onPress={onClose}>
                        <Feather name="x" size={22} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-base font-semibold text-gray-900">Add Expense</Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        {loading ? <ActivityIndicator size="small" color={emerald600} /> : <Text style={{ color: emerald600 }} className="text-sm font-semibold">Save</Text>}
                    </TouchableOpacity>
                </View>
                <ScrollView className="flex-1 px-5 pt-6">
                    <View className="items-center mb-8">
                        <Text className="mb-2 text-sm text-gray-400">Amount</Text>
                        <View className="flex-row items-center">
                            <Text className="mr-1 text-3xl text-gray-400">{currencySymbol}</Text>
                            <TextInput
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="decimal-pad"
                                placeholder="0.00"
                                placeholderTextColor="#d1d5db"
                                className="font-bold text-gray-900"
                                style={{ fontSize: 40 }}
                            />
                        </View>
                    </View>

                    <View className="mb-4">
                        <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">Title</Text>
                        <View className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                            <TextInput
                                value={title} onChangeText={setTitle}
                                placeholder="e.g. Grocery shopping"
                                placeholderTextColor="#9ca3af"
                                className="text-sm text-gray-800"
                            />
                        </View>
                    </View>

                    <Text className="mb-3 text-xs font-semibold text-gray-500 uppercase">Category</Text>
                    <View className="flex-row flex-wrap gap-2 mb-6">
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setSelectedCat(cat.id)}
                                className="flex-row items-center gap-2 px-3 py-2 border rounded-full"
                                style={{
                                    backgroundColor: selectedCat === cat.id ? '#ecfdf5' : '#f9fafb',
                                    borderColor: selectedCat === cat.id ? emerald600 : '#e5e7eb',
                                }}
                            >
                                <Feather name={(cat.icon as any) || 'activity'} size={14} color={selectedCat === cat.id ? emerald600 : '#6b7280'} />
                                <Text className="text-xs font-medium" style={{ color: selectedCat === cat.id ? emerald600 : '#6b7280' }}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        className={`items-center py-4 rounded-xl  ${amount && selectedCat && !loading ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'}`}
                        onPress={handleSave}
                        disabled={!amount || !selectedCat || loading}
                    >
                        <Text className="text-base font-bold text-white">Add Expense</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
    )
}

export default function ExpensesScreen() {
    const [activePeriod, setActivePeriod] = useState<Period>('Month')
    const [showAdd, setShowAdd] = useState(false)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [expenses, setExpenses] = useState<any[]>([])
    const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([])
    
    const currency = useCurrency()
    const currencySymbol = currencySymbols[currency]

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: cats } = await supabase.from('categories').select('*');
            setCategories(cats || []);

            const { data: txs } = await supabase
                .from('transactions')
                .select('*, category:categories(*)')
                .eq('user_id', user.id)
                .eq('type', 'expense')
                .order('created_at', { ascending: false });

            setExpenses(txs || []);

            if (cats && txs) {
                const breakdown = cats.map(cat => {
                    const catTxs = txs.filter(t => t.category_id === cat.id);
                    const amount = catTxs.reduce((sum, t) => sum + Number(t.amount), 0);
                    return {
                        id: cat.id,
                        label: cat.name,
                        icon: cat.icon,
                        color: cat.color || emerald600,
                        bg: (cat.color + '20') || '#ecfdf5',
                        amount: amount,
                        budget: 1000, // Mock budget for now
                        txCount: catTxs.length
                    };
                }).filter(c => c.txCount > 0);
                setCategoryExpenses(breakdown);
            }

        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const totalExpenses = expenses.reduce((s, c) => s + Number(c.amount), 0)
    const totalBudget = categoryExpenses.length * 1000 // Mock budget logic
    const overallProgress = totalBudget > 0 ? totalExpenses / totalBudget : 0

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color={emerald600} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={{ backgroundColor: emerald700 }} className="px-5 pt-6 pb-16">
                    <View className="flex-row items-center justify-between mb-6">
                        <View>
                            <Text className="text-2xl font-bold text-white">Expenses</Text>
                            <Text className="text-emerald-200 text-sm mt-0.5">Track your spending</Text>
                        </View>
                    </View>

                    <View className="flex-row p-1 bg-white/10 rounded-2xl">
                        {periods.map(p => (
                            <TouchableOpacity
                                key={p}
                                onPress={() => setActivePeriod(p)}
                                className="items-center flex-1 py-2 rounded-xl"
                                style={{ backgroundColor: activePeriod === p ? 'white' : 'transparent' }}
                            >
                                <Text
                                    className="text-sm font-semibold"
                                    style={{ color: activePeriod === p ? emerald700 : 'rgba(255,255,255,0.7)' }}
                                >
                                    {p}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View className="px-5 py-5 mx-5 mb-4 -mt-8 bg-white shadow-sm rounded-xl">
                    <View className="flex-row justify-between mb-3">
                        <View>
                            <Text className="text-xs text-gray-400">Total Spent</Text>
                            <Text className="text-2xl font-bold text-gray-900">{currencySymbol}{totalExpenses.toLocaleString()}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-xs text-gray-400">Budget Limit</Text>
                            <Text className="text-2xl font-bold text-gray-900">{currencySymbol}{totalBudget.toLocaleString()}</Text>
                        </View>
                    </View>

                    <View className="h-3 mb-2 overflow-hidden bg-gray-100 rounded-full">
                        <View
                            style={{
                                width: `${Math.min(overallProgress * 100, 100)}%`,
                                backgroundColor: overallProgress > 0.85 ? '#ef4444' : emerald600,
                            }}
                            className="h-full rounded-full"
                        />
                    </View>
                    <Text className="text-xs text-gray-400">
                        {(overallProgress * 100).toFixed(0)}% of limit used • {currencySymbol}{(totalBudget - totalExpenses).toLocaleString()} remaining
                    </Text>
                </View>

                <View className="px-5 mb-2">
                    <Text className="mb-3 text-base font-semibold text-gray-800">Breakdown</Text>
                    {categoryExpenses.length === 0 ? (
                        <Text className="text-center text-gray-400 py-10 bg-white rounded-xl">No expenses recorded yet.</Text>
                    ) : (
                        categoryExpenses.map((cat, index) => {
                            const progress = cat.amount / cat.budget
                            const isOver = progress > 0.85
                            return (
                                <View key={cat.id}>
                                    <View className="px-4 py-4 my-1 bg-white rounded-lg">
                                        <View className="flex-row items-center mb-2">
                                            <View style={{ backgroundColor: cat.bg }} className="items-center justify-center mr-3 w-9 h-9 rounded-xl">
                                                <Feather name={(cat.icon as any) || 'activity'} size={16} color={cat.color} />
                                            </View>
                                            <View className="flex-1">
                                                <View className="flex-row justify-between">
                                                    <Text className="text-sm font-medium text-gray-800">{cat.label}</Text>
                                                    <Text className="text-sm font-semibold text-gray-800">{currencySymbol}{Number(cat.amount).toLocaleString()}</Text>
                                                </View>
                                                <View className="flex-row justify-between mt-0.5">
                                                    <Text className="text-xs text-gray-400">{cat.txCount} transactions</Text>
                                                    <Text className="text-xs" style={{ color: isOver ? '#ef4444' : '#9ca3af' }}>
                                                        of {currencySymbol}{cat.budget}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-12">
                                            <View
                                                style={{
                                                    width: `${Math.min(progress * 100, 100)}%`,
                                                    backgroundColor: isOver ? '#ef4444' : cat.color,
                                                }}
                                                className="h-full rounded-full"
                                            />
                                        </View>
                                    </View>
                                </View>
                            )
                        })
                    )}
                </View>

                <View className="px-5 mt-4 ">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-base font-semibold text-gray-800">Recent Expenses</Text>
                    </View>
                    <View className="gap-y-2">
                        {expenses.slice(0, 5).map((item) => (
                            <View key={item.id} className="flex-row items-center px-4 py-3 bg-white rounded-2xl shadow-sm">
                                <View 
                                    style={{ backgroundColor: (item.category?.color + '20') || '#f3f4f6' }} 
                                    className="items-center justify-center mr-3 rounded-full w-11 h-11"
                                >
                                    <Feather name={(item.category?.icon as any) || 'activity'} size={17} color={item.category?.color || emerald600} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-800">{item.description || item.category?.name || 'Expense'}</Text>
                                    <Text className="text-gray-400 text-xs mt-0.5">{item.category?.name} · {new Date(item.created_at).toLocaleDateString()}</Text>
                                </View>
                                <Text className="text-sm font-bold text-red-500">
                                    -{currencySymbol}{Number(item.amount).toLocaleString()}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <TouchableOpacity
                onPress={() => setShowAdd(true)}
                style={{ backgroundColor: emerald600 }}
                className="absolute items-center justify-center rounded-full bottom-28 right-5 w-14 h-14"
                {...{ elevation: 6 }}
            >
                <Feather name="plus" size={24} color="white" />
            </TouchableOpacity>

            <AddExpenseModal 
                visible={showAdd} 
                onClose={() => setShowAdd(false)} 
                currencySymbol={currencySymbol} 
                onAdded={fetchData}
                categories={categories}
            />
        </View>
    )
}