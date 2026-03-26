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
  const [recentCurrencies, setRecentCurrencies] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('recentCurrencies');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

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
    setRecentCurrencies(prev => {
      const newRecents = [fromCurrency, ...prev.filter(c => c !== fromCurrency)].slice(0, 5);
      localStorage.setItem('recentCurrencies', JSON.stringify(newRecents));
      return newRecents;
    });
  }, [fromCurrency]);

  useEffect(() => {
    localStorage.setItem('lastToCurrency', toCurrency);
    setRecentCurrencies(prev => {
      const newRecents = [toCurrency, ...prev.filter(c => c !== toCurrency)].slice(0, 5);
      localStorage.setItem('recentCurrencies', JSON.stringify(newRecents));
      return newRecents;
    });
  }, [toCurrency]);

  const handleInput = (val: string) => {
    setAmountStr(prev => {
      const isOperator = ['+', '-', '*', '/'].includes(val);
      
      if (val === '.') {
        const parts = prev.split(/[+\-*/]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) return prev;
        return prev + '.';
      }

      if (isOperator) {
        if (prev === '0' || prev === '') {
            if (val === '-') return '-';
            return '0';
        }
        if (['+', '-', '*', '/'].includes(prev.slice(-1))) {
           return prev.slice(0, -1) + val;
        }

        const hasOperatorBetween = /[+\-*/]/.test(prev.replace(/^-/, ''));
        if (hasOperatorBetween) {
           try {
             const result = Function('"use strict";return (' + prev + ')')();
             if (!isNaN(result) && isFinite(result)) {
                return String(Number(result.toFixed(6))) + val;
             }
           } catch {
             // fallback to normal appending if eval fails
           }
        }

        return prev + val;
      }

      if (prev === '0') return val === '000' ? '0' : val;
      if (prev === '-0') return val === '000' ? '-0' : '-' + val;
      
      if (prev.length >= 32) return prev;
      return prev + val;
    });
  };

  const handleCalculate = () => {
    try {
      const sanitized = amountStr.replace(/[+\-*/.]+$/, '');
      if (/^[0-9+\-*/. ]+$/.test(sanitized)) {
        const result = Function('"use strict";return (' + sanitized + ')')();
        if (!isNaN(result) && isFinite(result)) {
           // Round to 6 decimal places to prevent floating point absurdities
           setAmountStr(String(Number(result.toFixed(6))));
        }
      }
    } catch {
      // ignore
    }
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

  const parsedAmount = useMemo(() => {
    try {
      const sanitized = amountStr.replace(/[+\-*/.]+$/, '');
      if (/^[0-9+\-*/. ]+$/.test(sanitized)) {
        const result = Function('"use strict";return (' + sanitized + ')')();
        return isNaN(result) || !isFinite(result) ? 0 : result;
      }
    } catch {
      return 0;
    }
    return 0;
  }, [amountStr]);

  const convertedAmount = useMemo(() => {
    if (!rates || !rates[fromCurrency] || !rates[toCurrency]) return 0;

    const amount = parsedAmount;
    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    return (amount / fromRate) * toRate;
  }, [parsedAmount, fromCurrency, toCurrency, rates]);

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
      if (amountStr === '-') return '-';
      const tokens = amountStr.split(/([+\-*/])/);
      return tokens.map(token => {
        if (['+','-','*','/'].includes(token)) {
           const opMap = { '*': ' × ', '/': ' ÷ ', '+': ' + ', '-': ' - ' };
           return opMap[token as keyof typeof opMap];
        }
        if (!token) return '';
        const parts = token.split('.');
        const main = parseInt(parts[0], 10);
        if (isNaN(main)) return token;
        const mainStr = main.toLocaleString('en-US');
        return parts.length > 1 ? `${mainStr}.${parts[1]}` : mainStr;
      }).join('');
    } catch {
      return amountStr;
    }
  }, [amountStr]);

  const showIntermediateResult = useMemo(() => {
    const sanitized = amountStr.replace(/[+\-*/.]+$/, '');
    return /[+\-*/]/.test(sanitized.replace(/^-/, ''));
  }, [amountStr]);

  const formattedIntermediate = useMemo(() => {
    if (!showIntermediateResult) return null;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: fromCurrency,
        maximumFractionDigits: 2,
      }).format(parsedAmount);
    } catch {
      return `${parsedAmount} ${fromCurrency}`;
    }
  }, [showIntermediateResult, parsedAmount, fromCurrency]);

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
            recentCurrencies={recentCurrencies}
          />

          <button className="switch-btn" onClick={switchCurrencies}>
            <ArrowDownUp size={18} />
          </button>

          <CurrencySelector
            label="To"
            selectedCurrency={toCurrency}
            onSelect={setToCurrency}
            rates={rates}
            recentCurrencies={recentCurrencies}
          />
        </div>
      </div>

      <div className="display-area">
        <div className="amount-display">
          {formattedAmount}
        </div>
        {formattedIntermediate && (
          <div className="intermediate-result">
            = {formattedIntermediate}
          </div>
        )}
        <div className="converted-display">
          = {formattedConverted}
        </div>
      </div>

      <Numpad
        onInput={handleInput}
        onClear={clearInput}
        onBackspace={handleBackspace}
        onCalculate={handleCalculate}
      />
    </div>
  );
}

export default App;
