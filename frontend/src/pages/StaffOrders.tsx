import Layout from "../components/Layout";
import OrderManagementTable from "../components/OrderManagementTable";

export default function StaffOrders() {
  return (
    <Layout title="Order Management | Cozy Kitchen">
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 mt-2">Manage and track pending orders</p>
            </div>
            <OrderManagementTable />
          </div>
        </div>
      </div>
    </Layout>
  );
}
