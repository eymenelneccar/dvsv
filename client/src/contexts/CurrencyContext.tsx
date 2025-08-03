// 📄 client/src/contexts/CurrencyContext.tsx

import React, { createContext, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";

export type Currency = "₺" | "$" | "€";

interface CurrencyContextProps {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrency] = useLocalStorage<Currency>("currency", "₺");

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
