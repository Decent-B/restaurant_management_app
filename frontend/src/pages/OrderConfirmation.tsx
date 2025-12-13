import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import type { ServiceType } from '../contexts/CartContext';
import { Link, useNavigate, useParams } from 'react-router-dom';
import OrderLayout from '../components/OrderLayout';
import OrderedItemLayout from '../components/OrderedItemLayout';
import { CartItem, Order } from '../types';

const defaultOrder: Order = {
  order_id: 0,
  service_type: "",
  order_status: "",
  total_price: 0,
  time_created: "",
  last_modified: "",
  address: null,
  note: "",
  items: [],
};


export default function OrderConfirmation() {
  const { order_id } = useParams();
  const [order, setOrder] = useState<Order>(defaultOrder);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    import('../api/endpoints').then(({ ordersAPI }) => {
      ordersAPI.getBill(parseInt(order_id!))
        .then((data) => {
          const cartItems: CartItem[] = data.items.map((item: any) => ({
            id: item.menu_item_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          }));

          const order: Order = {
            order_id: data.order_id,
            service_type: data.service_type,
            order_status: data.order_status,
            total_price: data.total_price,
            time_created: data.time_created,
            last_modified: data.last_modified,
            address: data.address,
            note: data.note,
            items: cartItems,
          };

          setOrder(order);
          setIsLoading(false);
        })
        .catch((error) => { 
          console.error("Failed to fetch order:", error);
          setIsLoading(false);
        });
    });
  }, [order_id]);

  
  const getTotalQuantity = () => {
    return order?.items.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  const handleMakePayment = () => {
    if (!order) return;
    navigate(`/order/payment/${order_id}`);
  };

  const setOrderToCart = (order:Order) => {
    const {setCartItems, setServiceType, setAddress, clearCart} = useCart();
    clearCart();
    if (!order || !order.items || order.items.length === 0) return 0;
    const cartItems: CartItem[] = order.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image
    }));
    setCartItems(cartItems);
    setServiceType(order.service_type as ServiceType);
    if (order.service_type === "Delivery") {
      setAddress(order.address || "");
    };
    return 1;
  };

  const handleOrderChange = () => {
    const cartData = setOrderToCart(order);
    if (!cartData) {
      alert("Error setting order to cart. Please try again.");
      return;
    }
    // Navigate to the order page
    navigate('/order/cart');
  }

  return (
    <OrderLayout>
      <div className="px-8 pt-6 pb-8 flex gap-6 items-start">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6 ">
            <div className="text-sm text-gray-700 font-medium">
              <Link to="/order">
                <span className="text-blue-600 cursor-pointer">Order</span>
              </Link> &gt; Ordered Items
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            {(order.items).map((item: CartItem, index) => (
                <OrderedItemLayout key={index} item={item} />
              ))
            }
          </div>
        </div>

        <div className="w-full max-w-sm shrink-0">
          <div className="bg-white shadow-md rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-center text-gray-600 mb-4">Order Information</h2>
            <div className="text-sm text-gray-700 space-y-4">
              <div>
                <p className="font-semibold">Ordered items ({getTotalQuantity()})</p>
                <div className="flex justify-between pt-2">
                  <span>Sub-total:</span>
                  <span>{order.total_price.toLocaleString()} VND</span>
                </div>
                {order.service_type === "Delivery" && (
                  <div className="flex justify-between items-center pt-1">
                    <span>Delivery fee:</span>
                    <span className="flex items-center gap-1">
                      Free <span className="text-orange-500 cursor-help">ⓘ</span>
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span>Tax 0%:</span>
                  <span>0 VND</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total:</span>
                  <span>{(order.total_price).toLocaleString()} VND</span>
                </div>
              </div>


              {/* Service Type */}
              <div className="flex items-center justify-between">
                <p className="font-semibold leading-tight">Service Type:</p>
              </div>
              <p className="text-gray-800 leading-tight">{order.service_type}</p>


              {/* Address or Table */}
              {order.service_type === "Delivery" && (
                <>
                  <div className="flex items-center justify-between mt-4">
                    <p className="font-semibold pt-2 leading-tight">Delivery Address:</p>
                  </div>
                  <p className="text-gray-600 leading-tight">{order.address}</p>
                </>
              )}

              {/* Note */}
              {order.note && (
                <>
                <div className="flex items-center justify-between mt-4">
                  <p className="font-semibold pt-2 leading-tight">Note:</p>
                </div>
                <p className="text-gray-600 leading-tight">{order.note}</p> 
                </>
              )}
            </div>

            <div className="mt-4">
              <button 
                onClick={handleMakePayment}
                className="w-full flex items-center justify-between bg-[#121c4a] text-white px-4 py-3 rounded-full font-semibold text-sm">
                Make Payment
                <span className="ml-2 bg-white text-[#121c4a] rounded-full p-1 w-6 h-6 flex items-center justify-center text-sm font-bold">→</span>
              </button>

              <button
                onClick={handleOrderChange}
                className="w-full flex justify-center items-center border border-blue-600 text-blue-600 bg-white px-4 py-3 rounded-full font-semibold text-sm mt-2">
                Change Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </OrderLayout>
  );
}

