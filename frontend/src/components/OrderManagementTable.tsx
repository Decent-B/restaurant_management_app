import { useState, useEffect } from "react";

interface Order {
  order_id: number,
  diner_id: number,
  status: string,
  service_type: string,
  total_price: number,
  time_created: string,
  items_count: number,
}

interface OrderManagementTableProps {
  className?: string;
}

export default function OrderManagementTable({ className = "" }: OrderManagementTableProps) {
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingOrder, setIsAddingOrder] = useState<boolean>(false);
  const [isRemovingOrders, setIsRemovingOrders] = useState<boolean>(false);

  const [orders, setOrders] = useState<Order[]>([])
  const fetchOrders = async () => {
      try {
        const { ordersAPI } = await import('../api/endpoints');
        const data: any = await ordersAPI.getAllOrders();
        if (data.status === "success") {
          setOrders(data.orders);
        } else {
          alert("Failed to fetch orders");
        }
      } catch (error: any) {
        console.error("Error fetching orders info:", error);
        alert(`Error: ${error.message}`);
      }
    };

  useEffect(() => {
    fetchOrders();
  }, []); 
  alert(orders.length)
  // Handle order selection
  const handleSelectOrder = (orderId: number) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(order_id => order_id !== orderId)
        : [...prev, orderId]
    );
  };

  // Handle select all orders
  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.order_id));
    }
  };

  // Add new order via API
  const handleAddOrder = async () => {
    try {
      setIsAddingOrder(true);
      setError(null);

      const response = await fetch('http://localhost:8000/api/orders/diner/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          // Add required fields for creating an order
          // You may need to adjust these based on your API requirements
          service_type: 'Dine-in',
          items: [], // Empty items array or populate with default items
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create order: ${response.status}`);
      }

      const newOrder: Order = await response.json();
      setOrders(prev => [newOrder, ...prev]);
      
      // Show success message or handle as needed
      console.log('Order created successfully:', newOrder);
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsAddingOrder(false);
    }
  };

  // Remove selected orders via API - DEPRECATEDLY DEPRECATED
  const handleRemoveOrders = async () => {
    if (selectedOrders.length === 0) {
      alert("Please select orders to remove");
      return;
    }
    
    if (!confirm(`Are you sure you want to remove ${selectedOrders.length} order(s)?`)) {
      return;
    }

    try {
      setIsRemovingOrders(true);
      setError(null);

      // Remove orders one by one
      const deletePromises = selectedOrders.map(orderId =>
        fetch(`http://localhost:8000/api/orders/diner/${orderId}/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })
      );

      const results = await Promise.allSettled(deletePromises);
      
      // Check for failed deletions
      const failedDeletions = results.filter((result, index) => {
        if (result.status === 'rejected') return true;
        if (result.status === 'fulfilled' && !result.value.ok) return true;
        return false;
      });

      if (failedDeletions.length > 0) {
        throw new Error(`Failed to delete ${failedDeletions.length} order(s)`);
      }

      // Remove successfully deleted orders from state
      setOrders(prev => prev.filter(order => !selectedOrders.includes(order.order_id)));
      setSelectedOrders([]);
      
      console.log(`Successfully removed ${selectedOrders.length} order(s)`);
    } catch (err) {
      console.error('Error removing orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove orders');
    } finally {
      setIsRemovingOrders(false);
    }
  };

  // Get status color for badges
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Preparing': return 'bg-blue-100 text-blue-800';
      case 'Ready': return 'bg-green-100 text-green-800';
      case 'Delivered': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={`bg-white overflow-hidden ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-1">Manage and track all restaurant orders</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleAddOrder}
              disabled={isAddingOrder}
              className="px-4 py-2 bg-[#1e2a59] text-white rounded-lg hover:bg-blue-800 transition duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{isAddingOrder ? "Adding..." : "Add Order"}</span>
            </button>
            {/* <button
              onClick={handleRemoveOrders}
              disabled={selectedOrders.length === 0 || isRemovingOrders}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>
                {isRemovingOrders ? "Removing..." : `Remove (${selectedOrders.length})`}
              </span>
            </button> */}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <div className="text-sm text-red-800">{error}</div>
            </div>
            <div className="ml-auto pl-3">
              <button 
                onClick={fetchOrders} 
                className="bg-red-100 hover:bg-red-200 text-red-800 text-xs px-3 py-1 rounded-md transition duration-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          <span className="ml-4 text-lg text-gray-600">Loading orders...</span>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diner ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.order_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.order_id)}
                          onChange={() => handleSelectOrder(order.order_id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{order.diner_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.service_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.total_price} vnd
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.time_created)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.items_count}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Showing {orders.length} orders</span>
              <span>{selectedOrders.length} selected</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}