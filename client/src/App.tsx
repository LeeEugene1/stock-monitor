import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { AccountDetailPage } from './pages/AccountDetailPage';
import { AutoBuyPage } from './pages/AutoBuyPage';
import { AccountsPage } from './pages/AccountsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/portfolio/:accountId" element={<AccountDetailPage />} />
          <Route path="/auto-buy" element={<AutoBuyPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
