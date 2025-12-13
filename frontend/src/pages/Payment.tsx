import { useState } from "react";
import Layout from "../components/Layout";
import momoIcon from '../assets/momo.png';
import vnpayIcon from '../assets/vnpay.png';
import { useNavigate, useParams } from "react-router-dom";

interface PaymentMethod {
  id: string;
  label: string;
  description?: string;
  icons?: string[];
}

const paymentOptions: PaymentMethod[] = [
  {
    id: "cash",
    label: "Cash",
  },
  {
    id: "banking",
    label: "Online Banking",
    icons:[momoIcon, vnpayIcon],
  },
];

export default function Payment() {
  const { order_id } = useParams();
  const [selected, setSelected] = useState<string>("");
  const navigate = useNavigate();
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false)

  const handleMakePayment = async () => {
    if (!order_id || !selected) return;

    const formData = new URLSearchParams();
    formData.append("order_id", order_id);
    formData.append("payment_method", selected === "cash" ? "CASH" : "ONLINE_BANKING");

    try {
      const { ordersAPI } = await import('../api/endpoints');
      const paymentMethod = selected === "cash" ? "CASH" : "ONLINE_BANKING";
      const data = await ordersAPI.processPayment(parseInt(order_id), paymentMethod);
      if (data.status === "success") {
        setPaymentSuccess(true);
      } else {
        alert("Payment failed.")
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    };
}

  return (
    <Layout title="Payment | Checkout">
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center px-4 py-12">
        <div className="bg-white w-full max-w-2xl rounded-lg shadow-md p-8">
          {!paymentSuccess ? (
            <>
              <h1 className="text-2xl font-bold mb-6 text-gray-800">How would you like to pay?</h1>

              <div className="space-y-4">
                {paymentOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start p-4 border rounded-lg cursor-pointer ${
                      selected === option.id ? "border-blue-600 bg-blue-50" : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={option.id}
                      checked={selected === option.id}
                      onChange={() => setSelected(option.id)}
                      className="mt-1 mr-4 accent-blue-600"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800">{option.label}</span>
                      {option.description && (
                        <span className="text-sm text-gray-500 mt-1">{option.description}</span>
                      )}
                      {option.icons && (
                        <div className="mt-2 flex space-x-2">
                          {option.icons.map((src, idx) => (
                            <img key={idx} src={src} alt={`${option.id} icon`} className="h-6" />
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <button
                className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50"
                disabled={!selected}
                onClick={handleMakePayment}
              >
                Proceed to Payment
              </button>

              <button 
                onClick={() => navigate('/order/cart')}
                className="w-full text-center text-sm text-blue-600 font-semibold mt-3">
                Cancel
              </button>
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-700">Thank you for choosing our service!</h2>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
