export interface CurrencyRates {
  base: string;
  rates: Record<string, number>;
  date: string;
}

export const fetchExchangeRates = async (): Promise<CurrencyRates> => {
  const response = await fetch("https://open.er-api.com/v6/latest/TRY");

  if (!response.ok) {
    throw new Error("Kur verisi alınamadı.");
  }

  const data = await response.json();

  if (!data || data.result !== "success" || !data.rates) {
    throw new Error("Geçersiz kur verisi.");
  }

  return {
    base: data.base_code,
    rates: data.rates,
    date: data.time_last_update_utc,
  };
};
