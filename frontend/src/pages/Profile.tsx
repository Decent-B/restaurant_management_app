import React, { useEffect, useState } from "react";
import {
  FaSmile, FaShoppingCart, FaSignOutAlt, FaGoogle, FaTimes
} from "react-icons/fa";
import { logout } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface Order {
  order_id: string;
  time_created: string;
  items_count: number;
  total_price: string;
  status: string;
}

interface OrderDetail {
  order_id: number;
  service_type: string;
  order_status: string;
  total_price: number;
  time_created: string;
  address: string | null;
  note: string;
  items: Array<{
    menu_item_id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
}

interface Feedback {
  id: number;
  rating: number;
  comment: string;
  time_created: string;
}

const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer text-sm font-medium ${
      active ? "bg-gray-200 text-[#1a2a5b] font-bold" : "text-gray-800 hover:bg-gray-100"
    }`}
  >
    <Icon className="text-lg" />
    {label}
  </div>
);

export default function Profile() {
  const [activePanel, setActivePanel] = useState("Personal Information");
  const navigate = useNavigate();
  const { fetchUser, user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderError, setOrderError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Order details modal state
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [orderFeedback, setOrderFeedback] = useState<Feedback | null>(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
  });
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { ordersAPI } = await import('../api/endpoints');
        const data: any = await ordersAPI.getDinerOrders(user?.diner_id!);
        if (data.status === "success") {
          setOrders(data.orders);
        } else {
          setOrderError(data.message || "Failed to fetch orders.");
        }
      } catch (err: any) {
        setOrderError(err.message || "Error fetching order history.");
      } finally {
        setLoadingOrders(false);
      }
    };

    if (user?.diner_id && activePanel === "Order History") {
      setCurrentPage(1); // Reset to page 1 when viewing order history
      fetchOrders();
    }
  }, [user?.diner_id, activePanel]);

  const handleLogout = async () => {
    try {
      const data: any = await logout();
      if (data.success) {
        navigate("/");
        await fetchUser();
      } else {
        alert("Logout failed. Please try again.");
      }
    } catch (error) {
      alert("An error occurred while logging out. Please try again.");
    }
  };

  const handleEditClick = () => {
    setEditFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setEditError("");
    setEditSuccess("");
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");

    try {
      const { accountsAPI } = await import('../api/endpoints');
      const result: any = await accountsAPI.updateUserInfo(user?.id!, {
        name: editFormData.name,
        email: editFormData.email,
      });
      
      if (result.status === "success") {
        setEditSuccess("Profile updated successfully!");
        await fetchUser(); // Refresh user data
        setTimeout(() => {
          setShowEditDialog(false);
          setEditSuccess("");
        }, 1500);
      } else {
        setEditError(result.message || "Failed to update profile.");
      }
    } catch (err: any) {
      setEditError(err.message || "Error updating profile.");
    }
  };

  const handleViewOrderDetails = async (orderId: string) => {
    setLoadingOrderDetails(true);
    setShowOrderDetails(true);
    setSelectedOrder(null);
    setOrderFeedback(null);

    try {
      const { ordersAPI, reviewsAPI } = await import('../api/endpoints');
      
      // Fetch order details
      const orderData: any = await ordersAPI.getBill(parseInt(orderId));
      setSelectedOrder(orderData);

      // Fetch feedback for this order
      try {
        const feedbackData: any = await reviewsAPI.getOrderFeedback(parseInt(orderId));
        if (feedbackData.status === "success" && feedbackData.feedback) {
          setOrderFeedback(feedbackData.feedback);
        }
      } catch (err) {
        // No feedback found, that's okay
        console.log("No feedback for this order");
      }
    } catch (err: any) {
      alert(`Error loading order details: ${err.message || 'Unknown error'}`);
      setShowOrderDetails(false);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? "text-yellow-500" : "text-gray-300"}>
          ★
        </span>
      );
    }
    return stars;
  };

  const renderPanel = () => {
    switch (activePanel) {
      case "Personal Information":
        return (
          <>
            <h2 className="text-2xl font-semibold mb-6">Personal Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block font-semibold mb-1">Name</label>
                <input type="text" value={user?.name || ''} disabled className="w-full bg-gray-100 p-2 rounded" />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold mb-1">Email address</label>
                <div className="flex">
                  <span className="bg-gray-200 px-3 py-2 rounded-l">
                    <FaGoogle />
                  </span>
                  <input type="text" value={user?.email || ''} disabled className="w-full bg-gray-100 p-2 rounded-r" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block font-semibold mb-1">Role</label>
                <input type="text" value={user?.role || ''} disabled className="w-full bg-gray-100 p-2 rounded" />
              </div>
            </div>
            <div className="mt-6">
              <button 
                onClick={handleEditClick}
                className="bg-[#1a2a5b] text-white font-semibold py-2 px-6 rounded-full shadow-md hover:bg-[#16224a]">
                Edit Personal Information
              </button>
            </div>
          </>
        );

      case "Order History":
        if (loadingOrders) return <div>Loading order history...</div>;
        if (orderError) return <div className="text-red-600">Error: {orderError}</div>;

        const totalPages = Math.ceil(orders.length / ordersPerPage);
        const paginatedOrders = orders.slice(
          (currentPage - 1) * ordersPerPage,
          currentPage * ordersPerPage
        );

        return (
          <div>
            <h2 className="text-2xl font-semibold mb-6">🛒 Order History</h2>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No orders yet. Start ordering to see your history!</p>
              </div>
            ) : (
              <>
                <div className="overflow-auto">
                  <table className="w-full table-auto border-collapse bg-white text-sm">
                    <thead className="bg-gray-100 text-left font-semibold">
                      <tr>
                        <th className="px-4 py-2">Order no.</th>
                        <th className="px-4 py-2">Order date</th>
                        <th className="px-4 py-2">Items</th>
                        <th className="px-4 py-2">Total</th>
                        <th className="px-4 py-2">Order status</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedOrders.map((order) => (
                        <tr key={order.order_id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{order.order_id}</td>
                          <td className="px-4 py-2">{new Date(order.time_created).toLocaleDateString()}</td>
                          <td className="px-4 py-2">{order.items_count}</td>
                          <td className="px-4 py-2">{Number(order.total_price).toLocaleString()} VND</td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                order.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td 
                            className="px-4 py-2 text-[#1a2a5b] hover:underline cursor-pointer"
                            onClick={() => handleViewOrderDetails(order.order_id)}
                          >
                            › View details
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {orders.length > ordersPerPage && (
                  <div className="flex items-center justify-between mt-6">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#1a2a5b] text-white hover:bg-[#16224a]'
                      }`}
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                      <span className="text-gray-400 ml-2">({orders.length} total orders)</span>
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        currentPage >= totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#1a2a5b] text-white hover:bg-[#16224a]'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#eae2d0] font-sans text-gray-800">
      {/* Sidebar */}
      <div className="w-[280px] bg-white shadow-md rounded-xl m-4 flex flex-col py-6">
        <div className="flex flex-col items-center">
          <FaSmile className="text-4xl mb-2 text-gray-700" />
          <span className="font-semibold text-lg">{user?.name || 'User'}</span>
        </div>
        <div className="mt-6 space-y-2">
          <SidebarItem
            icon={FaSmile}
            label="Personal Information"
            active={activePanel === "Personal Information"}
            onClick={() => setActivePanel("Personal Information")}
          />
          {/* Only show Order History for Customer role */}
          {user?.role === "Customer" && (
            <SidebarItem
              icon={FaShoppingCart}
              label="Order History"
              active={activePanel === "Order History"}
              onClick={() => setActivePanel("Order History")}
            />
          )}
        </div>
        <div className="mt-auto px-4 pt-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#1a2a5b] font-semibold hover:underline"
          >
            <FaSignOutAlt />
            Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white shadow-md rounded-xl m-4 px-8 py-6">
        {renderPanel()}
      </div>

      {/* Edit Profile Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Edit Personal Information</h3>
            
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-1">Email address</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full border border-gray-300 p-2 rounded"
                  required
                />
              </div>

              {editError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {editError}
                </div>
              )}

              {editSuccess && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                  {editSuccess}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditDialog(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a2a5b] text-white rounded hover:bg-[#16224a]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h3 className="text-2xl font-semibold">Order Details</h3>
              <button
                onClick={() => setShowOrderDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <div className="p-6">
              {loadingOrderDetails ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading order details...</p>
                </div>
              ) : selectedOrder ? (
                <>
                  {/* Order Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Order ID</p>
                        <p className="font-semibold">#{selectedOrder.order_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-semibold">
                          {new Date(selectedOrder.time_created).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Service Type</p>
                        <p className="font-semibold">{selectedOrder.service_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          selectedOrder.order_status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {selectedOrder.order_status}
                        </span>
                      </div>
                      {selectedOrder.address && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Delivery Address</p>
                          <p className="font-semibold">{selectedOrder.address}</p>
                        </div>
                      )}
                      {selectedOrder.note && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Note</p>
                          <p className="font-semibold">{selectedOrder.note}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3">Ordered Items</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <img
                            src={`http://localhost:8000/media/${item.image}`}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.price.toLocaleString()} VND × {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {(item.price * item.quantity).toLocaleString()} VND
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-xl">
                        {selectedOrder.total_price.toLocaleString()} VND
                      </span>
                    </div>
                  </div>

                  {/* Feedback Section */}
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold mb-3">Your Feedback</h4>
                    {orderFeedback ? (
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-600">Rating:</span>
                          <span className="text-xl">{getRatingStars(orderFeedback.rating)}</span>
                        </div>
                        {orderFeedback.comment && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Comment:</p>
                            <p className="text-gray-800 mt-1">{orderFeedback.comment}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted on {new Date(orderFeedback.time_created).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-gray-600 mb-3">No feedback submitted for this order yet</p>
                        <button
                          onClick={() => {
                            setShowOrderDetails(false);
                            navigate('/feedback');
                          }}
                          className="bg-[#1a2a5b] text-white px-4 py-2 rounded hover:bg-[#16224a]"
                        >
                          Submit Feedback
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-red-600">Failed to load order details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
