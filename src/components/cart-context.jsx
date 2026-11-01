import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rj_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch (e) {
      // ignore
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem('rj_cart', JSON.stringify(cart));
      } catch (e) {
        // ignore
      }
    }
  }, [cart, loaded]);

  const addItem = (item) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.foodItemId === item.foodItemId && i.foodName === item.foodName,
      );
      if (existing) {
        return prev.map((i) =>
          i.foodItemId === item.foodItemId && i.foodName === item.foodName
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i,
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const updateQuantity = (foodItemId, foodName, quantity) => {
    const qty = Math.max(0, Number(quantity) || 0);
    if (qty === 0) {
      removeItem(foodItemId, foodName);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.foodItemId === foodItemId && i.foodName === foodName ? { ...i, quantity: qty } : i,
      ),
    );
  };

  const removeItem = (foodItemId, foodName) => {
    setCart((prev) => prev.filter((i) => !(i.foodItemId === foodItemId && i.foodName === foodName)));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, i) => sum + Number(i.foodPrice) * i.quantity, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, loaded, addItem, updateQuantity, removeItem, clearCart, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
