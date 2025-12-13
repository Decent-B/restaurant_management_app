import React, { useEffect, useState } from "react";
import {
  FaSmile, FaShoppingCart, FaSignOutAlt, FaGoogle
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

  const renderPanel = () => {
    switch (activePanel) {
      case "Personal Information":
        return (
          <>
            <h2 className="text-2xl font-semibold mb-6">Personal Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block font-semibold mb-1">First name</label>
                <input type="text" disabled className="w-full bg-gray-100 p-2 rounded" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Last name</label>
                <input type="text" value="Tran" disabled className="w-full bg-gray-100 p-2 rounded" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Nick name</label>
                <input type="text" disabled className="w-full bg-gray-100 p-2 rounded" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Phone number</label>
                <div className="flex">
                  <span className="bg-gray-200 px-3 py-2 rounded-l text-sm">(+84)</span>
                  <input type="text" disabled className="w-full bg-gray-100 p-2 rounded-r" />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Birthday</label>
                <input type="text" value="13/06/2002" disabled className="w-full bg-gray-100 p-2 rounded" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Gender</label>
                <select disabled className="w-full bg-gray-100 p-2 rounded">
                  <option>Female</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block font-semibold mb-1">Email address</label>
                <div className="flex">
                  <span className="bg-gray-200 px-3 py-2 rounded-l">
                    <FaGoogle />
                  </span>
                  <input type="text" disabled className="w-full bg-gray-100 p-2 rounded-r" />
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button className="bg-[#1a2a5b] text-white font-semibold py-2 px-6 rounded-full shadow-md hover:bg-[#16224a]">
                Edit Personal Information
              </button>
            </div>
          </>
        );

      case "Order History":
        if (loadingOrders) return <div>Loading order history...</div>;
        if (orderError) return <div className="text-red-600">Error: {orderError}</div>;

        return (
          <div>
            <h2 className="text-2xl font-semibold mb-6">🛒 Order History</h2>
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
                  {orders.map((order) => (
                    <tr key={order.order_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{order.order_id}</td>
                      <td className="px-4 py-2">{new Date(order.time_created).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{order.items_count}</td>
                      <td className="px-4 py-2">€ {Number(order.total_price).toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[#1a2a5b] hover:underline cursor-pointer">› View details</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <span className="font-semibold text-lg">Khanh Tran</span>
        </div>
        <div className="mt-6 space-y-2">
          <SidebarItem
            icon={FaSmile}
            label="Personal Information"
            active={activePanel === "Personal Information"}
            onClick={() => setActivePanel("Personal Information")}
          />
          <SidebarItem
            icon={FaShoppingCart}
            label="Order History"
            active={activePanel === "Order History"}
            onClick={() => setActivePanel("Order History")}
          />
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
    </div>
  );
}
