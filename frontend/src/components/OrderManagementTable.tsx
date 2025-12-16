import { useState, useEffect } from "react";
import { ordersAPI } from "../api/endpoints";

interface OrderItem {
  menu_item__name: string;
  quantity: number;
  menu_item__description: string;
}

interface Order {
  order_id: number;
  diner_id: number;
  diner_name: string;
  status: string;
  service_type: string;
  total_price: string;
  note: string;
  time_created: string;
  items: OrderItem[];
}

interface OrderManagementTableProps {
  className?: string;
}

export default function OrderManagementTable({ className = "" }: OrderManagementTableProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [processingOrder, setProcessingOrder] = useState<number | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  
  // Payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState<boolean>(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: any = await ordersAPI.getKitchenOrders();
      if (data.status === "success") {
        setOrders(data.orders || []);
      } else {
        setError(data.message || "Failed to fetch pending orders");
      }
    } catch (error: any) {
      setError(error.message || "Error fetching pending orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      setProcessingOrder(orderId);
      const data = await ordersAPI.updateOrderStatus(orderId, "CANCELLED");
      
      if (data.status === "success") {
        // Remove from list
        setOrders(prev => prev.filter(order => order.order_id !== orderId));
      } else {
        alert(data.message || "Failed to cancel order");
      }
    } catch (error: any) {
      alert("Error cancelling order: " + error.message);
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleMakePayment = (order: Order) => {
    setSelectedOrderForPayment(order);
    setShowPaymentDialog(true);
  };

  const handleCashPayment = async () => {
    if (!selectedOrderForPayment) return;
    
    try {
      setProcessingOrder(selectedOrderForPayment.order_id);
      const data = await ordersAPI.processPayment(selectedOrderForPayment.order_id, "CASH");
      
      if (data.status === "success") {
        alert("Cash payment confirmed!");
        // Remove from pending orders list
        setOrders(prev => prev.filter(order => order.order_id !== selectedOrderForPayment.order_id));
        setShowPaymentDialog(false);
        setSelectedOrderForPayment(null);
      } else {
        alert(data.message || "Failed to process payment");
      }
    } catch (error: any) {
      alert("Error processing payment: " + error.message);
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleOnlineBankingPayment = async () => {
    if (!selectedOrderForPayment) return;
    
    try {
      setProcessingOrder(selectedOrderForPayment.order_id);
      const data = await ordersAPI.processPayment(selectedOrderForPayment.order_id, "ONLINE_BANKING");
      
      if (data.status === "success" && data.qr_code_data) {
        setQrCodeData(data.qr_code_data);
        setQrCodeImage(data.qr_code_image || null);
      } else {
        alert(data.message || "Failed to generate QR code");
      }
    } catch (error: any) {
      alert("Error generating QR code: " + error.message);
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: 'PENDING' | 'PREPARING' | 'READY') => {
    try {
      setProcessingOrder(orderId);
      const data = await ordersAPI.updateOrderStatus(orderId, newStatus);
      
      if (data.status === "success") {
        // Update local state
        setOrders(prev => prev.map(order => 
          order.order_id === orderId 
            ? { ...order, status: newStatus }
            : order
        ));
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (error: any) {
      alert("Error updating status: " + error.message);
    } finally {
      setProcessingOrder(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p className="font-medium">Error loading orders</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No pending orders</h3>
        <p className="mt-1 text-sm text-gray-500">All orders have been processed.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {orders.map((order) => {
          const isExpanded = expandedOrders.has(order.order_id);
          return (
            <div key={order.order_id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              {/* Order Header - Collapsible */}
              <div 
                className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleOrderExpansion(order.order_id)}
              >
                <div className="flex items-center space-x-4 flex-1">
                  {/* Expand/Collapse Icon */}
                  <svg 
                    className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>

                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        Order #{order.order_id}
                      </h3>
                      
                      {/* Status Toggle Buttons (for active orders) */}
                      {(order.status === 'PENDING' || order.status === 'PREPARING' || order.status === 'READY') && (
                        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleStatusChange(order.order_id, 'PENDING')}
                            disabled={processingOrder === order.order_id}
                            className={`px-3 py-1 text-xs font-medium rounded border-2 transition-all ${
                              order.status === 'PENDING'
                                ? 'bg-yellow-500 text-white border-yellow-500'
                                : 'bg-white text-yellow-600 border-yellow-500 hover:bg-yellow-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Pending
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.order_id, 'PREPARING')}
                            disabled={processingOrder === order.order_id}
                            className={`px-3 py-1 text-xs font-medium rounded border-2 transition-all ${
                              order.status === 'PREPARING'
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-blue-600 border-blue-500 hover:bg-blue-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Preparing
                          </button>
                          <button
                            onClick={() => handleStatusChange(order.order_id, 'READY')}
                            disabled={processingOrder === order.order_id}
                            className={`px-3 py-1 text-xs font-medium rounded border-2 transition-all ${
                              order.status === 'READY'
                                ? 'bg-green-500 text-white border-green-500'
                                : 'bg-white text-green-600 border-green-500 hover:bg-green-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Ready
                          </button>
                        </div>
                      )}
                      
                      {/* Static Status Badge (for completed/cancelled orders) */}
                      {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.diner_name} • {order.service_type} • {formatTime(order.time_created)}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-right mr-4">
                    <p className="text-lg font-bold text-gray-900">
                      {parseFloat(order.total_price).toLocaleString()} VND
                    </p>
                  </div>
                </div>

                {/* Action Buttons - Always Visible */}
                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleCancelOrder(order.order_id)}
                    disabled={processingOrder === order.order_id}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Cancel Order"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  <button
                    onClick={() => handleMakePayment(order)}
                    disabled={processingOrder === order.order_id}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Make Payment"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Pay
                  </button>
                </div>
              </div>

              {/* Expanded Content - Order Items */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items:</h4>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start bg-white p-3 rounded border border-gray-200">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {item.quantity}x {item.menu_item__name}
                          </p>
                          {item.menu_item__description && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.menu_item__description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Note */}
                  {order.note && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Note:</span> {order.note}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Dialog */}
      {showPaymentDialog && selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment for Order #{selectedOrderForPayment.order_id}
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentDialog(false);
                    setSelectedOrderForPayment(null);
                    setQrCodeData(null);
                    setQrCodeImage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600">Customer: {selectedOrderForPayment.diner_name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  Total: {parseFloat(selectedOrderForPayment.total_price).toLocaleString()} VND
                </p>
              </div>

              {!qrCodeData ? (
                <div className="space-y-3">
                  <button
                    onClick={handleOnlineBankingPayment}
                    disabled={processingOrder === selectedOrderForPayment.order_id}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Generate QR Code (Online Banking)
                  </button>
                  <button
                    onClick={handleCashPayment}
                    disabled={processingOrder === selectedOrderForPayment.order_id}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Confirm Cash Payment
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-4 p-6 bg-gray-100 rounded-lg">
                    <div className="bg-white p-4 inline-block rounded">
                      {qrCodeImage ? (
                        <img 
                          src={`http://localhost:8000${qrCodeImage}`} 
                          alt="QR Code for Payment" 
                          className="w-64 h-64 object-contain"
                        />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center border-2 border-gray-300 rounded">
                          <div className="text-center">
                            <svg className="w-16 h-16 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            <p className="text-xs text-gray-500">QR Code</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Scan this QR code to complete payment</p>
                  <div className="bg-gray-50 p-3 rounded text-xs font-mono break-all text-gray-700 mb-4">
                    {qrCodeData}
                  </div>
                  <button
                    onClick={() => {
                      setShowPaymentDialog(false);
                      setSelectedOrderForPayment(null);
                      setQrCodeData(null);
                      setQrCodeImage(null);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
