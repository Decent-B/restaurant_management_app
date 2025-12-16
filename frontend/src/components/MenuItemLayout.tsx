import { MenuItem } from "../types";
import { useCart } from '../contexts/CartContext';

interface MenuItemProps {
  item: MenuItem;
}
export default function MenuItemLayout({ item }: MenuItemProps) {
  const { addToCart } = useCart();

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center text-center">
      <img  
        src={item.image}
        alt={item.name}
        className="w-full aspect-square object-cover rounded mb-2"
      />
      <p className="font-semibold text-gray-700 mb-1">{item.name}</p>
      <p className="text-sm text-gray-600 mb-2">{Number(item.price).toLocaleString()} VND</p>
      <button 
        onClick={() => addToCart(item.id)}
        className="bg-white border border-gray-400 rounded-full w-8 h-8 flex items-center justify-center text-xl text-gray-800 shadow hover:shadow-lg hover:shadow-blue-400/50 hover:border-blue-400 transition-all duration-200">
        +
      </button>
    </div>
  );
}