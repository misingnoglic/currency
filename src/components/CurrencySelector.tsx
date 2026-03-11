import { useState, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { type CurrencyRates } from '../services/api';

interface CurrencySelectorProps {
    label: string;
    selectedCurrency: string;
    onSelect: (currency: string) => void;
    rates: CurrencyRates | null;
}

export function CurrencySelector({ label, selectedCurrency, onSelect, rates }: CurrencySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Get localized currency names
    const currencyNames = useMemo(() => {
        try {
            return new Intl.DisplayNames(['en'], { type: 'currency' });
        } catch (e) {
            return null;
        }
    }, []);

    const getCurrencyName = (code: string) => {
        if (!currencyNames) return code;
        try {
            return currencyNames.of(code) || code;
        } catch (e) {
            return code;
        }
    };

    const availableCurrencies = useMemo(() => {
        if (!rates) return ['USD'];
        // Assuming USD is the base if rates is present
        const codes = Object.keys(rates);
        if (!codes.includes('USD')) {
            codes.push('USD'); // ensure USD is always present
        }
        return codes.sort();
    }, [rates]);

    const filteredCurrencies = useMemo(() => {
        if (!searchQuery) return availableCurrencies;
        const lowerQuery = searchQuery.toLowerCase();
        return availableCurrencies.filter((code) => {
            const name = getCurrencyName(code).toLowerCase();
            return code.toLowerCase().includes(lowerQuery) || name.includes(lowerQuery);
        });
    }, [searchQuery, availableCurrencies]);

    const handleSelect = (code: string) => {
        onSelect(code);
        setIsOpen(false);
        setSearchQuery('');
    };



    return (
        <>
            <div className="currency-input">
                <span className="currency-input-label">{label}</span>
                <button
                    className="currency-select-btn"
                    onClick={() => setIsOpen(true)}
                >
                    <span>{selectedCurrency}</span>
                    <ChevronDown size={18} />
                </button>
            </div>

            <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <span className="modal-title">Select Currency</span>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search currency..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="currency-list">
                        {filteredCurrencies.length > 0 ? (
                            filteredCurrencies.map((code) => {
                                const name = getCurrencyName(code);
                                return (
                                    <div
                                        key={code}
                                        className={`currency-item ${selectedCurrency === code ? 'selected' : ''}`}
                                        onClick={() => handleSelect(code)}
                                    >
                                        <div>
                                            <div className="currency-code">{code}</div>
                                            <div className="currency-name">{code !== name ? name : ''}</div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                No currencies found
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
