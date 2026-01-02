/**
 * Currency utility for multi-currency support
 * Provides exchange rates, conversion, and formatting
 */

// Supported currencies with their properties
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', locale: 'es-MX' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', locale: 'ko-KR' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', locale: 'en-HK' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', locale: 'sv-SE' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', locale: 'nb-NO' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', locale: 'en-NZ' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', locale: 'pl-PL' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', locale: 'th-TH' },
];

// Get currency info by code
export const getCurrencyInfo = (code: string): Currency => {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0];
};

// Exchange rate cache
let exchangeRateCache: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Fetch exchange rates from a free API
 * Uses exchangerate-api.com (free tier)
 */
export const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<Record<string, number>> => {
  // Check cache first
  if (exchangeRateCache && Date.now() - exchangeRateCache.timestamp < CACHE_DURATION) {
    return exchangeRateCache.rates;
  }

  try {
    // Using exchangerate-api.com free tier
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json();
    
    // Update cache
    exchangeRateCache = {
      rates: data.rates,
      timestamp: Date.now(),
    };

    return data.rates;
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using fallback rates:', error);
    // Return fallback rates (approximate)
    return getFallbackExchangeRates(baseCurrency);
  }
};

// Fallback exchange rates (approximate, used when API fails)
const getFallbackExchangeRates = (baseCurrency: string): Record<string, number> => {
  const rates: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    CAD: 1.36,
    AUD: 1.53,
    CHF: 0.88,
    CNY: 7.24,
    INR: 83.12,
    MXN: 17.15,
    BRL: 4.97,
    KRW: 1298.0,
    SGD: 1.34,
    HKD: 7.82,
    SEK: 10.42,
    NOK: 10.75,
    NZD: 1.64,
    ZAR: 18.65,
    PLN: 3.98,
    THB: 35.80,
  };

  // Convert rates to be relative to base currency
  if (baseCurrency !== 'USD') {
    const baseRate = rates[baseCurrency] || 1;
    for (const currency in rates) {
      rates[currency] = rates[currency] / baseRate;
    }
  }

  return rates;
};

/**
 * Convert amount from one currency to another
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;

  const rates = await fetchExchangeRates('USD'); // API uses USD as base
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
};

/**
 * Format amount in the specified currency
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string,
  locale?: string
): string => {
  const currency = getCurrencyInfo(currencyCode);
  const formatLocale = locale || currency.locale;

  try {
    return new Intl.NumberFormat(formatLocale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
};

/**
 * Format amount with just the symbol
 */
export const formatCurrencySimple = (amount: number, currencyCode: string): string => {
  const currency = getCurrencyInfo(currencyCode);
  const symbol = currency.symbol;
  
  // Handle currencies where symbol comes after (space handling)
  const symbolAfter = ['£', '€', '₹', 'R$', 'R', 'zł', '฿'];
  
  if (symbolAfter.includes(symbol)) {
    return `${amount.toFixed(2)} ${symbol}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
};

/**
 * Get exchange rate between two currencies
 */
export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) return 1;

  const rates = await fetchExchangeRates('USD');
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  return toRate / fromRate;
};

/**
 * Convert and format in one call
 */
export const convertAndFormat = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<string> => {
  const converted = await convertCurrency(amount, fromCurrency, toCurrency);
  return formatCurrency(converted, toCurrency);
};

/**
 * Currencies that don't use decimal places
 */
export const CURRENCIES_WITHOUT_DECIMALS = ['JPY', 'KRW'];

/**
 * Check if a currency uses decimals
 */
export const hasDecimals = (currencyCode: string): boolean => {
  return !CURRENCIES_WITHOUT_DECIMALS.includes(currencyCode);
};
