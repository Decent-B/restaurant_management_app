import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CartItem, MenuItem } from '../types'; // adjust the path as needed

export type ServiceType = "Dine-in" | "Delivery" | "Take-away" | null;

interface CartContextType {
  cartItems: CartItem[];
  serviceType: ServiceType;
  tableNumber: string | null;
  address: string | null;
  setCartItems: (items: CartItem[]) => void;
  setServiceType: (type: ServiceType) => void;
  setTableNumber: (number: string) => void;
  setAddress: (address: string) => void;
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  calculateTotal: () => number;
  decreaseQuantity: (id: number) => void;
  calculateSubTotal: () => number;
  calculateTax: () => number;
  getTotalQuantity: () => number;
  getItemPrice: (price: string, quantity: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [serviceType, setServiceType] = useState<ServiceType>("Dine-in");
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);


  useEffect(() => {
    import('../api/endpoints').then(({ menuAPI }) => {
      menuAPI.listMenuItems()
        .then((data) => setAllMenuItems(data))
        .catch((error) => console.error("Failed to fetch menu items:", error));
    });
  }, []);

  const addToCart = (id: number) => {
    const item = allMenuItems.find((i) => i.id === id);
    if (!item) return;

    setCartItems((prevCart) => {
      const existing = prevCart.find((ci) => ci.id === id);
      if (existing) {
        return prevCart.map((ci) =>
          ci.id === id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };


  const removeFromCart = (id: number) => {
    setCartItems((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const calculateSubTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace(/[^0-9.-]+/g, '')); // Handle prices with "vnđ"
      return total + price * item.quantity;
    }, 0);
  };

  const decreaseQuantity = (id: number) => {
    setCartItems((prevCart) =>
      prevCart.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const getTotalQuantity = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  const calculateTax = () => {
    const total = calculateSubTotal();
    const taxRate = 0.00; 
    return total * taxRate;
  }

  const calculateTotal = () => {
    const subTotal = calculateSubTotal();
    const tax = calculateTax();
    const deliveryFee = 0; // Assuming free delivery for simplicity
    return subTotal + tax + deliveryFee;
  }

  const getItemPrice = (price: string, quantity: number) => {
    return Number(price) * quantity;
  }

  return (
    <CartContext.Provider value={{ cartItems, serviceType, setServiceType, tableNumber, setTableNumber, address, setAddress, addToCart, removeFromCart, clearCart, calculateSubTotal, decreaseQuantity, calculateTax, calculateTotal, getTotalQuantity, getItemPrice, setCartItems}}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
