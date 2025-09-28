import React, { createContext, useContext, useState, useCallback } from 'react';
import type { CatalogItem } from '../shared/api/catalog';

export interface CartItem {
  catalogCode: string;
  name: string;
  quantity: number;
  price?: string;
  unitOfMeasure?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CatalogItem) => void;
  removeItem: (catalogCode: string) => void;
  updateQuantity: (catalogCode: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  isInCart: (catalogCode: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: CatalogItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.catalogCode === item.code);
      if (existing) {
        return prev.map(i =>
          i.catalogCode === item.code
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, {
        catalogCode: item.code,
        name: item.name,
        quantity: 1,
        price: item.price?.amount,
        unitOfMeasure: item.unitOfMeasure || undefined
      }];
    });
  }, []);

  const removeItem = useCallback((catalogCode: string) => {
    setItems(prev => prev.filter(i => i.catalogCode !== catalogCode));
  }, []);

  const updateQuantity = useCallback((catalogCode: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(catalogCode);
    } else {
      setItems(prev => prev.map(i =>
        i.catalogCode === catalogCode
          ? { ...i, quantity }
          : i
      ));
    }
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotalItems = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const isInCart = useCallback((catalogCode: string) => {
    return items.some(i => i.catalogCode === catalogCode);
  }, [items]);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotalItems,
      isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}