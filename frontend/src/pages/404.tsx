import Layout from "../components/Layout";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <Layout title="Page Not Found | Cozy Kitchen">
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-xl text-gray-600 mb-8">
          The page you are looking for might have been removed or is temporarily unavailable.
        </p>
        <Link to="/" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300">
          Return to Home
        </Link>
      </div>
    </Layout>
  );
}