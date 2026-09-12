import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import PlaceOrderPage from './pages/PlaceOrderPage';
import PortfoliosPage from './pages/PortfoliosPage';
import OrderHistoryPage from './pages/OrderHistoryPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/orders/new" replace />} />
        <Route path="/orders/new" element={<PlaceOrderPage />} />
        <Route path="/orders" element={<OrderHistoryPage />} />
        <Route path="/portfolios" element={<PortfoliosPage />} />
        <Route path="*" element={<Navigate to="/orders/new" replace />} />
      </Routes>
    </Layout>
  );
}
