import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, ArrowDownUp } from 'lucide-react';
import { fetchRates, type CurrencyRates } from './services/api';
import { CurrencySelector } from './components/CurrencySelector';
import { Numpad } from './components/Numpad';

function App() {
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [fromCurrency, setFromCurrency] = useState(() => localStorage.getItem('lastFromCurrency') || 'USD');
  const [toCurrency, setToCurrency] = useState(() => localStorage.getItem('lastToCurrency') || 'EUR');
  const [amountStr, setAmountStr] = useState('0');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      const data = await fetchRates();
      if (data) {
        setRates(data);
      } else {
        setError('Failed to fetch conversion rates and no offline cache available.');
      }
      setLoading(false);
    };

    fetchInitialData();

    const handleOnline = () => {
      setIsOffline(false);
      fetchInitialData(); // Refresh rates when coming back online
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('lastFromCurrency', fromCurrency);
  }, [fromCurrency]);

  useEffect(() => {
    localStorage.setItem('lastToCurrency', toCurrency);
  }, [toCurrency]);

  const handleInput = (val: string) => {
    setAmountStr(prev => {
      if (val === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }
      if (prev === '0') {
        if (val === '0') return '0';
        return val;
      }
      // Limit to 2 decimal places optionally, or just limit total length
      if (prev.includes('.')) {
        const decimals = prev.split('.')[1];
        if (decimals && decimals.length >= 2) return prev;
      }
      if (prev.length >= 12) return prev;
      return prev + val;
    });
  };

  const handleBackspace = () => {
    setAmountStr(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const clearInput = () => {
    setAmountStr('0');
  };

  const switchCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // The base for fxratesapi is usually USD, but the rates object has everything relative to it.
  const convertedAmount = useMemo(() => {
    if (!rates || !rates[fromCurrency] || !rates[toCurrency]) return 0;

    const amount = parseFloat(amountStr) || 0;

    // Conversion math: (amount / fromRate) * toRate
    // E.g., USD to EUR: (amount / 1) * 0.86
    // E.g., EUR to GBP: (amount / 0.86) * 0.74

    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    return (amount / fromRate) * toRate;
  }, [amountStr, fromCurrency, toCurrency, rates]);

  // Format the output
  const formattedConverted = useMemo(() => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: toCurrency,
        maximumFractionDigits: 2,
      }).format(convertedAmount);
    } catch {
      // Fallback if currency is not supported by Intl
      return `${convertedAmount.toFixed(2)} ${toCurrency}`;
    }
  }, [convertedAmount, toCurrency]);

  const formattedAmount = useMemo(() => {
    try {
      const parts = amountStr.split('.');
      const main = parseInt(parts[0], 10).toLocaleString('en-US');
      if (parts.length > 1) {
        return `${main}.${parts[1]}`;
      }
      return main;
    } catch {
      return amountStr;
    }
  }, [amountStr]);

  if (loading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <RefreshCw className="animate-spin" size={32} color="var(--accent-color)" />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading Rates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{ background: 'var(--btn-bg)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isOffline && (
        <div className="offline-banner">
          ⚠️ You are offline. Using cached conversion rates.
        </div>
      )}

      <div className="header">
        <div className="currency-controls-row">
          <CurrencySelector
            label="From"
            selectedCurrency={fromCurrency}
            onSelect={setFromCurrency}
            rates={rates}
          />

          <button className="switch-btn" onClick={switchCurrencies}>
            <ArrowDownUp size={18} />
          </button>

          <CurrencySelector
            label="To"
            selectedCurrency={toCurrency}
            onSelect={setToCurrency}
            rates={rates}
          />
        </div>
      </div>

      <div className="display-area">
        <div className="amount-display">
          {formattedAmount}
        </div>
        <div className="converted-display">
          = {formattedConverted}
        </div>
      </div>

      <Numpad
        onInput={handleInput}
        onClear={clearInput}
        onBackspace={handleBackspace}
      />
    </div>
  );
}

export default App;
