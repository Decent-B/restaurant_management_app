import { CartItem } from '../types';
import { Plus, Minus, X} from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface CartItemProps {
  item: CartItem;
}

export default function CartItemLayout({item}: CartItemProps) {
  const {addToCart, removeFromCart, decreaseQuantity, getItemPrice} = useCart();
  const itemPrice = getItemPrice(item.price, item.quantity);
  return (
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm relative">
      <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-gray-500 hover:text-black">
        <X size={18} />
      </button>
      <div className="flex gap-3 mb-2">
        <img
          src={item.image}
          alt={item.name}
          className="w-16 h-16 object-cover rounded"
        />
        {/* <div className="w-12 h-12 object-cover rounded" /> */}
        <div className="flex-1">
          <p className="font-semibold text-gray-700">{item.name}</p>
          <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <button 
          onClick={() => decreaseQuantity(item.id)}
          className="border rounded-full w-6 h-6 flex items-center justify-center text-gray-700">
            <Minus size={12} />
          </button>
          <span className="text-sm font-medium  text-gray-700"> {item.quantity} </span>
          <button onClick={() => addToCart(item.id)} className="border rounded-full w-6 h-6 flex items-center justify-center text-gray-700">
            <Plus size={12} />
          </button>
        </div>
        <p className="font-semibold text-sm text-gray-700">{itemPrice.toLocaleString()} VND</p>
      </div>
    </div>
  );
}
