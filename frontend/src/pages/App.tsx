import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

// Define the API response data structures
interface ApiMenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  menu: number;
  image: string;
}

// Define the display data structure for signature dishes
interface SignatureDish {
  id: number;
  name: string;
  price: string;
  image: string;
}

export default function App() {
  const [signatureDishes, setSignatureDishes] = useState<SignatureDish[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Dummy signature dishes for error state
  const dummySignatureDishes: SignatureDish[] = [
    { id: 1, name: "Truffle Pasta", price: "$24", image: "https://placehold.co/300" },
    { id: 2, name: "Wagyu Steak", price: "$45", image: "https://placehold.co/300" },
    { id: 3, name: "Lobster Risotto", price: "$38", image: "https://placehold.co/300" },
    { id: 4, name: "Matcha Tiramisu", price: "$12", image: "https://placehold.co/300" },
  ];

  useEffect(() => {
    const fetchSignatureDishes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch menu items from API
        const { menuAPI } = await import('../api/endpoints');
        const menuItems: ApiMenuItem[] = await menuAPI.listMenuItems();

        if (menuItems.length === 0) {
          throw new Error('No menu items available');
        }

        // Select 4 random items from the menu
        const shuffled = [...menuItems].sort(() => 0.5 - Math.random());
        const randomItems = shuffled.slice(0, 4);

        // Transform API data to signature dish format
        const dishes: SignatureDish[] = randomItems.map(item => ({
          id: item.id,
          name: item.name,
          price: `${item.price} vnd`,
          image: item.image
        }));

        setSignatureDishes(dishes);
      } catch (err) {
        console.error('Error fetching signature dishes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load signature dishes');
        // Set dummy data when there's an error
        setSignatureDishes(dummySignatureDishes);
      } finally {
        setLoading(false);
      }
    };

    fetchSignatureDishes();
  }, []);
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your subscription logic here
    console.log(`Subscribing email: ${email}`);
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
    setEmail("");
  };

  return (
    <Layout title="Home | Cooking Mama" transparentHeader={true}>
      {/* Background video */}
      <div className="h-screen w-full relative">
        <video className="h-full w-full object-cover opacity-60" autoPlay loop muted playsInline>
          <source src="/home.mp4" type="video/mp4"/>
        </video>
        <div className="absolute left-12 bottom-18">
          <div className="md:text-7xl text-5xl font-bold mb-6">Restaurant name&trade;</div>
          <div className="text-3xl font-semibold">Restaurant slogan.</div>
        </div>
      </div>
      
      {/* Menu preview */}
      <div className="py-20 px-4 md:px-8 bg-white">
        <div className="text-center text-gray-900 max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-3">Our Signature</h2>
          <p className="text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience our most celebrated dishes, crafted with passion and premium ingredients.
          </p>
          
          {/* Error message displayed under header when there's an error */}
          {error && (
            <div className="mb-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mx-auto">
                <div className="flex items-center justify-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-red-800">
                      <strong>Unable to load live menu data.</strong> Showing sample dishes. {error}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
              <span className="ml-4 text-lg text-gray-600">Loading signature dishes...</span>
            </div>
          ) : (
            <>
              {/* Signature dishes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {signatureDishes.map((dish) => (
                  <div key={dish.id} className="group rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl">
                    <div className="h-64 overflow-hidden relative">
                      <img 
                        src={dish.image} 
                        alt={dish.name} 
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          // Fallback image if the API image fails to load
                          e.currentTarget.src = '/dishes/placeholder.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-4 right-4 bg-white/90 px-4 py-1 rounded-full font-semibold text-gray-800">
                        {dish.price}
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <h3 className="text-lg font-bold text-gray-800">{dish.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  to="/menu" 
                  className="px-8 py-3 rounded-full border-2 border-gray-800 text-gray-800 font-semibold hover:bg-gray-800 hover:text-white transition-colors duration-300"
                >
                  View Full Menu
                </Link>
                <Link 
                  to="/order" 
                  className="px-8 py-3 rounded-full bg-[#1e2a59] text-white font-semibold hover:bg-blue-800 transition-colors duration-300"
                >
                  Order Now!
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact & Newsletter Banner */}
      <div className="bg-[#f8f5f0] py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
            {/* Left side - Contact Info */}
            <div className="w-full md:w-1/2">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Find Us</h3>
              
              <div className="space-y-8">
                {/* Location 1 */}
                <div className="flex gap-4">
                  <div className="mt-1 text-[#1e2a59]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">Mama Hai Ba Trung</h4>
                    <p className="text-gray-600">123 Hai Ba Trung, Hanoi</p>
                    <p className="text-gray-600 mt-1">+84 (243) 423-0978</p>
                    <p className="text-gray-500 text-sm mt-1">Open daily: 11:00 AM - 10:00 PM</p>
                  </div>
                </div>
                
                {/* Location 2 */}
                <div className="flex gap-4">
                  <div className="mt-1 text-[#1e2a59]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">Mama Bolsa</h4>
                    <p className="text-gray-600">69420 Bolsa Ave, Westminster, CA</p>
                    <p className="text-gray-600 mt-1">+1 (555) 987-6543</p>
                    <p className="text-gray-500 text-sm mt-1">Open daily: 11:30 AM - 11:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Newsletter */}
            <div className="w-full md:w-1/2 bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-2 text-gray-800">Stay Updated</h3>
              <p className="text-gray-600 mb-6">
                Subscribe to our newsletter for exclusive promotions, new menu items, and seasonal specials.
              </p>
              
              <form onSubmit={handleSubscribe}>
                <div className="flex flex-col sm:flex-row gap-3 text-gray-900">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    className="flex-grow px-5 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-[#1e2a59] focus:border-[#1e2a59] outline-none transition-all"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-full bg-[#1e2a59] text-white font-medium hover:bg-blue-800 transition-colors duration-300 whitespace-nowrap"
                  >
                    Subscribe
                  </button>
                </div>
                {subscribed && (
                  <div className="mt-4 text-green-600 text-sm">
                    Thank you for subscribing! We've sent a confirmation to your email.
                  </div>
                )}
              </form>
              
              <div className="mt-8 flex items-center text-gray-500">
                <div className="border-t border-gray-200 flex-grow"></div>
                <span className="mx-4">or follow us</span>
                <div className="border-t border-gray-200 flex-grow"></div>
              </div>
              
              {/* Social media icons */}
              <div className="flex justify-center gap-6 mt-6">
                {/* Facebook */}
                <a href="#" className="text-gray-400 hover:text-[#1e2a59] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a href="#" className="text-gray-400 hover:text-[#1e2a59] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                {/* Twitter */}
                <a href="#" className="text-gray-400 hover:text-[#1e2a59] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}