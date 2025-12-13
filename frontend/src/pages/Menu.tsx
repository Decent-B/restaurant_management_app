import Layout from "../components/Layout";
import FoodItem from "../components/FoodItem";
import { useState, useEffect } from "react";

// Define the API response data structures
interface ApiMenu {
  id: number;
  name: string;
  description: string;
  image: string;
}

interface ApiMenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  menu: number; // This refers to the menu ID
  image: string;
}

// Define the display data structure (for compatibility with existing UI)
interface FoodCategory {
  id: number;
  name: string;
  description: string;
  image: string;
  items: {
    id: number;
    name: string;
    price: string;
    image: string;
    description: string;
  }[];
}

export default function Menu() {
  const [menuCategories, setMenuCategories] = useState<FoodCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Dummy menu data for error state
  const dummyMenuCategories: FoodCategory[] = [
    {
      id: 1,
      name: "Appetizers",
      description: "Start your meal with our delicious appetizers",
      image: "/dishes/appetizers.jpg",
      items: [
        {
          id: 1,
          name: "Spring Rolls",
          price: "$8.99",
          image: "/dishes/spring-rolls.jpg",
          description: "Fresh vegetables and herbs wrapped in rice paper with a sweet chili dipping sauce."
        },
        {
          id: 2,
          name: "Garlic Bread",
          price: "$5.99",
          image: "/dishes/garlic-bread.jpg",
          description: "Warm baguette with garlic butter and herbs."
        },
        {
          id: 3,
          name: "Chicken Wings",
          price: "$10.99",
          image: "/dishes/chicken-wings.jpg",
          description: "Crispy wings tossed in your choice of sauce: Buffalo, BBQ, or Honey Garlic."
        },
        {
          id: 4,
          name: "Calamari",
          price: "$11.99",
          image: "/dishes/calamari.jpg",
          description: "Lightly breaded squid served with marinara sauce and lemon."
        },
      ]
    },
    {
      id: 2,
      name: "Main Courses",
      description: "Hearty and satisfying main dishes",
      image: "/dishes/main-courses.jpg",
      items: [
        {
          id: 5,
          name: "Grilled Salmon",
          price: "$22.99",
          image: "/dishes/grilled-salmon.jpg",
          description: "Fresh salmon fillet grilled with lemon herb butter, served with seasonal vegetables."
        },
        {
          id: 6,
          name: "Pasta Carbonara",
          price: "$18.99",
          image: "/dishes/pasta-carbonara.jpg",
          description: "Al dente pasta with creamy sauce, pancetta, and parmesan cheese."
        },
        {
          id: 7,
          name: "Beef Tenderloin",
          price: "$29.99",
          image: "/dishes/beef-tenderloin.jpg",
          description: "8oz beef tenderloin cooked to your preference, served with mashed potatoes and roasted vegetables."
        },
        {
          id: 8,
          name: "Chicken Parmesan",
          price: "$19.99",
          image: "/dishes/chicken-parmesan.jpg",
          description: "Breaded chicken breast topped with marinara sauce and melted mozzarella, served with spaghetti."
        },
      ]
    },
    {
      id: 3,
      name: "Desserts",
      description: "Sweet endings to your perfect meal",
      image: "/dishes/desserts.jpg",
      items: [
        {
          id: 9,
          name: "Chocolate Cake",
          price: "$7.99",
          image: "/dishes/chocolate-cake.jpg",
          description: "Rich chocolate cake with a molten center, served with vanilla ice cream."
        },
        {
          id: 10,
          name: "Cheesecake",
          price: "$6.99",
          image: "/dishes/cheesecake.jpg",
          description: "Creamy New York style cheesecake with berry compote."
        },
        {
          id: 11,
          name: "Tiramisu",
          price: "$8.99",
          image: "/dishes/tiramisu.jpg",
          description: "Coffee-flavored Italian dessert made of ladyfingers dipped in coffee, layered with mascarpone cheese."
        },
        {
          id: 12,
          name: "Apple Pie",
          price: "$6.99",
          image: "/dishes/apple-pie.jpg",
          description: "Warm apple pie with a flaky crust, served with a scoop of vanilla ice cream."
        },
      ]
    },
  ];

  // Filter function for menu items
  const filterMenuItems = (categories: FoodCategory[], searchTerm: string): FoodCategory[] => {
    if (!searchTerm.trim()) {
      return categories;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    return categories
      .map(category => ({
        ...category,
        items: category.items.filter(item => 
          item.name.toLowerCase().includes(lowerSearchTerm) ||
          item.description.toLowerCase().includes(lowerSearchTerm)
        )
      }))
      .filter(category => category.items.length > 0); // Only show categories that have matching items
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFilteredCategories(filterMenuItems(menuCategories, value));
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    setFilteredCategories(menuCategories);
  };

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch menus and menu items in parallel
        const { menuAPI } = await import('../api/endpoints');
        const [menus, menuItems] = await Promise.all([
          menuAPI.listMenus(),
          menuAPI.listMenuItems()
        ]);

        // Transform and associate items with their respective menus
        const categorizedMenus: FoodCategory[] = menus.map(menu => {
          // Find all items that belong to this menu
          const menuItemsForCategory = menuItems
            .filter(item => item.menu === menu.id)
            .map(item => ({
              id: item.id,
              name: item.name,
              price: `${item.price} vnd`,
              image: item.image,
              description: item.description
            }));

          return {
            id: menu.id,
            name: menu.name,
            description: menu.description,
            image: menu.image,
            items: menuItemsForCategory
          };
        });

        setMenuCategories(categorizedMenus);
        setFilteredCategories(categorizedMenus);
      } catch (err) {
        console.error('Error fetching menu data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load menu data');
        // Set dummy data when there's an error
        setMenuCategories(dummyMenuCategories);
        setFilteredCategories(dummyMenuCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // Update filtered categories when menu categories change
  useEffect(() => {
    setFilteredCategories(filterMenuItems(menuCategories, searchTerm));
  }, [menuCategories, searchTerm]);

  // Loading state
  if (loading) {
    return (
      <Layout title="Menu | Cooking Mama">
        <div className="bg-[#f8f5f0] min-h-screen py-16">
          <div className="w-full">
            <h1 className="lg:text-6xl text-4xl font-bold text-center mb-16 text-gray-800">Menu</h1>
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-800"></div>
              <span className="ml-4 text-xl text-gray-600">Loading menu...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Main content (displays both real data and dummy data with error message)
  return (
    <Layout title="Menu | Cooking Mama">
      <div className="bg-[#f8f5f0] min-h-screen py-16">
        <div className="w-full">
          <h1 className="lg:text-6xl text-4xl font-bold text-center mb-8 text-gray-800">Menu</h1>
          
          {/* Error message displayed under header when there's an error */}
          {error && (
            <div className="max-w-4xl mx-auto mb-8 px-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-red-800">
                      <strong>Unable to load live menu data.</strong> The menu shown below is a fallback version. {error}
                    </div>
                  </div>
                  <div className="ml-auto pl-3">
                    <button 
                      onClick={() => window.location.reload()} 
                      className="bg-red-100 hover:bg-red-200 text-red-800 text-xs px-3 py-1 rounded-md transition duration-200"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto mb-12 px-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search menu items..."
                className="w-full pl-12 pr-12 py-4 text-lg text-gray-600 border border-gray-300 rounded-full bg-white shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600 text-center">
                {filteredCategories.reduce((total, category) => total + category.items.length, 0)} item(s) found for "{searchTerm}"
              </div>
            )}
          </div>
          
          {/* Menu Categories */}
          {filteredCategories.length === 0 ? (
            <div className="text-center text-gray-600 text-xl">
              {searchTerm ? `No menu items found for "${searchTerm}"` : "No menu items available at the moment."}
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="mb-16">
                <div className="flex items-center justify-between mb-6">
                  <div className="lg:pl-32 pl-4">
                    <h2 className="lg:text-4xl text-2xl font-semibold text-gray-800 mb-2">
                      {category.name}
                      {searchTerm && (
                        <span className="text-lg text-gray-500 ml-2">
                          ({category.items.length} item{category.items.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </h2>
                    {category.description && (
                      <p className="text-gray-600 text-lg">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
                
                {category.items.length === 0 ? (
                  <div className="lg:px-32 px-4 text-gray-500 text-center py-8">
                    No items available in this category.
                  </div>
                ) : (
                  <div 
                    id={`scroll-${category.name}`} 
                    className="flex overflow-x-auto pb-6 lg:px-32 px-4 gap-6 scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {category.items.map((item) => (
                      <FoodItem
                        key={item.id}
                        name={item.name}
                        price={item.price}
                        image={item.image}
                        description={item.description}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}