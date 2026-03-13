import React, { useState, useEffect, useCallback } from 'react'
import {
    View, Text, ScrollView, TouchableOpacity,
    Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, RefreshControl
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import useCurrency from '../../hooks/useCurrency'
import { SafeAreaView } from 'react-native-safe-area-context';
import { OtpInput } from "react-native-otp-entry";
import PhoneInput from 'react-native-international-phone-number';
import { supabase } from '@/lib/supabase'
import { Toast } from '@/components/CustomToast'

const emerald600 = '#059669'
const emerald700 = '#047857'

// ── Types ─────────────────────────────────────────────────
type Flow = 'home' | 'bank' | 'phone' | 'bills' | 'airtime' | 'confirm' | 'success'

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: string;
    created_at: string;
    merchant_name: string;
}

const banks = ['Access Bank', 'GTBank', 'Wema Bank', 'First Bank', 'UBA', 'Zenith Bank', 'Stanbic IBTC']

const billCategories = [
    { id: '1', label: 'Electricity', icon: 'zap', color: '#f59e0b', bg: '#fef3c7' },
    { id: '2', label: 'Water', icon: 'droplet', color: '#6366f1', bg: '#e0e7ff' },
    { id: '3', label: 'Internet', icon: 'wifi', color: '#34d399', bg: '#d1fae5' },
    { id: '4', label: 'Cable TV', icon: 'tv', color: '#a78bfa', bg: '#ede9fe' },
    { id: '5', label: 'Rent', icon: 'home', color: '#f87171', bg: '#fee2e2' },
    { id: '6', label: 'Insurance', icon: 'shield', color: '#f472b6', bg: '#fce7f3' },
]

const networks = [
    { id: '1', label: 'MTN', color: '#f59e0b', bg: '#fef3c7' },
    { id: '4', label: 'Telecel', color: '#6366f1', bg: '#e0e7ff' },
    { id: '2', label: 'AirtelTigo', color: '#f87171', bg: '#fee2e2' },
    { id: '3', label: 'Glo', color: '#34d399', bg: '#d1fae5' },
]

const airtimeAmounts = ['100', '200', '500', '1000', '2000', '5000']

const currencySymbols: { [key: string]: string } = {
    GHS: 'GH₵',
    NGN: '₦',
    USD: '$',
}

const BackHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <View className="flex-row items-center px-5 pb-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={onBack} className="mr-4">
            <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-900">{title}</Text>
    </View>
)

const InputField = ({ label, placeholder, value, onChangeText, keyboardType = 'default', right }: any) => (
    <View className="mb-4">
        {label && <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">{label}</Text>}
        <View className="flex-row items-center px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
            <TextInput
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                placeholderTextColor="#9ca3af"
                className="flex-1 text-sm text-gray-800"
            />
            {right}
        </View>
    </View>
)

const BankFlow = ({ onBack, onContinue, currencySymbol }: { onBack: () => void; onContinue: (data: any) => void, currencySymbol: string }) => {
    const [accountNumber, setAccountNumber] = useState('')
    const [selectedBank, setSelectedBank] = useState('')
    const [amount, setAmount] = useState('')
    const [narration, setNarration] = useState('')
    const [showBankPicker, setShowBankPicker] = useState(false)
    const isEmpty = accountNumber.trim() !== "" && selectedBank.trim() !== "" && amount.trim() !== ""

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <BackHeader title="Send to Bank Account" onBack={onBack} />
                <ScrollView className="flex-1 px-5 pt-5" contentContainerStyle={{ paddingBottom: 40 }}>
                    <InputField label="Account Number" placeholder="Enter 10-digit account number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" />
                    <View className="mb-4">
                        <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">Bank</Text>
                        <TouchableOpacity
                            onPress={() => setShowBankPicker(true)}
                            className="flex-row items-center justify-between px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                        >
                            <Text className={selectedBank ? 'text-gray-800 text-sm' : 'text-gray-400 text-sm'}>
                                {selectedBank || 'Select bank'}
                            </Text>
                            <Feather name="chevron-down" size={16} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                    <View className="mb-4">
                        <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">Amount</Text>
                        <View className="flex-row items-center px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                            <Text className="mr-2 text-base text-gray-400">{currencySymbol}</Text>
                            <TextInput
                                placeholder="0.00"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="decimal-pad"
                                placeholderTextColor="#9ca3af"
                                className="flex-1 text-sm text-gray-800"
                            />
                        </View>
                    </View>
                    <InputField label="Narration (optional)" placeholder="What's this for?" value={narration} onChangeText={setNarration} />
                    <TouchableOpacity
                        className={`items-center py-4 mt-2 rounded-xl ${isEmpty ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'} `}
                        disabled={!isEmpty}
                        onPress={() => onContinue({ type: 'Bank Transfer', to: `${selectedBank} • ${accountNumber}`, amount, merchant: selectedBank, description: narration })}
                    >
                        <Text className="text-base font-bold text-white">Continue</Text>
                    </TouchableOpacity>
                </ScrollView>
                <Modal visible={showBankPicker} transparent animationType="slide">
                    <View className="justify-end flex-1 bg-black/40">
                        <View className="px-5 pt-5 pb-10 bg-white rounded-t-3xl">
                            <Text className="mb-4 text-lg font-bold text-gray-900">Select Bank</Text>
                            <ScrollView style={{ maxHeight: 320 }}>
                                {banks.map(bank => (
                                    <TouchableOpacity
                                        key={bank}
                                        onPress={() => { setSelectedBank(bank); setShowBankPicker(false) }}
                                        className="flex-row items-center justify-between py-4 border-b border-gray-50"
                                    >
                                        <Text className="text-sm font-medium text-gray-800">{bank}</Text>
                                        {selectedBank === bank && <Feather name="check" size={18} color={emerald600} />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const PhoneFlow = ({ onBack, onContinue, currencySymbol }: { onBack: () => void; onContinue: (data: any) => void, currencySymbol: string }) => {
    const [phone, setPhone] = useState('')
    const [amount, setAmount] = useState('')
    const [selectedCountry, setSelectedCountry] = useState<any>(undefined);
    const [narration, setNarration] = useState('')

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <BackHeader title="Send to Phone Number" onBack={onBack} />
                <ScrollView className="flex-1 px-5 pt-5" contentContainerStyle={{ paddingBottom: 40 }}>
                    <View className="mb-4">
                        <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">Phone Number</Text>
                        <PhoneInput
                            value={phone}
                            onChangePhoneNumber={(number: string) => setPhone(number)}
                            selectedCountry={selectedCountry}
                            onChangeSelectedCountry={(country: any) => setSelectedCountry(country)}
                            defaultCountry='GH'
                            placeholder='Phone number'
                            phoneInputStyles={{
                                container: { width: '100%', borderRadius: 12, backgroundColor: '#f9fafb' },
                                input: { backgroundColor: 'transparent', paddingVertical: 0 }
                            }}
                        />
                    </View>
                    <View className="mb-4">
                        <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">Amount</Text>
                        <View className="flex-row items-center px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                            <Text className="mr-2 text-base text-gray-400">{currencySymbol}</Text>
                            <TextInput
                                placeholder="0.00"
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="decimal-pad"
                                placeholderTextColor="#9ca3af"
                                className="flex-1 text-sm text-gray-800"
                            />
                        </View>
                    </View>
                    <InputField label="Narration (optional)" placeholder="What's this for?" value={narration} onChangeText={setNarration} />
                    <TouchableOpacity
                        className={`items-center py-4 mt-2 rounded-xl ${phone && amount ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'} `}
                        disabled={!phone || !amount}
                        onPress={() => onContinue({ type: 'Phone Transfer', to: phone, amount, merchant: 'RingPay User', description: narration })}
                    >
                        <Text className="text-base font-bold text-white">Continue</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const BillsFlow = ({ onBack, onContinue, currencySymbol }: { onBack: () => void; onContinue: (data: any) => void, currencySymbol: string }) => {
    const [selectedBill, setSelectedBill] = useState<typeof billCategories[0] | null>(null)
    const [meterNumber, setMeterNumber] = useState('')
    const [amount, setAmount] = useState('')

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <BackHeader title="Pay Bills" onBack={onBack} />
                <ScrollView className="flex-1 px-5 pt-5" contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text className="mb-3 text-xs font-semibold text-gray-500 uppercase">Select Category</Text>
                    <View className="flex-row flex-wrap gap-3 mb-6">
                        {billCategories.map(bill => (
                            <TouchableOpacity
                                key={bill.id}
                                onPress={() => setSelectedBill(bill)}
                                className="items-center py-4 border rounded-2xl"
                                style={{
                                    width: '30%',
                                    backgroundColor: selectedBill?.id === bill.id ? bill.bg : '#f9fafb',
                                    borderColor: selectedBill?.id === bill.id ? bill.color : '#e5e7eb',
                                }}
                            >
                                <View style={{ backgroundColor: bill.bg }} className="items-center justify-center w-10 h-10 mb-2 rounded-full">
                                    <Feather name={bill.icon as any} size={18} color={bill.color} />
                                </View>
                                <Text className="text-xs font-medium text-gray-700">{bill.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {selectedBill && (
                        <>
                            <InputField label={`${selectedBill.label} Account / Meter Number`} placeholder="Enter number" value={meterNumber} onChangeText={setMeterNumber} keyboardType="number-pad" />
                            <View className="mb-6">
                                <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">Amount</Text>
                                <View className="flex-row items-center px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                                    <Text className="mr-2 text-base text-gray-400">{currencySymbol}</Text>
                                    <TextInput placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholderTextColor="#9ca3af" className="flex-1 text-sm text-gray-800" />
                                </View>
                            </View>
                            <TouchableOpacity
                                className={`items-center py-4 mt-2 rounded-xl ${meterNumber && amount ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'} `}
                                disabled={!meterNumber || !amount}
                                onPress={() => onContinue({ type: 'Bill Payment', to: meterNumber, amount, merchant: selectedBill.label, description: `Bill Payment: ${selectedBill.label}` })}
                            >
                                <Text className="text-base font-bold text-white">Continue</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const AirtimeFlow = ({ onBack, onContinue, currencySymbol }: { onBack: () => void; onContinue: (data: any) => void, currencySymbol: string }) => {
    const [selectedNetwork, setSelectedNetwork] = useState<typeof networks[0] | null>(null)
    const [phone, setPhone] = useState('')
    const [amount, setAmount] = useState('')
    const [isData, setIsData] = useState(false)
    const [selectedCountry, setSelectedCountry] = useState<any>(undefined);

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <BackHeader title="Airtime & Data" onBack={onBack} />
                <ScrollView className="flex-1 px-5 pt-5" contentContainerStyle={{ paddingBottom: 40 }}>
                    <View className="flex-row p-1 mb-5 bg-gray-100 rounded-2xl">
                        {['Airtime', 'Data'].map(type => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => setIsData(type === 'Data')}
                                className="flex-1 py-2.5 rounded-xl items-center"
                                style={{ backgroundColor: (isData ? type === 'Data' : type === 'Airtime') ? 'white' : 'transparent' }}
                            >
                                <Text className="text-sm font-semibold" style={{ color: (isData ? type === 'Data' : type === 'Airtime') ? emerald700 : '#9ca3af' }}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text className="mb-3 text-xs font-semibold text-gray-500 uppercase">Select Network</Text>
                    <View className="flex-row gap-3 mb-5">
                        {networks.map(net => (
                            <TouchableOpacity
                                key={net.id}
                                onPress={() => setSelectedNetwork(net)}
                                className="items-center flex-1 py-3 border rounded-lg"
                                style={{ backgroundColor: selectedNetwork?.id === net.id ? net.bg : '#f9fafb', borderColor: selectedNetwork?.id === net.id ? net.color : '#e5e7eb' }}
                            >
                                <Text className="text-sm font-bold" style={{ color: selectedNetwork?.id === net.id ? net.color : '#6b7280' }}>{net.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View className="mb-4">
                        <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">Phone Number</Text>
                        <PhoneInput
                            value={phone}
                            onChangePhoneNumber={(number: string) => setPhone(number)}
                            selectedCountry={selectedCountry}
                            onChangeSelectedCountry={(country: any) => setSelectedCountry(country)}
                            defaultCountry='GH'
                            placeholder='Phone number'
                            phoneInputStyles={{
                                container: { width: '100%', borderRadius: 12, backgroundColor: '#f9fafb' },
                                input: { backgroundColor: 'transparent', paddingVertical: 0 }
                            }}
                        />
                    </View>
                    {!isData ? (
                        <>
                            <Text className="mb-3 text-xs font-semibold text-gray-500 uppercase">Quick Amount</Text>
                            <View className="flex-row flex-wrap gap-2 mb-5">
                                {airtimeAmounts.map(amnt => (
                                    <TouchableOpacity
                                        key={amnt}
                                        onPress={() => setAmount(amnt)}
                                        className="px-4 py-2.5 rounded-xl border"
                                        style={{ backgroundColor: amount === amnt ? '#ecfdf5' : '#f9fafb', borderColor: amount === amnt ? emerald600 : '#e5e7eb' }}
                                    >
                                        <Text className="text-sm font-medium" style={{ color: amount === amnt ? emerald600 : '#6b7280' }}>{currencySymbol}{amnt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    ) : (
                        <View className="mb-6">
                            <Text className="mb-3 text-xs font-semibold text-gray-500 uppercase">Select Data Bundle</Text>
                            {[`500MB - ${currencySymbol}1.50`, `1GB - ${currencySymbol}3.00`, `2GB - ${currencySymbol}6.00`].map(bundle => (
                                <TouchableOpacity key={bundle} onPress={() => setAmount(bundle.split(currencySymbol)[1])} className="flex-row items-center justify-between py-4 border-b border-gray-50">
                                    <Text className="text-sm font-medium text-gray-800">{bundle.split(' - ')[0]}</Text>
                                    <Text style={{ color: emerald600 }} className="text-sm font-semibold">{bundle.split('- ')[1]}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <TouchableOpacity
                        className={`items-center py-4 mt-2 rounded-xl ${selectedNetwork && phone && amount ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'} `}
                        disabled={!selectedNetwork || !phone || !amount}
                        onPress={() => onContinue({ type: isData ? 'Data Bundle' : 'Airtime', to: phone, amount, merchant: selectedNetwork?.label, description: `${isData ? 'Data' : 'Airtime'} for ${phone}` })}
                    >
                        <Text className="text-base font-bold text-white">Continue</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const ConfirmScreen = ({ data, onBack, onConfirm, currencySymbol, loading }: {
    data: any; onBack: () => void; onConfirm: () => void, currencySymbol: string, loading: boolean
}) => {
    const [pin, setPin] = useState('')

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <BackHeader title="Confirm Payment" onBack={onBack} />
                <ScrollView 
                    className="flex-1" 
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-1 px-5 pt-6">
                        <View style={{ backgroundColor: '#ecfdf5' }} className="p-5 mb-6 rounded-2xl">
                            <View className="items-center mb-4">
                                <View style={{ backgroundColor: emerald600 }} className="items-center justify-center mb-3 rounded-full w-14 h-14">
                                    <Feather name="send" size={22} color="white" />
                                </View>
                                <Text className="text-sm text-gray-400">{data?.type}</Text>
                                <Text className="mt-1 font-bold text-gray-900" style={{ fontSize: 32 }}>{currencySymbol}{data?.amount}</Text>
                            </View>
                            {[
                                { label: 'To', value: data?.to },
                                { label: 'Description', value: data?.merchant || data?.description },
                                { label: 'Fee', value: `${currencySymbol}0.00` },
                                { label: 'Total', value: `${currencySymbol}${data?.amount}` },
                            ].map(row => (
                                <View key={row.label} className="flex-row items-center justify-between py-2 border-b border-emerald-100">
                                    <Text className="text-sm text-gray-500">{row.label}</Text>
                                    <Text className="text-sm font-semibold text-gray-800">{row.value}</Text>
                                </View>
                            ))}
                        </View>
                        <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">Transaction PIN</Text>
                        <OtpInput numberOfDigits={4} onTextChange={setPin} focusColor="#059669" secureTextEntry theme={{ containerStyle: { paddingHorizontal: 30 } }} />
                        <TouchableOpacity
                            className={`items-center py-4 mt-auto mb-8 rounded-xl ${pin.length === 4 && !loading ? 'bg-emerald-700' : 'bg-emerald-700 opacity-50'} `}
                            disabled={pin.length !== 4 || loading}
                            onPress={onConfirm}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-base font-bold text-white">Confirm Payment</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const SuccessScreen = ({ data, onDone, currencySymbol }: { data: any; onDone: () => void, currencySymbol: string }) => (
    <View className="items-center justify-center flex-1 px-8 bg-white">
        <View style={{ backgroundColor: '#ecfdf5' }} className="items-center justify-center w-24 h-24 mb-6 rounded-full">
            <Feather name="check-circle" size={48} color={emerald600} />
        </View>
        <Text className="mb-2 text-2xl font-bold text-gray-900">Payment Sent!</Text>
        <Text className="mb-8 text-sm text-center text-gray-400">Your {data?.type} has been sent successfully.</Text>
        <TouchableOpacity style={{ backgroundColor: emerald600 }} className="w-full py-4 rounded-2xl items-center" onPress={onDone}>
            <Text className="font-bold text-white">Done</Text>
        </TouchableOpacity>
    </View>
)

export default function PaymentScreen() {
    const [flow, setFlow] = useState<Flow>('home')
    const [txData, setTxData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [recentPayments, setRecentPayments] = useState<Transaction[]>([])
    const currency = useCurrency()
    const currencySymbol = currencySymbols[currency]

    const fetchRecentPayments = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentPayments(data || []);
        } catch (error) {}
    }, []);

    useEffect(() => {
        fetchRecentPayments();
    }, [fetchRecentPayments]);

    const handleContinue = (data: any) => { setTxData(data); setFlow('confirm') }

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            const { data: accounts } = await supabase.from('accounts').select('id').eq('user_id', user.id).limit(1);
            const accountId = accounts?.[0]?.id;

            const { error } = await supabase
                .from('transactions')
                .insert({
                    user_id: user.id,
                    account_id: accountId,
                    amount: parseFloat(txData.amount),
                    type: 'expense',
                    description: txData.description,
                    merchant_name: txData.merchant,
                    status: 'completed'
                });

            if (error) throw error;
            setFlow('success');
            fetchRecentPayments();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: error.message });
        } finally {
            setLoading(false);
        }
    }

    if (flow === 'bank') return <BankFlow onBack={() => setFlow('home')} onContinue={handleContinue} currencySymbol={currencySymbol} />
    if (flow === 'phone') return <PhoneFlow onBack={() => setFlow('home')} onContinue={handleContinue} currencySymbol={currencySymbol} />
    if (flow === 'bills') return <BillsFlow onBack={() => setFlow('home')} onContinue={handleContinue} currencySymbol={currencySymbol} />
    if (flow === 'airtime') return <AirtimeFlow onBack={() => setFlow('home')} onContinue={handleContinue} currencySymbol={currencySymbol} />
    if (flow === 'confirm') return <ConfirmScreen data={txData} onBack={() => setFlow('home')} onConfirm={handleConfirm} currencySymbol={currencySymbol} loading={loading} />
    if (flow === 'success') return <SuccessScreen data={txData} onDone={() => { setFlow('home'); setTxData(null) }} currencySymbol={currencySymbol} />

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <View style={{ backgroundColor: emerald700 }} className="px-5 pt-6 pb-12">
                    <Text className="text-2xl font-bold text-white">Payments</Text>
                    <Text className="mt-1 text-sm text-emerald-200">Send money & pay bills</Text>
                </View>
                <View className="py-5 mx-5 mb-4 ">
                    <Text className="mb-4 text-base font-semibold text-gray-800">What would you like to do?</Text>
                    <View className="gap-3">
                        {[
                            { label: 'Send to Bank Account', icon: 'home', color: '#6366f1', bg: '#e0e7ff', screen: 'bank' },
                            { label: 'Send to Phone Number', icon: 'smartphone', color: '#34d399', bg: '#d1fae5', screen: 'phone' },
                            { label: 'Pay Bills', icon: 'zap', color: '#f59e0b', bg: '#fef3c7', screen: 'bills' },
                            { label: 'Airtime & Data', icon: 'wifi', color: '#f472b6', bg: '#fce7f3', screen: 'airtime' },
                        ].map(item => (
                            <TouchableOpacity key={item.label} onPress={() => setFlow(item.screen as Flow)} className="flex-row items-center p-4 bg-white border border-gray-100 rounded-2xl">
                                <View style={{ backgroundColor: item.bg }} className="items-center justify-center w-12 h-12 mr-4 rounded-2xl"><Feather name={item.icon as any} size={22} color={item.color} /></View>
                                <View className="flex-1"><Text className="text-sm font-semibold text-gray-900">{item.label}</Text></View>
                                <Feather name="chevron-right" size={18} color="#d1d5db" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                <View className="px-5">
                    <Text className="mb-3 text-base font-semibold text-gray-800">Recent Payments</Text>
                    {recentPayments.length === 0 ? (
                        <Text className="text-center text-gray-400 py-10 bg-white rounded-xl">No recent payments.</Text>
                    ) : (
                        recentPayments.map((item) => (
                            <View key={item.id} className="flex-row items-center px-4 py-3 my-1 bg-white rounded-lg shadow-sm">
                                <View style={{ backgroundColor: '#ecfdf5' }} className="items-center justify-center mr-3 rounded-full w-11 h-11"><Feather name="send" size={17} color={emerald600} /></View>
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>{item.merchant_name || item.description || 'Payment'}</Text>
                                    <Text className="text-gray-400 text-xs mt-0.5">{new Date(item.created_at).toLocaleDateString()}</Text>
                                </View>
                                <Text className="text-sm font-bold text-red-500">{currencySymbol}{Number(item.amount).toLocaleString()}</Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    )
}