import { useState, KeyboardEvent } from 'react';
import { useCart } from '../contexts/CartContext';
import type { ServiceType } from '../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import OrderLayout from '../components/OrderLayout';
import CartItemLayout from '../components/CartItemLayout';
import { CartItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function CartSummary() {
  const {
    cartItems, serviceType, setServiceType, address, setAddress,
    tableNumber, setTableNumber, calculateSubTotal, clearCart,
    calculateTotal, calculateTax, getTotalQuantity
  } = useCart();
  const { user } = useAuth();
  const [isCheckout, setIsCheckout] = useState(false);
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  const [tableError, setTableError] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // UI state
  const [editingServiceType, setEditingServiceType] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingTableNumber, setEditingTableNumber] = useState(false);

  const handleNoteChange = (e: any) => {
    setNote(e.target.value);
  };

  const handleCheckout = async () => {
    if (!serviceType) {
      alert("Please select a service type");
      return;
    }
    if (serviceType === 'Delivery' && (!address || addressError)) {
      alert("Please enter a valid delivery address");
      return;
    }
    if (serviceType === 'Dine-in' && (!tableNumber || tableError)) {
      alert("Please enter a valid table number (1-20)");
      return;
    }
    if (cartItems.length === 0) {
      alert("Your cart is empty. Please add items before checking out.");
      return;
    }

    setIsCheckout(true);

    const orderedItems = cartItems.map(item => item.id);
    const quantities = cartItems.map(item => item.quantity);

    const inputData = {
      'diner_id': user.diner_id,
      'service_type': serviceType,
      'ordered_items': orderedItems,
      'quantities': quantities,
    }

    if (note) inputData['note'] = note;
    // if (address && serviceType === 'Delivery') inputData['address'] = address;

    try {
      const { ordersAPI } = await import('../api/endpoints');
      const data = await ordersAPI.submitOrder(inputData);

      if (data.status === 'success') {
        clearCart();
        navigate(`/order/confirmation/${data.order_id}`);
      } else {
        console.error('Order submission failed:', data);
        alert(`Failed to submit order. Please try again. Error message: ${data.message || ''}`);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(`An unexpected error occurred during checkout. Error message: ${error.message || ''}`);
    } finally {
      setIsCheckout(false);
    }
  };


  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    setAddressError(value.trim() === "" ? "Please enter your delivery address" : null);
  };

  const handleTableNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTableNumber(value);
    setTableError(!/^([1-9]|1\d|20)$/.test(value) ? "Please enter a number between 1 and 20" : "");
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    field: "serviceType" | "address" | "tableNumber"
  ) => {
    if (e.key !== "Enter") return;

    if (field === "address") {
      if (!address || address.trim() === "") {
        setAddressError("Please enter your delivery address");
        return;
      }
      setEditingAddress(false);
    }

    if (field === "tableNumber") {
      if (!tableNumber || !/^([1-9]|1\d|20)$/.test(tableNumber)) {
        setTableError("Please enter a number between 1 and 20");
        return;
      }
      setEditingTableNumber(false);
    }

    if (field === "serviceType") {
      setEditingServiceType(false);
    }
  };


  return (
    <OrderLayout>
      <div className="px-8 pt-6 pb-8 flex gap-6 items-start">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6 ">
            <div className="text-sm text-gray-700 font-medium">
              <Link to="/order">
                <span className="text-blue-600 cursor-pointer">Order</span>
              </Link> &gt; My Cart
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            {cartItems.length === 0 ? (
              <p className="text-gray-500">Your cart is empty.</p>
            ) : (
              cartItems.map((item: CartItem, index) => (
                <CartItemLayout key={index} item={item} />
              ))
            )}
          </div>
        </div>

        <div className="w-full max-w-sm shrink-0 sticky top-[140px] self-start">
          <div className="bg-white shadow-md rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-center text-gray-600 mb-4">Order Information</h2>
            <div className="text-sm text-gray-700 space-y-4">
              <div>
                <p className="font-semibold">Ordered items ({getTotalQuantity()})</p>
                <div className="flex justify-between pt-2">
                  <span>Sub-total:</span>
                  <span>{calculateSubTotal().toLocaleString()} VND</span>
                </div>
                {serviceType === "Delivery" && (
                  <div className="flex justify-between items-center pt-1">
                    <span>Delivery fee:</span>
                    <span className="flex items-center gap-1">
                      Free <span className="text-orange-500 cursor-help">ⓘ</span>
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span>Tax 0%:</span>
                  <span>{calculateTax().toLocaleString()} VND</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total:</span>
                  <span>{calculateTotal().toLocaleString()} VND</span>
                </div>
              </div>


              {/* Service Type */}
              <div className="flex items-center justify-between">
                <p className="font-semibold leading-tight">Service Type:</p>
                <button
                  className="text-blue-600 hover:underline text-sm"
                  onClick={() => setEditingServiceType(true)}
                >
                  Edit
                </button>
              </div>
              {editingServiceType ? (
                <select
                  value={serviceType || ""}
                  onChange={(e) => {
                    const type = e.target.value as ServiceType;
                    setServiceType(type);
                    if (type === "Dine-in") setAddress("");
                    if (type === "Delivery") setTableNumber("");
                  }}
                  onBlur={() => setEditingServiceType(false)}
                  className="w-full p-2 border rounded-md text-gray-700 leading-tight"
                >
                  <option value="Dine-in">Dine-in</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Take-away">Take-away</option>
                </select>
              ) : (
                <p className="text-gray-800 leading-tight">{serviceType}</p>
              )}


              {/* Address or Table */}
              {serviceType === "Delivery" && (
                <>
                  <div className="flex items-center justify-between mt-4">
                    <p className="font-semibold pt-2 leading-tight">Delivery Address:</p>
                    <button className="text-blue-600 hover:underline text-sm" onClick={() => setEditingAddress(true)}>Edit</button>
                  </div>
                  {editingAddress ? (
                    <input
                      type="text"
                      value={address || ""}
                      onChange={handleAddressChange}
                      onKeyDown={(e) => handleKeyDown(e, "address")}
                      className="border rounded px-4 py-1 w-full leading-tight"
                    />
                  ) : (
                    <p className="text-gray-600 leading-tight">{address}</p>
                  )}
                  {addressError && <p className="text-red-500 text-sm">{addressError}</p>}
                </>
              )}

              {serviceType === "Dine-in" && (
                <>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-semibold pt-2 leading-tight">Table Number:</p>
                    <button className="text-blue-600 hover:underline text-sm" onClick={() => setEditingTableNumber(true)}>Edit</button>
                  </div>
                  {editingTableNumber ? (
                    <input
                      type="text"
                      value={tableNumber || ""}
                      onChange={handleTableNumberChange}
                      onKeyDown={(e) => handleKeyDown(e, "tableNumber")}
                      className="border rounded px-4 py-1 w-full"
                    />
                  ) : (
                    <p className="text-gray-600 leading-tight">{tableNumber}</p>
                  )}
                  {tableError && <p className="text-red-500 text-sm">{tableError}</p>}
                </>
              )}

              {/* Note */}
              <div className="mt-6">
                <input
                  type="text"
                  placeholder="Enter your note (optional)"
                  className="rounded-full placeholder:font-medium placeholder:text-sm placeholder-gray-300 text-gray-700 px-4 py-2 w-full border"
                  value={note}
                  onChange={handleNoteChange}
                />
              </div>
            </div>

            <div className="mt-4">
              <button 
                onClick={handleCheckout}
                className="w-full flex items-center justify-between bg-[#121c4a] text-white px-4 py-3 rounded-full font-semibold text-sm">
                {calculateTotal().toLocaleString()} VND
                <span className="ml-2 bg-white text-[#121c4a] rounded-full p-1 w-6 h-6 flex items-center justify-center text-sm font-bold">→</span>
              </button>

              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full text-center text-sm text-blue-600 font-semibold mt-3">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center">
            <p className="text-gray-800 font-semibold mb-4">
              Your order will not be saved. Are you sure you want to cancel?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  clearCart();
                  setShowCancelConfirm(false);
                  navigate('/order');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-red-700"
              >
                Yes, Cancel
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="border border-gray-400 text-gray-700 px-4 py-2 rounded-full font-semibold hover:bg-gray-100"
              >
                No, Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </OrderLayout>
  );
}
