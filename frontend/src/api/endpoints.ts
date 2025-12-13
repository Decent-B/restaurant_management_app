// Centralized API service for the Restaurant Management System
// All API calls go through this file for consistency and maintainability

const API_BASE_URL = 'http://localhost:8000/api';

// Token management functions
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenManager = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Helper function to get authorization headers
function getAuthHeaders(): HeadersInit {
  const token = tokenManager.getAccessToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }
  return {};
}

// Helper function to refresh access token
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const formData = createFormData({ refresh: refreshToken });
    const response = await fetch(`${API_BASE_URL}/accounts/token/refresh/`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(TOKEN_KEY, data.access);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  // If refresh fails, clear tokens
  tokenManager.clearTokens();
  return false;
}

// Helper function to handle API responses with token refresh
async function handleResponse<T>(response: Response, retryFn?: () => Promise<Response>): Promise<T> {
  if (response.status === 401 && retryFn) {
    // Try to refresh token and retry the request
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newResponse = await retryFn();
      return handleResponse(newResponse);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Helper function to create FormData from object
function createFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });
  return formData;
}

// ===========================
// ACCOUNTS APIs
// ===========================

export const accountsAPI = {
  // Login endpoints
  staffLogin: async (username: string, password: string) => {
    const formData = createFormData({ username, password });
    const response = await fetch(`${API_BASE_URL}/accounts/staff/login/`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await handleResponse<any>(response);
    
    // Store JWT tokens
    if (data.success && data.access && data.refresh) {
      tokenManager.setTokens(data.access, data.refresh);
    }
    
    return data;
  },

  customerLogin: async (username: string, password: string) => {
    const formData = createFormData({ username, password });
    const response = await fetch(`${API_BASE_URL}/accounts/diner/login/`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = await handleResponse<any>(response);
    
    // Store JWT tokens
    if (data.success && data.access && data.refresh) {
      tokenManager.setTokens(data.access, data.refresh);
    }
    
    return data;
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/accounts/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    const data = await handleResponse(response);
    
    // Clear tokens on logout
    tokenManager.clearTokens();
    
    return data;
  },

  // Refresh access token
  refreshToken: async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const formData = createFormData({ refresh: refreshToken });
    const response = await fetch(`${API_BASE_URL}/accounts/token/refresh/`, {
      method: 'POST',
      body: formData,
    });
    const data = await handleResponse<{ access: string }>(response);
    
    // Update access token
    if (data.access) {
      localStorage.setItem(TOKEN_KEY, data.access);
    }
    
    return data;
  },

  // Get current user info (protected endpoint)
  getUserInfo: async () => {
    const makeRequest = () => fetch(`${API_BASE_URL}/accounts/protected/`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Get specific diner/customer info
  getDinerInfo: async (dinerId: number) => {
    const makeRequest = () => fetch(`${API_BASE_URL}/accounts/diner/info/?diner_id=${dinerId}`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Update user info (Manager can update any user, Customer can update self)
  updateUserInfo: async (userId: number, data: {
    name?: string;
    email?: string;
    phone_num?: string;
    password?: string;
  }) => {
    const formData = createFormData({ user_id: userId, ...data });
    const makeRequest = () => fetch(`${API_BASE_URL}/accounts/user/update/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: formData,
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Manager: Add new accounts
  addAccounts: async (accounts: Array<{
    name: string;
    email: string;
    phone_num: string;
    role: 'Customer' | 'Staff' | 'Manager';
    password: string;
  }>) => {
    const makeRequest = () => fetch(`${API_BASE_URL}/accounts/manager/add/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ accounts }),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Manager: Delete accounts
  deleteAccounts: async (userIds: number[]) => {
    const makeRequest = () => fetch(`${API_BASE_URL}/accounts/manager/remove/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ user_ids: userIds }),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Manager: Update user roles
  updateRoles: async (updates: Array<{ user_id: number; new_role: 'Customer' | 'Staff' | 'Manager' }>) => {
    const makeRequest = () => fetch(`${API_BASE_URL}/accounts/manager/update_role/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ updates }),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },
};

// ===========================
// MENU APIs
// ===========================

export const menuAPI = {
  // List all menus (PUBLIC - no auth required)
  listMenus: async () => {
    const response = await fetch(`${API_BASE_URL}/menu/menus/`, {
      method: 'GET',
      credentials: 'include',
    });
    return response.json();
  },

  // Get specific menu details (PUBLIC - no auth required)
  getMenu: async (menuId: number) => {
    const response = await fetch(`${API_BASE_URL}/menu/menus/${menuId}/`, {
      method: 'GET',
      credentials: 'include',
    });
    return response.json();
  },

  // List all menu items (PUBLIC - no auth required)
  listMenuItems: async () => {
    const response = await fetch(`${API_BASE_URL}/menu/menu-items/`, {
      method: 'GET',
      credentials: 'include',
    });
    return response.json();
  },

  // Get specific menu item details (PUBLIC - no auth required)
  getMenuItem: async (itemId: number) => {
    const response = await fetch(`${API_BASE_URL}/menu/menu-items/${itemId}/`, {
      method: 'GET',
      credentials: 'include',
    });
    return response.json();
  },

  // Filter menu items by menu (PUBLIC - no auth required)
  filterMenuItems: async (menuId: number) => {
    const response = await fetch(`${API_BASE_URL}/menu/menu-items/?menu_id=${menuId}`, {
      method: 'GET',
      credentials: 'include',
    });
    return response.json();
  },

  // Manager: Add menu items
  addMenuItems: async (items: Array<{
    name: string;
    price: number;
    description?: string;
    menu_id: number;
    image?: File;
  }>) => {
    // Note: For file uploads, we might need multipart/form-data
    const makeRequest = () => fetch(`${API_BASE_URL}/menu/items/add/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ items }),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Manager: Remove menu items
  removeMenuItems: async (itemIds: number[]) => {
    const makeRequest = () => fetch(`${API_BASE_URL}/menu/items/remove/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ item_ids: itemIds }),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },
};

// ===========================
// ORDERS APIs
// ===========================

export const ordersAPI = {
  // Submit a new order
  submitOrder: async (data: {
    diner_id: number;
    service_type: string;
    ordered_items: number[];
    quantities: number[];
    note?: string;
  }) => {
    const makeRequest = () => fetch(`${API_BASE_URL}/orders/submit/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Get specific order by ID
  getOrder: async (orderId: number) => {
    const makeRequest = () => fetch(`${API_BASE_URL}/orders/get_order/?order_id=${orderId}`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Get bill/invoice for an order
  getBill: async (orderId: number) => {
    const makeRequest = () => fetch(`${API_BASE_URL}/orders/get_bill/?order_id=${orderId}`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Get order status
  getOrderStatus: async (orderId: number) => {
    const makeRequest = () => fetch(`${API_BASE_URL}/orders/status/?order_id=${orderId}`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Get all orders for a specific diner
  getDinerOrders: async (dinerId: number) => {
    const makeRequest = () => fetch(`${API_BASE_URL}/orders/diner/?diner_id=${dinerId}`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Staff: Get all orders
  getAllOrders: async () => {
    const makeRequest = () => fetch(`${API_BASE_URL}/orders/all/`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Staff: Get kitchen orders (pending orders)
  getKitchenOrders: async () => {
    const makeRequest = () => fetch(`${API_BASE_URL}/orders/kitchen/`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Customer: Add item to existing order
  addOrderItem: async (orderId: number, itemId: number, quantity: number) => {
    const formData = createFormData({ order_id: orderId, item_id: itemId, quantity });
    const makeRequest = () => fetch(`${API_BASE_URL}/orders/items/add/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: formData,
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Customer: Remove item from order
  removeOrderItem: async (orderId: number, itemId: number, quantity: number) => {
    const formData = createFormData({ order_id: orderId, item_id: itemId, quantity });
    const makeRequest = () => fetch(`${API_BASE_URL}/orders/items/remove/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: formData,
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Customer: Add note to order
  addNote: async (orderId: number, note: string) => {
    const formData = createFormData({ order_id: orderId, note });
    const makeRequest = () => fetch(`${API_BASE_URL}/orders/note/add/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: formData,
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Customer: Choose service type
  chooseService: async (orderId: number, serviceType: string) => {
    const formData = createFormData({ order_id: orderId, service_type: serviceType });
    const makeRequest = () => fetch(`${API_BASE_URL}/orders/service/choose/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: formData,
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Customer: Update existing order
  updateOrder: async (orderId: number, data: {
    item_ids: number[];
    quantities: number[];
    note?: string;
  }) => {
    const formData = new FormData();
    formData.append('order_id', orderId.toString());
    data.item_ids.forEach(id => formData.append('item_ids', id.toString()));
    data.quantities.forEach(qty => formData.append('quantities', qty.toString()));
    if (data.note) formData.append('note', data.note);

    const makeRequest = () => fetch(`${API_BASE_URL}/orders/update/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: formData,
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Staff: Update order status
  updateOrderStatus: async (orderId: number, status: string) => {
    const formData = createFormData({ order_id: orderId, status });
    const makeRequest = () => fetch(`${API_BASE_URL}/orders/status/update/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: formData,
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Process payment for order
  processPayment: async (orderId: number, paymentMethod: 'CASH' | 'ONLINE_BANKING') => {
    const formData = createFormData({ order_id: orderId, payment_method: paymentMethod });
    const makeRequest = () => fetch(`${API_BASE_URL}/orders/pay/`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: formData,
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },
};

// ===========================
// REVIEWS APIs
// ===========================

export const reviewsAPI = {
  // List all feedbacks
  listFeedbacks: async () => {
    const makeRequest = () => fetch(`${API_BASE_URL}/reviews/feedbacks/`, {
      method: 'GET',
      credentials: 'include',
      headers: getAuthHeaders(),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Submit feedback for an order
  submitFeedback: async (data: {
    order: number;
    rating: number;
    comment?: string;
  }) => {
    const makeRequest = () => fetch(`${API_BASE_URL}/reviews/feedbacks/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },
};

// ===========================
// ANALYTICS APIs
// ===========================

export const analyticsAPI = {
  // Get rating analytics
  getRatingAnalytics: async (start: string, end: string) => {
    const startParam = encodeURIComponent(start);
    const endParam = encodeURIComponent(end);
    const makeRequest = () => fetch(
      `${API_BASE_URL}/analytics/rating/?start=${startParam}&end=${endParam}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      }
    );
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Get revenue analytics
  getRevenueAnalytics: async (start: string, end: string) => {
    const startParam = encodeURIComponent(start);
    const endParam = encodeURIComponent(end);
    const makeRequest = () => fetch(
      `${API_BASE_URL}/analytics/revenue/?start=${startParam}&end=${endParam}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      }
    );
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },

  // Get order count analytics
  getOrderCountAnalytics: async (start: string, end: string) => {
    const startParam = encodeURIComponent(start);
    const endParam = encodeURIComponent(end);
    const makeRequest = () => fetch(
      `${API_BASE_URL}/analytics/order-count/?start=${startParam}&end=${endParam}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      }
    );
    
    const response = await makeRequest();
    return handleResponse(response, makeRequest);
  },
};

// Export legacy functions for backward compatibility
export const login = async (type: 'staff' | 'diner', username: string, password: string) => {
  if (type === 'staff') {
    return accountsAPI.staffLogin(username, password);
  } else {
    return accountsAPI.customerLogin(username, password);
  }
};

export const logout = accountsAPI.logout;
export const getUserInfo = accountsAPI.getUserInfo;
