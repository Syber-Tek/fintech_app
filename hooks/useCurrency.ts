import { useState, useEffect } from 'react';
import { getItem } from '../utils/asyncStorage';

const useCurrency = () => {
    const [currency, setCurrency] = useState('GHS'); // Default currency

    useEffect(() => {
        const loadCurrency = async () => {
            const storedCurrency = await getItem('currency');
            if (storedCurrency) {
                setCurrency(storedCurrency);
            }
        };
        loadCurrency();
    }, []);

    return currency;
};

export default useCurrency;
