import React, { useState, useEffect, useCallback } from 'react'
import {
    View, Text, ScrollView, TouchableOpacity,
    Modal, TextInput, ActivityIndicator, RefreshControl
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import useCurrency from '../../hooks/useCurrency'
import { supabase } from '@/lib/supabase'
import { Toast } from '@/components/CustomToast'

const emerald600 = '#059669'
const emerald700 = '#047857'

interface SavingsGoal {
    id: string;
    goal_name: string;
    target_amount: number;
    current_amount: number;
    target_date: string;
    status: string;
    icon?: string;
    color?: string;
}

const currencySymbols: { [key: string]: string } = {
    GHS: 'GH₵',
    NGN: '₦',
    USD: '$',
}

const defaultIcons = [
    { icon: 'monitor', color: '#6366f1', bg: '#e0e7ff' },
    { icon: 'sun', color: '#f59e0b', bg: '#fef3c7' },
    { icon: 'shield', color: '#34d399', bg: '#d1fae5' },
    { icon: 'map-pin', color: '#f472b6', bg: '#fce7f3' },
    { icon: 'home', color: '#8b5cf6', bg: '#ede9fe' },
    { icon: 'heart', color: '#ef4444', bg: '#fee2e2' },
    { icon: 'star', color: '#fbbf24', bg: '#fff7ed' },
    { icon: 'briefcase', color: '#10b981', bg: '#ecfdf5' },
];

// ── Create Goal Modal ─────────────────────────────────────
const CreateGoalModal = ({ visible, onClose, currencySymbol, onCreated }: { visible: boolean; onClose: () => void, currencySymbol: string, onCreated: () => void }) => {
    const [title, setTitle] = useState('')
    const [target, setTarget] = useState('')
    const [deadline, setDeadline] = useState('')
    const [loading, setLoading] = useState(false)
    const [selectedIconIdx, setSelectedIconIdx] = useState(0)

    const handleCreate = async () => {
        if (!title || !target) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            const { error } = await supabase
                .from('savings_goals')
                .insert({
                    user_id: user.id,
                    goal_name: title,
                    target_amount: parseFloat(target),
                    target_date: deadline || null,
                    status: 'in_progress'
                });

            if (error) throw error;
            Toast.show({ type: 'success', text1: 'Success', text2: 'Savings goal created!' });
            onCreated();
            onClose();
            setTitle(''); setTarget(''); setDeadline('');
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
                    <Text className="text-base font-semibold text-gray-900">New Savings Goal</Text>
                    <TouchableOpacity onPress={handleCreate} disabled={loading}>
                        {loading ? <ActivityIndicator size="small" color={emerald600} /> : <Text style={{ color: emerald600 }} className="text-sm font-semibold">Create</Text>}
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-5 pt-6">
                    <Text className="mb-3 text-xs font-semibold text-gray-500 uppercase">Choose Icon Style</Text>
                    <View className="flex-row flex-wrap gap-3 mb-6">
                        {defaultIcons.map((item, idx) => (
                            <TouchableOpacity
                                key={idx}
                                onPress={() => setSelectedIconIdx(idx)}
                                className="items-center justify-center w-12 h-12 rounded-xl"
                                style={{ backgroundColor: selectedIconIdx === idx ? item.bg : '#f3f4f6', borderWidth: selectedIconIdx === idx ? 1.5 : 0, borderColor: item.color }}
                            >
                                <Feather name={item.icon as any} size={20} color={selectedIconIdx === idx ? item.color : '#9ca3af'} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {[
                        { label: 'Goal Name', value: title, setter: setTitle, placeholder: 'e.g. New Laptop', keyboard: 'default' },
                        { label: `Target Amount (${currencySymbol})`, value: target, setter: setTarget, placeholder: 'e.g. 2000', keyboard: 'decimal-pad' },
                        { label: 'Target Date (YYYY-MM-DD)', value: deadline, setter: setDeadline, placeholder: 'e.g. 2026-12-31', keyboard: 'default' },
                    ].map(field => (
                        <View key={field.label} className="mb-4">
                            <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">{field.label}</Text>
                            <View className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                                <TextInput
                                    value={field.value}
                                    onChangeText={field.setter}
                                    placeholder={field.placeholder}
                                    keyboardType={field.keyboard as any}
                                    placeholderTextColor="#9ca3af"
                                    className="text-sm text-gray-800"
                                />
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity
                        className={`items-center py-4 mt-2 rounded-xl ${title && target && !loading ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'} `}
                        onPress={handleCreate}
                        disabled={!title || !target || loading}
                    >
                        <Text className="text-base font-bold text-white">{loading ? 'Creating...' : 'Create Goal'}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
    )
}

// ── Top Up Modal ────────────────────────────────────────── 
const TopUpModal = ({ visible, onClose, goal, currencySymbol, onUpdated }: {
    visible: boolean; onClose: () => void; goal: SavingsGoal | null, currencySymbol: string, onUpdated: () => void
}) => {
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const quickAmounts = ['50', '100', '200', '500'] 

    const handleTopUp = async () => {
        if (!goal || !amount) return;
        setLoading(true);
        try {
            const newAmount = Number(goal.current_amount) + parseFloat(amount);
            const { error } = await supabase
                .from('savings_goals')
                .update({ current_amount: newAmount })
                .eq('id', goal.id);

            if (error) throw error;
            
            Toast.show({ type: 'success', text1: 'Success', text2: `Added ${currencySymbol}${amount} to ${goal.goal_name}` });
            onUpdated();
            onClose();
            setAmount('');
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
            <View className="justify-end flex-1 bg-black/40">
                <View className="px-5 pt-5 pb-10 bg-white rounded-t-3xl">
                    <View className="flex-row items-center justify-between mb-5">
                        <Text className="text-lg font-bold text-gray-900">Top Up — {goal?.goal_name}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>

                    {goal && (
                        <View style={{ backgroundColor: '#ecfdf5' }} className="px-4 py-3 mb-5 rounded-2xl">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-sm font-medium text-emerald-700">Saved so far</Text>
                                <Text className="text-sm font-bold text-emerald-700">{currencySymbol}{Number(goal.current_amount).toLocaleString()} / {currencySymbol}{Number(goal.target_amount).toLocaleString()}</Text>
                            </View>
                            <View className="h-2 overflow-hidden bg-white rounded-full">
                                <View
                                    style={{ width: `${Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100)}%`, backgroundColor: emerald600 }}
                                    className="h-full rounded-full"
                                />
                            </View>
                        </View>
                    )}

                    <View className="flex-row items-center px-4 py-3 mb-4 border border-gray-200 rounded-xl bg-gray-50">
                        <Text className="mr-2 text-lg text-gray-400">{currencySymbol}</Text>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                            placeholder="Enter amount"
                            placeholderTextColor="#9ca3af"
                            className="flex-1 text-base text-gray-800"
                        />
                    </View>

                    <View className="flex-row gap-2 mb-6">
                        {quickAmounts.map(q => (
                            <TouchableOpacity
                                key={q}
                                onPress={() => setAmount(q)}
                                className="items-center flex-1 py-2 border rounded-xl"
                                style={{
                                    backgroundColor: amount === q ? '#ecfdf5' : '#f9fafb',
                                    borderColor: amount === q ? emerald600 : '#e5e7eb',
                                }}
                            >
                                <Text className="text-sm font-medium" style={{ color: amount === q ? emerald600 : '#6b7280' }}>
                                    {currencySymbol}{q}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        className={`items-center py-4 mt-2 rounded-xl ${amount && !loading ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'} `}
                        onPress={handleTopUp}
                        disabled={!amount || loading}
                    >
                        <Text className="text-base font-bold text-white">{loading ? 'Processing...' : 'Add to Savings'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

const GoalCard = ({ goal, onTopUp, currencySymbol, styleIdx }: { goal: SavingsGoal; onTopUp: () => void, currencySymbol: string, styleIdx: number }) => {
    const style = defaultIcons[styleIdx % defaultIcons.length];
    const progress = Number(goal.current_amount) / Number(goal.target_amount);
    const isComplete = progress >= 1
    const remaining = Number(goal.target_amount) - Number(goal.current_amount);

    return (
        <View className="p-4 mb-3 bg-white rounded-lg shadow-sm">
            <View className="flex-row items-start mb-3">
                <View style={{ backgroundColor: style.bg }} className="items-center justify-center w-12 h-12 mr-3 rounded-2xl">
                    <Feather name={(goal.icon || style.icon) as any} size={22} color={goal.color || style.color} />
                </View>
                <View className="flex-1">
                    <View className="flex-row items-start justify-between">
                        <Text className="text-base font-bold text-gray-900">{goal.goal_name}</Text>
                        {isComplete ? (
                            <View style={{ backgroundColor: '#d1fae5' }} className="px-2 py-0.5 rounded-full flex-row items-center gap-1">
                                <Feather name="check-circle" size={11} color={emerald600} />
                                <Text style={{ color: emerald600 }} className="text-xs font-semibold">Done</Text>
                            </View>
                        ) : (
                            <Text className="text-xs text-gray-400">{goal.target_date || 'Ongoing'}</Text>
                        )}
                    </View>
                    <Text className="text-gray-400 text-xs mt-0.5">
                        {currencySymbol}{Number(goal.current_amount).toLocaleString()} saved of {currencySymbol}{Number(goal.target_amount).toLocaleString()}
                    </Text>
                </View>
            </View>

            <View className="h-2 mb-2 overflow-hidden bg-gray-100 rounded-full">
                <View
                    style={{
                        width: `${Math.min(progress * 100, 100)}%`,
                        backgroundColor: isComplete ? emerald600 : (goal.color || style.color),
                    }}
                    className="h-full rounded-full"
                />
            </View>

            <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-400">
                    {isComplete ? '🎉 Goal reached!' : `${currencySymbol}${remaining.toLocaleString()} left to go`}
                </Text>
                <Text className="text-xs font-bold" style={{ color: goal.color || style.color }}>
                    {(progress * 100).toFixed(0)}%
                </Text>
            </View>

            {!isComplete && (
                <TouchableOpacity
                    onPress={onTopUp}
                    style={{ backgroundColor: style.bg, borderColor: style.color }}
                    className="mt-3 py-2.5 rounded-xl items-center border"
                >
                    <Text className="text-sm font-semibold" style={{ color: style.color }}>+ Add Money</Text>
                </TouchableOpacity>
            )}
        </View>
    )
}

export default function SavingsScreen() {
    const [goals, setGoals] = useState<SavingsGoal[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [topUpGoal, setTopUpGoal] = useState<SavingsGoal | null>(null)
    const currency = useCurrency()
    const currencySymbol = currencySymbols[currency] 

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('savings_goals')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGoals(data || []);
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

    const totalSaved = goals.reduce((s, g) => s + Number(g.current_amount), 0)
    const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0)
    const completedGoals = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length

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
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-2xl font-bold text-white">Savings Goals</Text>
                            <Text className="text-emerald-200 text-sm mt-0.5">Build your financial future</Text>
                        </View>
                    </View>
                </View>

                <View className="px-5 py-5 mx-5 mb-4 -mt-10 bg-white rounded-xl elevation-sm">
                    <View className="flex-row justify-between mb-4">
                        <View>
                            <Text className="text-xs text-gray-400">Total Saved</Text>
                            <Text className="text-2xl font-bold text-gray-900">{currencySymbol}{totalSaved.toLocaleString()}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-xs text-gray-400">Total Target</Text>
                            <Text className="text-2xl font-bold text-gray-900">{currencySymbol}{totalTarget.toLocaleString()}</Text>
                        </View>
                    </View>

                    <View className="h-3 mb-2 overflow-hidden bg-gray-100 rounded-full">
                        <View
                            style={{ width: `${totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0}%`, backgroundColor: emerald600 }}
                            className="h-full rounded-full"
                        />
                    </View>
                    <Text className="text-xs text-gray-400">
                        {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}% of total target
                    </Text>

                    <View className="flex-row pt-4 mt-4 border-t border-gray-100">
                        {[
                            { label: 'Active Goals', value: goals.length - completedGoals },
                            { label: 'Completed', value: completedGoals },
                            { label: 'Remaining', value: `${currencySymbol}${(totalTarget - totalSaved).toLocaleString()}` },
                        ].map((stat, i) => (
                            <View key={stat.label} className={`flex-1 items-center ${i > 0 ? 'border-l border-gray-100' : ''}`}>
                                <Text className="text-lg font-bold text-gray-900">{stat.value}</Text>
                                <Text className="text-xs text-gray-400">{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View className="px-5 mb-4">
                    <Text className="mb-3 text-base font-semibold text-gray-800">Your Goals</Text>
                    {goals.length === 0 ? (
                        <View className="p-10 items-center">
                            <Text className="text-gray-400">No savings goals yet.</Text>
                        </View>
                    ) : (
                        goals.map((goal, idx) => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                styleIdx={idx}
                                onTopUp={() => setTopUpGoal(goal)}
                                currencySymbol={currencySymbol}
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            <TouchableOpacity
                onPress={() => setShowCreate(true)}
                style={{ backgroundColor: emerald600 }}
                className="absolute items-center justify-center rounded-full bottom-28 right-5 w-14 h-14"
                {...{ elevation: 6 }}
            >
                <Feather name="plus" size={24} color="white" />
            </TouchableOpacity>

            <CreateGoalModal 
                visible={showCreate} 
                onClose={() => setShowCreate(false)} 
                currencySymbol={currencySymbol} 
                onCreated={fetchData}
            />
            <TopUpModal 
                visible={topUpGoal !== null} 
                onClose={() => setTopUpGoal(null)} 
                goal={topUpGoal} 
                currencySymbol={currencySymbol} 
                onUpdated={fetchData}
            />
        </View>
    )
}