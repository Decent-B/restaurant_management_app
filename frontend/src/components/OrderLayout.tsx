import Layout from "./Layout";
import OrderHeader from "./OrderHeader";

type OrderLayoutProps = {
  children: React.ReactNode;
};

export default function OrderLayout({ children }: OrderLayoutProps) {
  return (
    <Layout title="Order | Cozy Kitchen">
      <OrderHeader />
      <main className="bg-[#e5ddce] min-h-screen">
        {children}
      </main>
    </Layout>
  );
}
