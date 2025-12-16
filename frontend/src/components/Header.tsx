import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  transparent?: boolean;
}

export default function Header({ transparent = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  // if (user) {
  //   alert(`Welcome back, ${user.role}!`);
  // } else {
  //   alert("Welcome to Cozy Kitchen!");
  // }
  
  useEffect(() => {
    if (!transparent) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > window.innerHeight - 80);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparent]);
  
  const headerClasses = transparent 
    ? `fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white text-gray-800 shadow-md' 
          : 'bg-transparent text-white'
      }`
    : 'sticky top-0 w-full z-50 bg-gray-800 text-white';

  const renderUserLink = () => {
    let label = "Login";
    let path = "/login";

    if (user) {
      switch (user.role) {
        case "Customer":  // Fixed: backend returns "Customer" not "Diner"
          label = "Profile";
          path = "/profile";
          break;
        case "Staff":
          label = "Order Management";
          path = "/staff/orders";
          break;
        case "Manager":
          label = "Settings";
          path = "/settings";
          break;
        default:
          label = "Login";
          path = "/login";
      }
    }

    // alert(`label: ${label}, path: ${path}`);
    return (
      <li>
        <Link
          to={path}
          className={`hover:${isScrolled ? "text-gray-600" : "text-gray-300"}`}
        >
          {label}
        </Link>
      </li>
    );
  };
  
  const renderNavigation = () => {
    if (!user) {
      // Not logged in - show default navigation
      return (
        <>
          <li><Link to="/" className={`hover:${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>Home</Link></li>
          <li><Link to="/menu" className={`hover:${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>Menu</Link></li>
          <li><Link to="/order" className={`hover:${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>Order</Link></li>
          {renderUserLink()}
        </>
      );
    }

    // Logged in - role-specific navigation
    switch (user.role) {
      case "Customer":
        return (
          <>
            <li><Link to="/" className={`hover:${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>Home</Link></li>
            <li><Link to="/menu" className={`hover:${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>Menu</Link></li>
            <li><Link to="/order" className={`hover:${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>Order</Link></li>
            {renderUserLink()}
          </>
        );
      
      case "Staff":
        return (
          <>
            <li><Link to="/staff/orders" className={`hover:${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>Order Management</Link></li>
            <li><Link to="/profile" className={`hover:${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>Profile</Link></li>
          </>
        );
      
      case "Manager":
        return (
          <>
            <li><Link to="/settings" className={`hover:${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>Settings</Link></li>
          </>
        );
      
      default:
        return (
          <>
            <li><Link to="/" className={`hover:${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>Home</Link></li>
            <li><Link to="/menu" className={`hover:${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>Menu</Link></li>
            <li><Link to="/order" className={`hover:${isScrolled ? 'text-gray-600' : 'text-gray-300'}`}>Order</Link></li>
            {renderUserLink()}
          </>
        );
    }
  };
  
  return (
    <header className={`py-6 px-12 ${headerClasses}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-3xl font-bold">Cozy Kitchen</Link>
        </div>
        
        <nav className="hidden md:block">
          <ul className="flex xl:space-x-24 space-x-14 text-xl">
            {renderNavigation()}
          </ul>
        </nav>
        
        <button 
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden">
          <ul className="flex flex-col space-y-2 mt-2 text-right">
            {renderNavigation()}
          </ul>
        </div>
      )}
    </header>
  );
}