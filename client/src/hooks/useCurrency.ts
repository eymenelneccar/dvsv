import { useLocalStorage } from "./useLocalStorage";

export function useCurrency() {
  const [currency, setCurrency] = useLocalStorage<string>("currency", "ر.س");

  return {
    currency,
    setCurrency,
    currencyOptions: ["ر.س", "ج.م", "د.ك", "د.أ", "د.ت", "$", "€"],
  };
}
