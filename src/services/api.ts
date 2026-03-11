export interface CurrencyRates {
    [currencyCode: string]: number;
}

export interface ApiResponse {
    success: boolean;
    timestamp: number;
    base: string;
    rates: CurrencyRates;
}

const CACHE_KEY = 'rates_cache';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function fetchRates(): Promise<CurrencyRates | null> {
    // Check cache first
    const cachedDataStr = localStorage.getItem(CACHE_KEY);
    let cachedData: { timestamp: number; rates: CurrencyRates } | null = null;

    if (cachedDataStr) {
        try {
            cachedData = JSON.parse(cachedDataStr);
        } catch (e) {
            console.error('Failed to parse cached rates', e);
        }
    }

    const now = Date.now();
    const isCacheValid = cachedData && (now - cachedData.timestamp < CACHE_EXPIRY_MS);

    if (isCacheValid) {
        return cachedData!.rates;
    }

    // Not in cache or expired, try fetching
    try {
        const res = await fetch('https://api.fxratesapi.com/latest');
        if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
        }
        const data: ApiResponse = await res.json();

        if (data.success && data.rates) {
            // Rates are relative to USD by default based on example
            const cacheObj = {
                timestamp: now,
                rates: data.rates
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
            return data.rates;
        }
        throw new Error('Invalid API response format');
    } catch (error) {
        console.error('Error fetching rates:', error);
        // Fallback to cache if offline or API error, even if expired
        if (cachedData) {
            console.log('Falling back to expired cache due to network error');
            return cachedData.rates;
        }
        return null; // Return null if totally offline and no cache
    }
}
