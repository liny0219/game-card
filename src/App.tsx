
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { DataContextProvider } from './context/DataContext';
import { UserContextProvider } from './context/UserContext';
import { GameplayContextProvider } from './context/GameplayContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import GachaPage from './pages/GachaPage';
import CollectionPage from './pages/CollectionPage';
import StatisticsPage from './pages/StatisticsPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  // 生成统一的参数化路由
  const generateGameplayRoutes = (): React.ReactElement[] => {
    return [
      <Route key="gacha" path="/:gameplayType/gacha" element={<GachaPage />} />,
      <Route key="collection" path="/:gameplayType/collection" element={<CollectionPage />} />,
      <Route key="statistics" path="/:gameplayType/statistics" element={<StatisticsPage />} />,
      <Route key="history" path="/:gameplayType/history" element={<HistoryPage />} />,
      <Route key="admin-gameplay" path="/admin/:gameplayType" element={<AdminPage />} />
    ];
  };

  return (
    <QueryClientProvider client={queryClient}>
      <DataContextProvider>
        <UserContextProvider>
          <Router>
            <GameplayContextProvider>
              <div className="min-h-screen bg-gray-900">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    {/* 动态生成的玩法路由 */}
                    {generateGameplayRoutes()}
                    {/* 全局管理路由 */}
                    <Route path="/admin" element={<AdminPage />} />
                  </Routes>
                </main>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
              </div>
            </GameplayContextProvider>
          </Router>
        </UserContextProvider>
      </DataContextProvider>
    </QueryClientProvider>
  );
}

export default App; 