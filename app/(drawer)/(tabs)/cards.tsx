import React, { useState, useEffect, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View, Text, ScrollView, TouchableOpacity,
    Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import useCurrency from '@/hooks/useCurrency'
import { OtpInput } from 'react-native-otp-entry';
import { supabase } from '@/lib/supabase'
import { Toast } from '@/components/CustomToast'

const emerald600 = '#059669'
const emerald50 = '#ecfdf5'

// ─── Types ───────────────────────────────────────────────
type Screen = 'list' | 'detail' | 'info' | 'fund' | 'withdraw' | 'newCard' | 'changePin' | 'txPin'

interface Card {
    id: string
    card_holder_name: string
    last_four: string
    balance?: string
    expiry_date: string
    card_type: 'virtual' | 'physical'
    provider: 'visa' | 'mastercard'
    status: string
    account_id: string
}

const gradients = [
    ['#1a1a2e', '#0f3460'],
    ['#134e5e', '#71b280'],
    ['#373b44', '#4286f4'],
    ['#4a0000', '#8b0000'],
    ['#0f2027', '#2c5364'],
];

const currencySymbols: { [key: string]: string } = {
    GHS: 'GH₵',
    NGN: '₦',
    USD: '$',
}

// ─── Card Chip ────────────────────────────────────────────
const CardChip = () => (
    <View style={{ width: 40, height: 30, borderRadius: 5, backgroundColor: '#d4a843', overflow: 'hidden', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', top: 9, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} />
        <View style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,0,0,0.25)' }} />
        <View style={{ position: 'absolute', left: 13, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} />
        <View style={{ position: 'absolute', left: 26, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} />
    </View>
)

const MastercardLogo = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#eb001b', marginRight: -9, opacity: 0.95 }} />
        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#f79e1b', opacity: 0.9 }} />
    </View>
)

const VisaLogo = () => (
    <Text style={{ color: 'white', fontStyle: 'italic', fontWeight: '900', fontSize: 20, letterSpacing: 1, opacity: 0.95 }}>
        VISA
    </Text>
)

const CardItem = ({ card, onPress, symbol, index }: { card: Card; onPress: () => void; symbol: string; index: number }) => (
    <TouchableOpacity onPress={onPress} className="mb-4 rounded-xl h-[200px] overflow-hidden" activeOpacity={0.92}>
        <LinearGradient
            colors={gradients[index % gradients.length] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 1 }}>RINGPAY</Text>
                    <Text style={{ color: 'white', fontSize: 13, fontWeight: '600', marginTop: 2 }}>{card.card_type.toUpperCase()} CARD</Text>
                </View>
                {card.provider === 'mastercard' ? <MastercardLogo /> : <VisaLogo />}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <CardChip />
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, letterSpacing: 3, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                    ●●●●  ●●●●  ●●●●  {card.last_four}
                </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <View>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Card Holder</Text>
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>{card.card_holder_name}</Text>
                </View>
                <View>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Expires</Text>
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>{card.expiry_date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Status</Text>
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 13, textTransform: 'capitalize' }}>{card.status}</Text>
                </View>
            </View>
        </LinearGradient>
    </TouchableOpacity>
)

const InputField = ({ label, placeholder, value, onChangeText, keyboardType = 'default', secureTextEntry = false }: any) => (
    <View className="mb-4">
        {label && <Text className="text-gray-700 font-medium text-sm mb-1.5">{label}</Text>}
        <View className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
            <TextInput
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                className="text-sm text-gray-800"
                placeholderTextColor="#9ca3af"
            />
        </View>
    </View>
)

const BackHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <View className="flex-row items-center px-5 pb-4 ">
        <TouchableOpacity onPress={onBack} className="mr-4">
            <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
    </View>
)

export default function CardsScreen() {
    const currency = useCurrency()
    const symbol = currencySymbols[currency]

    const [screen, setScreen] = useState<Screen>('list')
    const [cards, setCards] = useState<Card[]>([])
    const [accounts, setAccounts] = useState<any[]>([])
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [selectedCard, setSelectedCard] = useState<Card | null>(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [txPinAction, setTxPinAction] = useState<'fund' | 'withdraw' | null>(null)
    const [txPinLoading, setTxPinLoading] = useState(false)

    // Form state
    const [fundAmount, setFundAmount] = useState('')
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [newCardName, setNewCardName] = useState('')
    const [selectedAccountId, setSelectedAccountId] = useState('')
    const [selectedProvider, setSelectedProvider] = useState<'visa' | 'mastercard'>('visa')
    const [pin, setPin] = useState('')
    const [txPin, setTxPin] = useState('')
    const [creatingCard, setCreatingCard] = useState(false)

    const fetchData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Cards
            const { data: cardsData, error: cardsError } = await supabase
                .from('cards')
                .select('*')
                .eq('user_id', user.id);

            if (cardsError) throw cardsError;
            setCards(cardsData || []);

            // Fetch Accounts for card creation
            const { data: accData } = await supabase
                .from('accounts')
                .select('*')
                .eq('user_id', user.id);
            setAccounts(accData || []);
            if (accData && accData.length > 0) setSelectedAccountId(accData[0].id);

            // Fetch Transactions
            const { data: transData, error: transError } = await supabase
                .from('transactions')
                .select('*, category:categories(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (transError) throw transError;
            setTransactions(transData || []);

        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Fetch Error', text2: error.message });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateCard = async () => {
        if (!newCardName || !selectedAccountId) {
            Toast.show({ type: 'warning', text1: 'Missing Info', text2: 'Please enter a name and select an account.' });
            return;
        }
        setCreatingCard(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const lastFour = Math.floor(1000 + Math.random() * 9000).toString();
            const expiry = `0${Math.floor(Math.random() * 9) + 1}/2${Math.floor(Math.random() * 5) + 6}`;

            const { error } = await supabase
                .from('cards')
                .insert({
                    user_id: user.id,
                    account_id: selectedAccountId,
                    card_holder_name: newCardName,
                    last_four: lastFour,
                    expiry_date: expiry,
                    card_type: 'virtual',
                    provider: selectedProvider,
                    status: 'active'
                });

            if (error) throw error;

            Toast.show({ type: 'success', text1: 'Success', text2: 'Virtual card created!' });
            setScreen('list');
            setNewCardName('');
            fetchData();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message });
        } finally {
            setCreatingCard(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const goBack = () => {
        if (screen === 'detail') setScreen('list')
        else if (screen === 'info') setScreen('detail')
        else if (screen === 'fund') setScreen('detail')
        else if (screen === 'withdraw') setScreen('detail')
        else if (screen === 'newCard') setScreen('list')
        else if (screen === 'changePin') setScreen('detail')
        else if (screen === 'txPin') {
            setScreen(txPinAction === 'fund' ? 'fund' : 'withdraw')
            setTxPinAction(null)
        }
        else setScreen('list')
    }

    const handleTxPinConfirm = () => {
        setTxPinLoading(true)
        setTimeout(() => {
            setTxPinLoading(false)
            setScreen('detail')
            setTxPinAction(null)
            Alert.alert('Success', txPinAction === 'fund' ? 'Card funded successfully!' : 'Withdrawal successful!')
        }, 2000)
    }

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color={emerald600} />
            </View>
        );
    }

    // ── All Cards List ────────────────────────────────────
    if (screen === 'list') return (
        <View className="flex-1 bg-white">
            <View className="flex-row items-start justify-between px-5 pt-5 pb-3">
                <View>
                    <Text className="text-2xl font-bold text-gray-900">All Cards</Text>
                    <Text className="text-gray-400 text-sm mt-0.5">Manage all your virtual cards</Text>
                </View>
            </View>

            <ScrollView 
                className="flex-1 px-5" 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {cards.length === 0 ? (
                    <View className="items-center justify-center py-20">
                        <Text className="text-gray-400">No cards found. Create one to get started!</Text>
                    </View>
                ) : (
                    cards.map((card, i) => (
                        <CardItem 
                            key={card.id} 
                            card={card} 
                            symbol={symbol} 
                            index={i}
                            onPress={() => { setSelectedCard(card); setScreen('detail') }} 
                        />
                    ))
                )}
            </ScrollView>
            <View className='absolute pb-4 shadow-md bottom-24 right-5'>
                <TouchableOpacity
                    onPress={() => setScreen('newCard')}
                    style={{ backgroundColor: emerald600 }}
                    className="flex-row items-center gap-2 px-5 py-3.5 rounded-full"
                >
                    <Feather name="plus" size={18} color="white" />
                    <Text className="font-semibold text-white">New Card</Text>
                </TouchableOpacity>
            </View>
        </View>
    )

    // ── Card Detail ───────────────────────────────────────
    if (screen === 'detail' && selectedCard) return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <BackHeader title={selectedCard.card_holder_name} onBack={goBack} />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="px-5 pt-5">
                    <View className="mb-6 rounded-xl h-[200px] overflow-hidden">
                        <LinearGradient
                            colors={gradients[cards.indexOf(selectedCard) % gradients.length] as [string, string]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View>
                                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 1 }}>RINGPAY</Text>
                                    <Text style={{ color: 'white', fontSize: 13, fontWeight: '600', marginTop: 2 }}>{selectedCard.card_type.toUpperCase()} CARD</Text>
                                </View>
                                {selectedCard.provider === 'mastercard' ? <MastercardLogo /> : <VisaLogo />}
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <CardChip />
                                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, letterSpacing: 3, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                                    ●●●●  ●●●●  ●●●●  {selectedCard.last_four}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                <View>
                                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Card Holder</Text>
                                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>{selectedCard.card_holder_name}</Text>
                                </View>
                                <View>
                                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Expires</Text>
                                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>{selectedCard.expiry_date}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>Status</Text>
                                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 13, textTransform: 'capitalize' }}>{selectedCard.status}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row justify-between mb-6">
                        {[
                            { label: 'Details', icon: 'info', action: () => setScreen('info') },
                            { label: 'Add Fund', icon: 'plus-circle', action: () => setScreen('fund') },
                            { label: 'Freeze', icon: 'lock', action: () => Alert.alert('Card Frozen') },
                            { label: 'More', icon: 'more-horizontal', action: () => { } },
                        ].map((btn) => (
                            <TouchableOpacity key={btn.label} className="items-center" onPress={btn.action}>
                                <View style={{ backgroundColor: emerald50 }} className="items-center justify-center mb-1 w-14 h-14 rounded-2xl">
                                    <Feather name={btn.icon as any} size={20} color={emerald600} />
                                </View>
                                <Text className="text-xs font-medium text-gray-600">{btn.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Extra Actions */}
                    <View className="flex-row gap-3 mb-6">
                        <TouchableOpacity onPress={() => setScreen('withdraw')} className="items-center flex-1 py-3 border border-gray-200 rounded-xl">
                            <Text className="text-sm font-medium text-gray-700">Withdraw</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setScreen('changePin')} className="items-center flex-1 py-3 border border-gray-200 rounded-xl">
                            <Text className="text-sm font-medium text-gray-700">Change Pin</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowDeleteModal(true)} className="items-center flex-1 py-3 border border-red-100 bg-red-50 rounded-xl">
                            <Text className="text-sm font-medium text-red-500">Delete</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Transactions */}
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-base font-semibold text-gray-900">Recent Transactions</Text>
                        <Feather name="calendar" size={18} color="#6b7280" />
                    </View>
                    <View className="gap-y-2">
                        {transactions.map((item, index) => (
                            <View key={item.id} className="flex-row items-center p-4 bg-white rounded-2xl shadow-sm">
                                <View 
                                    style={{ backgroundColor: item.category?.bg || '#fee2e2' }} 
                                    className="items-center justify-center w-10 h-10 mr-3 rounded-full"
                                >
                                    <Feather name={(item.category?.icon as any) || 'activity'} size={16} color={item.category?.color || '#ef4444'} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-400 text-xs mb-0.5">{new Date(item.created_at).toLocaleDateString()}</Text>
                                    <Text className="text-sm font-semibold text-gray-800">{item.merchant_name || item.category?.name || 'Transaction'}</Text>
                                </View>
                                <Text style={{ color: item.type === 'expense' ? '#ef4444' : emerald600 }} className="text-sm font-bold">
                                    {item.type === 'expense' ? '-' : '+'}{symbol}{Number(item.amount).toLocaleString()}
                                </Text>
                            </View>
                        ))}
                        {transactions.length === 0 && (
                            <Text className="text-center text-gray-400 py-10">No transactions found.</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            <Modal visible={showDeleteModal} transparent animationType="fade">
                <View className="items-center justify-center flex-1 px-8 bg-black/40">
                    <View className="w-full p-6 bg-white rounded-2xl">
                        <Text className="mb-2 text-lg font-bold text-gray-900">Confirm Delete</Text>
                        <Text className="mb-6 text-sm text-gray-500">Are you sure you want to delete card?</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity onPress={() => setShowDeleteModal(false)} className="items-center flex-1 py-3 border border-gray-200 rounded-xl">
                                <Text className="font-semibold text-gray-700">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setShowDeleteModal(false); setScreen('list') }} style={{ backgroundColor: emerald600 }} className="items-center flex-1 py-3 rounded-xl">
                                <Text className="font-semibold text-white">Yes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )


    // ── Card Info ─────────────────────────────────────────
    if (screen === 'info') return (
        <SafeAreaView className="flex-1 bg-white">
            <BackHeader title="Card Details" onBack={goBack} />
            <ScrollView className="flex-1 px-5 pt-5" contentContainerStyle={{ paddingBottom: 40 }}>
                {[
                    { label: 'Card Holder', value: selectedCard?.card_holder_name ?? 'N/A' },
                    { label: 'Number', value: `●●●● ●●●● ●●●● ${selectedCard?.last_four}` },
                    { label: 'Expiry', value: selectedCard?.expiry_date ?? 'N/A' },
                    { label: 'Provider', value: selectedCard?.provider.toUpperCase() ?? 'N/A' },
                    { label: 'Type', value: selectedCard?.card_type.toUpperCase() ?? 'N/A' },
                    { label: 'Status', value: selectedCard?.status.toUpperCase() ?? 'N/A' },
                ].map((item) => (
                    <View key={item.label} className="flex-row items-center justify-between py-4 border-b border-gray-100">
                        <View>
                            <Text className="mb-1 text-xs text-gray-400">{item.label}</Text>
                            <Text className="text-sm font-semibold text-gray-900">{item.value}</Text>
                        </View>
                        <TouchableOpacity>
                            <Feather name="copy" size={16} color={emerald600} />
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    )

    // ── Fund Card ─────────────────────────────────────────
    if (screen === 'fund') return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <BackHeader title="Fund Card" onBack={goBack} />
                <View className="flex-1 px-5 pt-6">
                    <Text className="mb-1 text-sm text-gray-500">Amount</Text>
                    <View className="flex-row items-center px-4 py-3 mb-8 border border-gray-200 rounded-xl bg-gray-50">
                        <Text className="mr-2 text-gray-400">{symbol}</Text>
                        <TextInput placeholder="0.00" value={fundAmount} onChangeText={setFundAmount} keyboardType="decimal-pad" placeholderTextColor="#9ca3af" className="flex-1 text-sm text-gray-800" />
                    </View>
                    <TouchableOpacity
                        className={`items-center py-4 rounded-xl  ${fundAmount ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'}`}
                        onPress={() => {
                            setTxPinAction('fund');
                            setScreen('txPin')
                        }}
                        disabled={!fundAmount}
                    >
                        <Text className="text-base font-semibold text-white">Continue</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )

    // ── Withdraw Fund ─────────────────────────────────────
    if (screen === 'withdraw') return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <BackHeader title="Withdraw Fund" onBack={goBack} />
                <View className="flex-1 px-5 pt-6">
                    <Text className="mb-1 text-sm text-gray-500">Amount</Text>
                    <View className="flex-row items-center px-4 py-3 mb-8 border border-gray-200 rounded-xl bg-gray-50">
                        <Text className="mr-2 text-gray-400">{symbol}</Text>
                        <TextInput placeholder="0.00" value={withdrawAmount} onChangeText={setWithdrawAmount} keyboardType="decimal-pad" placeholderTextColor="#9ca3af" className="flex-1 text-sm text-gray-800" />
                    </View>
                    <TouchableOpacity
                        className={`items-center py-4 rounded-xl  ${withdrawAmount ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'}`}
                        onPress={() => { setTxPinAction('withdraw'); setScreen('txPin') }}
                        disabled={!withdrawAmount}
                    >
                        <Text className="text-base font-semibold text-white">Continue</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )

    // ── New Card ──────────────────────────────────────────
    if (screen === 'newCard') return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <BackHeader title="New Card" onBack={goBack} />
                <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text className="mb-4 text-sm text-gray-500">You will be charged {symbol}4 to create a new card</Text>
                    <InputField label="Name on card" placeholder="eg your name" value={newCardName} onChangeText={setNewCardName} />
                    
                    <Text className="text-gray-700 font-medium text-sm mb-1.5">Provider</Text>
                    <View className="flex-row gap-3 mb-4">
                        {['visa', 'mastercard'].map(p => (
                            <TouchableOpacity
                                key={p}
                                onPress={() => setSelectedProvider(p as any)}
                                className="flex-1 py-3 border rounded-xl items-center"
                                style={{
                                    backgroundColor: selectedProvider === p ? '#ecfdf5' : '#f9fafb',
                                    borderColor: selectedProvider === p ? emerald600 : '#e5e7eb',
                                }}
                            >
                                <Text className="text-sm font-bold text-gray-800" style={{ textTransform: 'capitalize' }}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View className="mb-8">
                        <Text className="text-gray-700 font-medium text-sm mb-1.5">Select Account</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                            {accounts.map(acc => (
                                <TouchableOpacity
                                    key={acc.id}
                                    onPress={() => setSelectedAccountId(acc.id)}
                                    className="px-4 py-2 border rounded-full mr-2"
                                    style={{
                                        backgroundColor: selectedAccountId === acc.id ? '#ecfdf5' : '#f9fafb',
                                        borderColor: selectedAccountId === acc.id ? emerald600 : '#e5e7eb',
                                    }}
                                >
                                    <Text className="text-xs font-medium" style={{ color: selectedAccountId === acc.id ? emerald600 : '#6b7280' }}>
                                        {acc.account_name} ({symbol}{Number(acc.balance).toLocaleString()})
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <TouchableOpacity
                        className={`items-center py-4 rounded-xl ${newCardName && selectedAccountId && !creatingCard ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'}`}
                        onPress={handleCreateCard}
                        disabled={!newCardName || !selectedAccountId || creatingCard}
                    >
                        {creatingCard ? <ActivityIndicator color="white" /> : <Text className="text-base font-semibold text-white">Create Card</Text>}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )

    // ── Change Card Pin ───────────────────────────────────
    if (screen === 'changePin') return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <BackHeader title="" onBack={goBack} />
                <ScrollView 
                    className="flex-1" 
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-1 px-5 pt-8">
                        <Text className="mb-1 text-2xl font-bold text-gray-900">Change Card Pin</Text>
                        <Text className="mb-8 text-sm text-gray-400">Set a new pin for your virtual card</Text>
                        <View className='flex my-5'>
                            <OtpInput numberOfDigits={4} onTextChange={setPin} focusColor="#059669" secureTextEntry theme={{
                                containerStyle: { paddingHorizontal: 30 }
                            }} />
                        </View>
                        <TouchableOpacity
                            className={`items-center py-4 rounded-xl mt-auto mb-6 ${pin.length === 4 ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'}`}
                            onPress={() => setScreen('detail')}
                            disabled={!pin}
                        >
                            <Text className="text-base font-semibold text-white">Set Pin</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )

    // ── Transaction Pin ───────────────────────────────────
    if (screen === 'txPin') return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <BackHeader title="" onBack={goBack} />
                <ScrollView 
                    className="flex-1" 
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-1 px-5 pt-8">
                        <Text className="mb-1 text-2xl font-bold text-gray-900">Transaction Pin</Text>
                        <Text className="mb-8 text-sm text-gray-400">Enter your transaction pin</Text>
                        <View className="mb-8">
                            <OtpInput numberOfDigits={4} onTextChange={setTxPin} focusColor="#059669" secureTextEntry theme={{
                                containerStyle: { paddingHorizontal: 30 }
                            }} />
                        </View>
                        <TouchableOpacity
                            className={`items-center py-4 rounded-xl mt-auto mb-6 ${txPin.length === 4 ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'}`}
                            onPress={handleTxPinConfirm}
                            disabled={!txPin}
                        >
                            <Text className="text-base font-semibold text-white">
                                {txPinLoading ? 'Processing...' : txPinAction === 'fund' ? 'Fund Card' : 'Withdraw'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )

    return null
}
