import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";

interface Order {
  order_id: string;
  time_created: string;
  total_price: string;
  status: string;
  items_count: number;
}

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rating, setRating] = useState<string | null>(null);
  const [comment, setComment] = useState<string>("");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderError, setOrderError] = useState("");
  const [skipOrderSelection, setSkipOrderSelection] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  const ratingMap: Record<string, number> = {
    "😠": 1,
    "🙁": 2,
    "😐": 3,
    "🙂": 4,
    "😄": 5,
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.diner_id) {
        setOrderError("Please log in to submit feedback");
        setLoadingOrders(false);
        return;
      }

      try {
        const { ordersAPI } = await import('../api/endpoints');
        const data: any = await ordersAPI.getDinerOrders(user.diner_id);
        if (data.status === "success") {
          // Filter for completed orders only (uppercase COMPLETED)
          const completedOrders = data.orders.filter((order: Order) => 
            order.status === "COMPLETED"
          );
          setOrders(completedOrders);
          // Don't set error if no orders - user can still give general feedback
        } else {
          setOrderError(data.message || "Failed to fetch orders");
        }
      } catch (err: any) {
        setOrderError(err.message || "Error fetching orders");
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user?.diner_id]);

  const handleSubmit = async () => {
    if (!rating) {
      alert("Please select a rating!");
      return;
    }

    const payload: any = {
      rating: ratingMap[rating],
      comment: comment,
    };

    // Only include order_id if an order was selected
    if (selectedOrderId) {
      payload.order_id = parseInt(selectedOrderId);
    }

    try {
      const { reviewsAPI } = await import('../api/endpoints');
      await reviewsAPI.submitFeedback(payload);
      alert("Thank you for your feedback!");
      setSubmitted(true);
    } catch (error: any) {
      alert(`Failed to submit feedback: ${error.message || 'An error occurred'}`);
      console.error(error);
    }
  };

  return (
    <Layout title="Feedback">
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center px-4 py-12">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-xl w-full">
          {!submitted ? (
            <>
              {loadingOrders ? (
                <div className="text-center">
                  <p className="text-gray-600">Loading your orders...</p>
                </div>
              ) : orderError ? (
                <div className="text-center">
                  <p className="text-red-600 mb-4">{orderError}</p>
                  <button
                    onClick={() => navigate("/")}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full"
                  >
                    Back to Home
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">We value your feedback!</h2>
                  
                  {/* Order Selection */}
                  {!selectedOrderId && !skipOrderSelection ? (
                    <>
                      <p className="text-center text-gray-600 mb-6">
                        Would you like to associate your feedback with an order?
                      </p>
                      {orders.length > 0 ? (
                        <>
                          <div className="space-y-3 mb-4">
                            {orders
                              .slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage)
                              .map((order) => (
                                <button
                                  key={order.order_id}
                                  onClick={() => setSelectedOrderId(order.order_id)}
                                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-semibold text-gray-800">Order #{order.order_id}</p>
                                      <p className="text-sm text-gray-600">
                                        {new Date(order.time_created).toLocaleDateString()} • {order.items_count} items
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-gray-800">{Number(order.total_price).toLocaleString()} VND</p>
                                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                        {order.status}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              ))}
                          </div>
                          
                          {/* Pagination Controls */}
                          {orders.length > ordersPerPage && (
                            <div className="flex items-center justify-between mb-4 px-2">
                              <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                  currentPage === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                              >
                                ← Previous
                              </button>
                              <span className="text-sm text-gray-600">
                                Page {currentPage} of {Math.ceil(orders.length / ordersPerPage)} 
                                <span className="text-gray-400 ml-1">({orders.length} orders)</span>
                              </span>
                              <button
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(orders.length / ordersPerPage), prev + 1))}
                                disabled={currentPage >= Math.ceil(orders.length / ordersPerPage)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                  currentPage >= Math.ceil(orders.length / ordersPerPage)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                              >
                                Next →
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center mb-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-gray-600">You don't have any completed orders yet.</p>
                          <p className="text-sm text-gray-500 mt-1">But you can still share your general feedback!</p>
                        </div>
                      )}
                      <button
                        onClick={() => setSkipOrderSelection(true)}
                        className="w-full mt-2 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                      >
                        {orders.length > 0 ? 'Skip - Give general feedback' : 'Continue - Give general feedback'}
                      </button>
                    </>
                  ) : !rating ? (
                    <>
                      {selectedOrderId && (
                        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-600">Selected Order:</p>
                          <p className="font-semibold text-gray-800">Order #{selectedOrderId}</p>
                          <button
                            onClick={() => {
                              setSelectedOrderId("");
                              setSkipOrderSelection(false);
                            }}
                            className="text-sm text-blue-600 hover:underline mt-1"
                          >
                            Change order
                          </button>
                        </div>
                      )}
                      {skipOrderSelection && !selectedOrderId && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600">General Feedback</p>
                          <button
                            onClick={() => setSkipOrderSelection(false)}
                            className="text-sm text-blue-600 hover:underline mt-1"
                          >
                            Select an order instead
                          </button>
                        </div>
                      )}
                      <p className="text-center text-gray-600 mb-6">How would you rate your experience?</p>

                      <div className="flex justify-around mb-6">
                        {["😠", "🙁", "😐", "🙂", "😄"].map((face) => (
                          <button
                            key={face}
                            className="text-4xl transition hover:scale-110"
                            onClick={() => setRating(face)}
                          >
                            {face}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                        {selectedOrderId ? (
                          <p className="text-sm text-gray-600">Order #{selectedOrderId}</p>
                        ) : (
                          <p className="text-sm text-gray-600">General Feedback</p>
                        )}
                      </div>
                      {!showFollowUp ? (
                        <>
                        <h4 className="font-medium text-sm text-gray-800 text-center mb-4">
                        {rating === "😄" || rating === "🙂"
                          ? "Great! Can you share your thoughts with us?"
                          : "We're sorry. Can you tell us what's wrong?"}
                        </h4>
                        <div className="flex justify-center gap-4">
                          <button
                            className="bg-white px-6 py-2 rounded-full shadow text-gray-700"
                            onClick={handleSubmit}  // "No, thank you!" submits feedback directly
                          >
                            No, thank you!
                          </button>
                          <button
                            className="bg-[#1e2a59] text-white px-6 py-2 rounded-full shadow"
                            onClick={() => setShowFollowUp(true)}
                          >
                            Yes, of course!
                          </button>
                        </div>
                        </>
                      ) : (
                        <>
                          <textarea
                            placeholder="Tell us more..."
                            className="w-full p-4 border border-gray-500 rounded-lg resize-none mb-4 h-32 mt-6 text-gray-700"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          />
                          <button
                            onClick={handleSubmit}
                            className="w-full bg-[#1e2a59] text-white font-semibold py-3 rounded-lg hover:bg-[#2c3e75] transition"
                          >
                            Submit Feedback
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-green-600 mb-2">🎉 Thank you! 🎉</h3>
              <p className="text-gray-700">We appreciate your feedback and will use it to improve our service.</p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full"
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
