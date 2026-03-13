import React, { useState, useEffect, useCallback } from 'react'
import {
    View, Text, ScrollView, TouchableOpacity,
    Modal, ActivityIndicator, RefreshControl,
    TextInput
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import useCurrency from '@/hooks/useCurrency'
import { supabase } from '@/lib/supabase'
import { Toast } from '@/components/CustomToast'

const emerald600 = '#059669'
const emerald700 = '#047857'
const currencyFlags: { [key: string]: string } = {
    GHS: '🇬🇭',
    NGN: '🇳🇬',
    USD: '🇺🇸',
};

const gradients = [
    [emerald700, emerald600],
    ['#1e3a5f', '#2563eb'],
    ['#4a0000', '#991b1b'],
    ['#4c1d95', '#7c3aed'],
];

interface Account {
    id: string;
    account_name: string;
    account_type: string;
    balance: number;
    currency: string;
    status: string;
    created_at: string;
}

interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    created_at: string;
    category?: { name: string, icon: string, color: string };
}

const detailActions = [
    { label: 'Transfer', sublabel: 'Send money', icon: 'send', bg: '#ede9fe', color: '#7c3aed' },
    { label: 'Add Money', sublabel: 'Fund account', icon: 'plus-circle', bg: '#d1fae5', color: emerald600 },
    { label: 'View More', sublabel: 'All transactions', icon: 'list', bg: '#fef3c7', color: '#d97706' },
]

const currencySymbols: { [key: string]: string } = {
    GHS: 'GH₵',
    NGN: '₦',
    USD: '$',
}

export default function AccountsScreen() {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
    const [showAddAccount, setShowAddAccount] = useState(false)
    
    // New Account form state
    const [newAccName, setNewAccName] = useState('')
    const [newAccType, setNewAccType] = useState('checking')
    const [creating, setCreating] = useState(false)
    
    const currency = useCurrency()
    const currencySymbol = currencySymbols[currency]
    const currencyFlag = currencyFlags[currency]

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Accounts
            const { data: accountsData, error: accountsError } = await supabase
                .from('accounts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (accountsError) throw accountsError;
            setAccounts(accountsData || []);

            // Fetch Recent Transactions
            const { data: transData, error: transError } = await supabase
                .from('transactions')
                .select('*, category:categories(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (transError) throw transError;
            setTransactions(transData || []);

        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Fetch Error',
                text2: error.message
            });
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddAccount = async () => {
        if (!newAccName) return;
        setCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error } = await supabase
                .from('accounts')
                .insert({
                    user_id: user.id,
                    account_name: newAccName,
                    account_type: newAccType,
                    balance: 0,
                    currency: currency,
                    status: 'active'
                });

            if (error) throw error;

            Toast.show({ type: 'success', text1: 'Success', text2: 'Account created successfully!' });
            setShowAddAccount(false);
            setNewAccName('');
            fetchData();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message });
        } finally {
            setCreating(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

    const formatAmount = (amount: number, type: string) => {
        const prefix = type === 'income' ? '+' : '-';
        return `${prefix}${currencySymbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color={emerald600} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="px-5 pt-5 pb-4 bg-white border-b border-gray-100">
                <View className="flex-row items-start justify-between mb-4">
                    <View>
                        <Text className="text-2xl font-bold text-gray-900">Your Accounts</Text>
                        <Text className="text-gray-400 text-sm mt-0.5">Manage all your bank accounts</Text>
                    </View>
                </View>

                {/* Total balance pill */}
                <View style={{ backgroundColor: '#f0fdf4' }} className="flex-row items-center justify-between px-4 py-3 rounded-2xl">
                    <View>
                        <Text className="text-gray-400 text-xs mb-0.5">Total Balance</Text>
                        <Text className="text-xl font-bold text-gray-900">
                            {currencySymbol}{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                        <View className="w-2 h-2 rounded-full bg-emerald-500" />
                        <Text className="text-xs font-medium text-emerald-600">{accounts.length} Accounts</Text>
                    </View>
                </View>
            </View>

            {/* Account Cards */}
            <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {accounts.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <Text className="text-gray-400">No accounts found. Add one to get started!</Text>
                    </View>
                ) : (
                    accounts.map((account, index) => (
                        <TouchableOpacity
                            key={account.id}
                            onPress={() => setSelectedAccount(account)}
                            activeOpacity={0.92}
                            className="mb-4 rounded-2xl h-[180px] overflow-hidden"
                        >
                            <LinearGradient
                                colors={gradients[index % gradients.length] as [string, string]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <View>
                                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 1 }}>RINGPAY</Text>
                                        <Text style={{ color: 'white', fontWeight: '800', fontSize: 24, marginTop: 4, letterSpacing: -0.5 }}>
                                            {currencySymbols[account.currency] || '$'}{Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </Text>
                                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
                                            {account.account_name}
                                        </Text>
                                    </View>
                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                                        <Text style={{ color: 'white', fontSize: 11, fontWeight: '600' }}>{account.account_type}</Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ fontSize: 20 }}>{currencyFlags[account.currency] || '🇺🇸'}</Text>
                                        <View>
                                            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Status</Text>
                                            <Text style={{ color: 'white', fontWeight: '600', fontSize: 13, textTransform: 'capitalize' }}>{account.status}</Text>
                                        </View>
                                    </View>
                                    <Feather name="chevron-right" size={20} color="white" />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* FAB */}
            <View className="absolute pb-4 shadow-md bottom-24 right-5">
                <TouchableOpacity
                    style={{ backgroundColor: emerald600 }}
                    className="flex-row items-center gap-2 px-5 py-3.5 rounded-full"
                    onPress={() => setShowAddAccount(true)}
                >
                    <Feather name="plus" size={18} color="white" />
                    <Text className="text-sm font-semibold text-white">New Account</Text>
                </TouchableOpacity>
            </View>

            {/* Add Account Modal */}
            <Modal visible={showAddAccount} animationType="slide" presentationStyle="pageSheet" statusBarTranslucent>
                <View className="flex-1 bg-white">
                    <View className="flex-row items-center justify-between px-5 pt-12 pb-4 border-b border-gray-100">
                        <TouchableOpacity onPress={() => setShowAddAccount(false)}>
                            <Feather name="x" size={22} color="#374151" />
                        </TouchableOpacity>
                        <Text className="text-base font-semibold text-gray-900">New Account</Text>
                        <TouchableOpacity onPress={handleAddAccount} disabled={creating || !newAccName}>
                            {creating ? <ActivityIndicator size="small" color={emerald600} /> : <Text style={{ color: emerald600 }} className="text-sm font-semibold">Create</Text>}
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 px-5 pt-6">
                        <View className="mb-6">
                            <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">Account Name</Text>
                            <View className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                                <TextInput
                                    value={newAccName}
                                    onChangeText={setNewAccName}
                                    placeholder="e.g. My Savings, Business Wallet"
                                    placeholderTextColor="#9ca3af"
                                    className="text-sm text-gray-800"
                                />
                            </View>
                        </View>

                        <Text className="text-gray-500 text-xs font-semibold uppercase mb-3">Account Type</Text>
                        <View className="flex-row flex-wrap gap-2 mb-8">
                            {['checking', 'savings', 'investment', 'credit'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setNewAccType(type)}
                                    className="px-4 py-2 border rounded-full"
                                    style={{
                                        backgroundColor: newAccType === type ? '#ecfdf5' : '#f9fafb',
                                        borderColor: newAccType === type ? emerald600 : '#e5e7eb',
                                    }}
                                >
                                    <Text className="text-xs font-medium" style={{ color: newAccType === type ? emerald600 : '#6b7280', textTransform: 'capitalize' }}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            className={`items-center py-4 rounded-xl ${newAccName && !creating ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'} `}
                            onPress={handleAddAccount}
                            disabled={!newAccName || creating}
                        >
                            <Text className="text-base font-bold text-white">Create Account</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            {/* Account Detail Modal */}
            <Modal visible={selectedAccount !== null} animationType="slide" presentationStyle="pageSheet" statusBarTranslucent>
                {selectedAccount && (
                    <View className="flex-1 bg-gray-50">
                        {/* Gradient Header */}
                        <LinearGradient
                            colors={gradients[accounts.indexOf(selectedAccount) % gradients.length] as [string, string]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ paddingHorizontal: 20, paddingTop: 52, paddingBottom: 48 }}
                        >
                            <TouchableOpacity onPress={() => setSelectedAccount(null)} className="mb-5">
                                <Feather name="arrow-left" size={22} color="white" />
                            </TouchableOpacity>

                            <View style={{ alignItems: 'center' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6 }}>Account Balance</Text>
                                <Text style={{ color: 'white', fontWeight: '800', fontSize: 36, letterSpacing: -1 }}>
                                    {currencySymbols[selectedAccount.currency] || '$'}{Number(selectedAccount.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 5 }}>
                                    {selectedAccount.account_name} • {selectedAccount.account_type}
                                </Text>
                            </View>
                        </LinearGradient>

                        {/* Action Cards */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: -28, marginBottom: 20 }}>
                            {detailActions.map((action) => (
                                <TouchableOpacity
                                    key={action.label}
                                    className="flex-1 bg-white rounded-2xl items-center py-4 mx-1.5 shadow-sm"
                                    style={{ elevation: 2 }}
                                >
                                    <View style={{ backgroundColor: action.bg, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                                        <Feather name={action.icon as any} size={18} color={action.color} />
                                    </View>
                                    <Text className="text-gray-800 font-semibold text-[12px]">{action.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Recent Transactions for this specific account */}
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                            <Text className="text-gray-900 font-bold text-base mb-4">Recent Transactions</Text>
                            <View className="gap-y-2">
                                {transactions.filter(t => (t as any).account_id === selectedAccount.id).map((item) => (
                                    <View key={item.id} className="flex-row items-center p-4 bg-white rounded-2xl shadow-sm">
                                        <View 
                                            style={{ backgroundColor: item.category?.color || '#f3f4f6', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                                        >
                                            <Feather name={(item.category?.icon as any) || 'activity'} size={18} color="white" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-900 font-bold text-sm">{(item as any).merchant_name || item.category?.name || 'Transaction'}</Text>
                                            <Text className="text-gray-400 text-xs mt-1">{new Date(item.created_at).toLocaleDateString()}</Text>
                                        </View>
                                        <Text className={`font-bold text-sm ${item.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {formatAmount(item.amount, item.type)}
                                        </Text>
                                    </View>
                                ))}
                                {transactions.filter(t => (t as any).account_id === selectedAccount.id).length === 0 && (
                                    <Text className="text-center text-gray-400 py-10">No transactions for this account.</Text>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                )}
            </Modal>
        </View>
    )
}