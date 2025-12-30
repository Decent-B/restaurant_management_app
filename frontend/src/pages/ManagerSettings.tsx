import { useState, useEffect } from "react";
import { FaUserTie, FaUser, FaChartBar, FaShoppingCart, FaSignOutAlt, FaBars, FaEdit, FaTrash, FaPlus, FaStar } from "react-icons/fa";
import { logout } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import OrderManagementTable from "../components/OrderManagementTable";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

// Types
interface User {
  id: number;
  name: string;
  email: string;
  phone_num: string;
  role: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  menu: number;
  image: string;
}

interface Menu {
  id: number;
  name: string;
  description: string;
}

interface Feedback {
  id: number;
  order_id: number | null;
  diner_id: number | null;
  diner_name: string;
  diner_email: string;
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

export default function ManagerSettings() {
  const [activePanel, setActivePanel] = useState("Staff Management");
  const navigate = useNavigate();
  const { user, fetchUser } = useAuth();

  // Staff Management state
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  // Customer Management state
  const [customerList, setCustomerList] = useState<User[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<User | null>(null);

  // Menu Management state
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [showMenuItemDialog, setShowMenuItemDialog] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  // Reviews Management state
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsSearch, setReviewsSearch] = useState("");
  const reviewsPerPage = 10;

  useEffect(() => {
    if (activePanel === "Staff Management") {
      fetchStaffList();
    } else if (activePanel === "Customers Management") {
      fetchCustomerList();
    } else if (activePanel === "Menus Management") {
      fetchMenus();
    } else if (activePanel === "Reviews Management") {
      setReviewsPage(1); // Reset pagination
      setReviewsSearch(""); // Clear search
      fetchFeedbacks();
    }
  }, [activePanel]);

  useEffect(() => {
    if (selectedMenu) {
      fetchMenuItems(selectedMenu);
    }
  }, [selectedMenu]);

  const fetchStaffList = async () => {
    setLoadingStaff(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/accounts/manager/list/?role=Staff', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.status === 'success') {
        setStaffList(data.users);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const fetchCustomerList = async () => {
    setLoadingCustomers(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/accounts/manager/list/?role=Customer', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.status === 'success') {
        setCustomerList(data.users);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchMenus = async () => {
    setLoadingMenus(true);
    try {
      const response = await fetch('http://localhost:8000/api/menu/menus/');
      const data = await response.json();
      setMenus(data);
      if (data.length > 0 && !selectedMenu) {
        setSelectedMenu(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching menus:', error);
    } finally {
      setLoadingMenus(false);
    }
  };

  const fetchMenuItems = async (menuId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/menu/menu-items/?menu=${menuId}`);
      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    setFeedbackError("");
    try {
      const { reviewsAPI } = await import('../api/endpoints');
      const data: any = await reviewsAPI.listFeedbacks();
      if (data.status === "success") {
        setFeedbacks(data.feedbacks);
      } else {
        setFeedbackError(data.message || "Failed to fetch feedbacks");
      }
    } catch (error: any) {
      setFeedbackError(error.message || "Error fetching feedbacks");
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoadingFeedbacks(false);
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

  const handleDeleteStaff = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('user_id', userId.toString());
      
      const response = await fetch('http://localhost:8000/api/accounts/manager/remove/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert('Staff member deleted successfully');
        fetchStaffList();
      } else {
        alert(data.message || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Error deleting staff member');
    }
  };

  const handleDeleteCustomer = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('user_id', userId.toString());
      
      const response = await fetch('http://localhost:8000/api/accounts/manager/remove/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert('Customer deleted successfully');
        fetchCustomerList();
      } else {
        alert(data.message || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error deleting customer');
    }
  };

  const handleDeleteMenuItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('item_id', itemId.toString());
      
      const response = await fetch('http://localhost:8000/api/menu/items/remove', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert('Menu item deleted successfully');
        if (selectedMenu) fetchMenuItems(selectedMenu);
      } else {
        alert(data.message || 'Failed to delete menu item');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Error deleting menu item');
    }
  };

  const handleSaveStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = editingStaff 
        ? 'http://localhost:8000/api/accounts/user/update/'
        : 'http://localhost:8000/api/accounts/manager/add/';
      
      if (editingStaff) {
        formData.append('user_id', editingStaff.id.toString());
      } else {
        formData.append('role', 'Staff');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert(editingStaff ? 'Staff member updated successfully' : 'Staff member added successfully');
        setShowStaffDialog(false);
        setEditingStaff(null);
        fetchStaffList();
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      alert('Error saving staff member');
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = editingCustomer 
        ? 'http://localhost:8000/api/accounts/user/update/'
        : 'http://localhost:8000/api/accounts/manager/add/';
      
      if (editingCustomer) {
        formData.append('user_id', editingCustomer.id.toString());
      } else {
        formData.append('role', 'Customer');
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert(editingCustomer ? 'Customer updated successfully' : 'Customer added successfully');
        setShowCustomerDialog(false);
        setEditingCustomer(null);
        fetchCustomerList();
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer');
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const token = localStorage.getItem('access_token');
      
      if (editingMenuItem) {
        // Update existing item
        formData.append('item_id', editingMenuItem.id.toString());
        const response = await fetch('http://localhost:8000/api/menu/items/update/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        const data = await response.json();
        if (data.status === 'success') {
          alert('Menu item updated successfully');
          setShowMenuItemDialog(false);
          setEditingMenuItem(null);
          if (selectedMenu) fetchMenuItems(selectedMenu);
        } else {
          alert(data.message || 'Failed to update menu item');
        }
      } else {
        // Add new item
        formData.append('menu_id', selectedMenu?.toString() || '');
        const response = await fetch('http://localhost:8000/api/menu/items/add/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        const data = await response.json();
        if (data.status === 'success') {
          alert('Menu item added successfully');
          setShowMenuItemDialog(false);
          setEditingMenuItem(null);
          if (selectedMenu) fetchMenuItems(selectedMenu);
        } else {
          alert(data.message || 'Failed to add menu item');
        }
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Error saving menu item');
    }
  };

  const handleLogout = async () => {
    try {
      const data = await logout();
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
      case "Staff Management":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Staff Management</h2>
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setShowStaffDialog(true);
                }}
                className="flex items-center gap-2 bg-[#1a2a5b] text-white px-4 py-2 rounded hover:bg-[#16224a]"
              >
                <FaPlus /> Add Staff
              </button>
            </div>
            
            {loadingStaff ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {staffList.map((staff) => (
                  <div key={staff.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{staff.name}</h3>
                        <p className="text-sm text-gray-600">{staff.email}</p>
                        <p className="text-sm text-gray-600">{staff.phone_num}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingStaff(staff);
                            setShowStaffDialog(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "Customers Management":
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Customers Management</h2>
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setShowCustomerDialog(true);
                }}
                className="flex items-center gap-2 bg-[#1a2a5b] text-white px-4 py-2 rounded hover:bg-[#16224a]"
              >
                <FaPlus /> Add Customer
              </button>
            </div>
            
            {loadingCustomers ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {customerList.map((customer) => (
                  <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                        <p className="text-sm text-gray-600">{customer.phone_num}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCustomer(customer);
                            setShowCustomerDialog(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "Menus Management":
        return (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Menus Management</h2>
            
            {/* Menu Tabs */}
            <div className="flex gap-2 mb-6 border-b">
              {menus.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => setSelectedMenu(menu.id)}
                  className={`px-4 py-2 font-medium ${
                    selectedMenu === menu.id
                      ? 'border-b-2 border-[#1a2a5b] text-[#1a2a5b]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {menu.name}
                </button>
              ))}
            </div>

            {/* Menu Items */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setEditingMenuItem(null);
                  setShowMenuItemDialog(true);
                }}
                className="flex items-center gap-2 bg-[#1a2a5b] text-white px-4 py-2 rounded hover:bg-[#16224a]"
              >
                <FaPlus /> Add Menu Item
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {menuItems.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="flex">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-32 h-32 object-cover"
                      />
                    )}
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                          <p className="text-lg font-bold text-[#1a2a5b] mt-2">{parseFloat(item.price).toLocaleString()} VND</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingMenuItem(item);
                              setShowMenuItemDialog(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case "Order Management":
        return (
          <div>
            <OrderManagementTable />
          </div>
        );
      
      case "Analytics":
        return (
          <div>
            <AnalyticsDashboard />
          </div>
        );

      case "Reviews Management":
        // Filter feedbacks based on search query
        const filteredFeedbacks = feedbacks.filter(feedback => {
          if (!reviewsSearch.trim()) return true;
          
          const searchLower = reviewsSearch.toLowerCase();
          const matchesOrderId = feedback.order_id?.toString().includes(searchLower);
          const matchesComment = feedback.comment?.toLowerCase().includes(searchLower);
          const matchesCustomer = 
            feedback.diner_name?.toLowerCase().includes(searchLower) ||
            feedback.diner_email?.toLowerCase().includes(searchLower);
          
          return matchesOrderId || matchesComment || matchesCustomer;
        });

        // Paginate filtered feedbacks
        const totalReviewsPages = Math.ceil(filteredFeedbacks.length / reviewsPerPage);
        const paginatedFeedbacks = filteredFeedbacks.slice(
          (reviewsPage - 1) * reviewsPerPage,
          reviewsPage * reviewsPerPage
        );

        return (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Customer Reviews</h2>
            
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by order ID, customer name/email, or comment..."
                  value={reviewsSearch}
                  onChange={(e) => {
                    setReviewsSearch(e.target.value);
                    setReviewsPage(1); // Reset to page 1 when searching
                  }}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {reviewsSearch && (
                <p className="text-sm text-gray-600 mt-2">
                  Found {filteredFeedbacks.length} review{filteredFeedbacks.length !== 1 ? 's' : ''}
                  {filteredFeedbacks.length !== feedbacks.length && ` (filtered from ${feedbacks.length} total)`}
                </p>
              )}
            </div>
            
            {loadingFeedbacks ? (
              <div className="text-center py-8">Loading reviews...</div>
            ) : feedbackError ? (
              <div className="text-center py-8 text-red-600">{feedbackError}</div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                {reviewsSearch ? 'No reviews match your search' : 'No reviews found'}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedFeedbacks.map((feedback) => (
                    <div key={feedback.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{feedback.diner_name}</h3>
                            <span className="text-2xl">{getRatingStars(feedback.rating)}</span>
                          </div>
                          <p className="text-sm text-gray-600">{feedback.diner_email}</p>
                          {feedback.order_id && (
                            <p className="text-sm text-gray-500 mt-1">Order #{feedback.order_id}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(feedback.time_created).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(feedback.time_created).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      {feedback.comment && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-gray-700">{feedback.comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {filteredFeedbacks.length > reviewsPerPage && (
                  <div className="flex items-center justify-between mt-6">
                    <button
                      onClick={() => setReviewsPage(prev => Math.max(1, prev - 1))}
                      disabled={reviewsPage === 1}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        reviewsPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#1a2a5b] text-white hover:bg-[#16224a]'
                      }`}
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {reviewsPage} of {totalReviewsPages}
                      <span className="text-gray-400 ml-2">({filteredFeedbacks.length} review{filteredFeedbacks.length !== 1 ? 's' : ''})</span>
                    </span>
                    <button
                      onClick={() => setReviewsPage(prev => Math.min(totalReviewsPages, prev + 1))}
                      disabled={reviewsPage >= totalReviewsPages}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        reviewsPage >= totalReviewsPages
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

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#eae2d0] font-sans text-gray-800">
      {/* Sidebar */}
      <div className="w-[280px] bg-white shadow-md rounded-xl m-4 flex flex-col py-6">
        <div className="flex flex-col items-center">
          <FaUserTie className="text-4xl mb-2 text-gray-700" />
          <span className="font-semibold text-lg">{user?.name || 'Manager'}</span>
          <span className="text-sm text-gray-500">{user?.role}</span>
        </div>
        <div className="mt-6 space-y-2">
          <SidebarItem
            icon={FaUserTie}
            label="Staff Management"
            active={activePanel === "Staff Management"}
            onClick={() => setActivePanel("Staff Management")}
          />
          <SidebarItem
            icon={FaUser}
            label="Customers Management"
            active={activePanel === "Customers Management"}
            onClick={() => setActivePanel("Customers Management")}
          />
          <SidebarItem
            icon={FaBars}
            label="Menus Management"
            active={activePanel === "Menus Management"}
            onClick={() => setActivePanel("Menus Management")}
          />
          <SidebarItem
            icon={FaShoppingCart}
            label="Order Management"
            active={activePanel === "Order Management"}
            onClick={() => setActivePanel("Order Management")}
          />
          <SidebarItem
            icon={FaChartBar}
            label="Analytics"
            active={activePanel === "Analytics"}
            onClick={() => setActivePanel("Analytics")}
          />
          <SidebarItem
            icon={FaStar}
            label="Reviews Management"
            active={activePanel === "Reviews Management"}
            onClick={() => setActivePanel("Reviews Management")}
          />
        </div>
        <div className="mt-auto px-4 pt-6">
          <button onClick={handleLogout} className="flex items-center gap-2 text-[#1a2a5b] font-semibold hover:underline">
            <FaSignOutAlt />
            Log out
          </button>
        </div>
      </div>

      {/* Main Content Panel */}
      <div className="flex-1 bg-white shadow-md rounded-xl m-4 px-8 py-6 overflow-auto">
        {renderPanel()}
      </div>

      {/* Staff Dialog */}
      {showStaffDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h3>
            <form onSubmit={handleSaveStaff}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingStaff?.name}
                    required={!editingStaff}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingStaff?.email}
                    required={!editingStaff}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone_num"
                    defaultValue={editingStaff?.phone_num}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                {!editingStaff && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-[#1a2a5b] text-white py-2 rounded hover:bg-[#16224a]"
                >
                  {editingStaff ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStaffDialog(false);
                    setEditingStaff(null);
                  }}
                  className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Dialog */}
      {showCustomerDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <form onSubmit={handleSaveCustomer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingCustomer?.name}
                    required={!editingCustomer}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingCustomer?.email}
                    required={!editingCustomer}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone_num"
                    defaultValue={editingCustomer?.phone_num}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                {!editingCustomer && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-[#1a2a5b] text-white py-2 rounded hover:bg-[#16224a]"
                >
                  {editingCustomer ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomerDialog(false);
                    setEditingCustomer(null);
                  }}
                  className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Item Dialog */}
      {showMenuItemDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
            <form onSubmit={handleSaveMenuItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingMenuItem?.name}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingMenuItem?.description}
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    defaultValue={editingMenuItem?.price}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    required={!editingMenuItem}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-[#1a2a5b] text-white py-2 rounded hover:bg-[#16224a]"
                >
                  {editingMenuItem ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuItemDialog(false);
                    setEditingMenuItem(null);
                  }}
                  className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
