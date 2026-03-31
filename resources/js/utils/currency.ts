/**
 * Para birimi ve fiyat formatlama yardımcıları
 */

export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP' | 'CHF' | string;

export interface CurrencySymbols {
    [key: string]: string;
}

export const currencySymbols: CurrencySymbols = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£',
    CHF: 'CHF ',
};

/**
 * Para birimi sembolünü döndürür
 */
export const getCurrencySymbol = (currency: CurrencyCode): string => {
    return currencySymbols[currency] || currency + ' ';
};

/**
 * Sayıyı Türkçe formatında formatlar
 */
export const formatNumber = (
    value: number | null | undefined,
    decimals: number = 2
): string => {
    const num = value ?? 0;
    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(num);
};

/**
 * Fiyatı belirtilen para birimiyle formatlar
 * @example formatCurrency(100, 'TRY') => '₺100,00'
 * @example formatCurrency(25.42, 'USD') => '$25,42'
 */
export const formatCurrency = (
    amount: number | null | undefined,
    currency: CurrencyCode = 'TRY',
    decimals: number = 2
): string => {
    const value = amount ?? 0;
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${formatNumber(value, decimals)}`;
};

export interface PriceDisplayOptions {
    /** Orijinal fiyat */
    price: number | null | undefined;
    /** Orijinal para birimi */
    currency?: CurrencyCode;
    /** TL karşılığı (opsiyonel - dövizli fiyatlar için) */
    priceTry?: number | null;
    /** Ondalık basamak sayısı */
    decimals?: number;
    /** TL dönüşümünü her zaman göster (TRY için bile) */
    alwaysShowTry?: boolean;
}

/**
 * Fiyatı orijinal para birimi ve TL karşılığıyla formatlar
 *
 * @example
 * // TRY fiyat
 * formatPriceWithCurrency({ price: 1250, currency: 'TRY' })
 * // => '₺1.250,00'
 *
 * // USD fiyat (TL karşılığıyla)
 * formatPriceWithCurrency({ price: 25.42, currency: 'USD', priceTry: 1032.05 })
 * // => '$25,42 (₺1.032,05)'
 *
 * // USD fiyat (TL karşılığı yok)
 * formatPriceWithCurrency({ price: 25.42, currency: 'USD' })
 * // => '$25,42'
 */
export const formatPriceWithCurrency = (options: PriceDisplayOptions): string => {
    const {
        price,
        currency = 'TRY',
        priceTry,
        decimals = 2,
        alwaysShowTry = false,
    } = options;

    const value = price ?? 0;

    // TRY fiyatsa direkt göster
    if (currency === 'TRY' && !alwaysShowTry) {
        return formatCurrency(value, 'TRY', decimals);
    }

    // Dövizli fiyat
    const formattedPrice = formatCurrency(value, currency, decimals);

    // TL karşılığı varsa parantez içinde göster
    if (priceTry != null && priceTry > 0) {
        const formattedTry = formatCurrency(priceTry, 'TRY', decimals);
        return `${formattedPrice} (${formattedTry})`;
    }

    return formattedPrice;
};

/**
 * Ürün fiyatını formatlar (product nesnesinden)
 *
 * @example
 * formatProductPrice(product)
 * // TRY ürün => '₺1.250,00'
 * // USD ürün => '$25,42 (₺1.032,05)'
 */
export const formatProductPrice = (product: {
    sale_price?: number | null;
    sale_price_try?: number | null;
    currency?: string | null;
    logo_currency?: string | null;
}): string => {
    const currency = product.currency || product.logo_currency || 'TRY';

    return formatPriceWithCurrency({
        price: product.sale_price,
        currency: currency as CurrencyCode,
        priceTry: currency !== 'TRY' ? product.sale_price_try : undefined,
    });
};

/**
 * Maliyet fiyatını formatlar (product nesnesinden)
 */
export const formatCostPrice = (product: {
    cost_price?: number | null;
    cost_price_try?: number | null;
    currency?: string | null;
    logo_currency?: string | null;
}): string => {
    const currency = product.currency || product.logo_currency || 'TRY';

    return formatPriceWithCurrency({
        price: product.cost_price,
        currency: currency as CurrencyCode,
        priceTry: currency !== 'TRY' ? product.cost_price_try : undefined,
    });
};

/**
 * Sipariş/Teklif satır fiyatını formatlar
 */
export const formatLinePrice = (
    price: number | null | undefined,
    currency: CurrencyCode = 'TRY',
    priceTry?: number | null
): string => {
    return formatPriceWithCurrency({
        price,
        currency,
        priceTry: currency !== 'TRY' ? priceTry : undefined,
    });
};
