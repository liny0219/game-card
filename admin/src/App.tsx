import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { DataContextProvider } from './context/DataContext';
import { UserContextProvider } from './context/UserContext';
import { GameplayContextProvider } from './context/GameplayContext';
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
  return (
    <QueryClientProvider client={queryClient}>
      <DataContextProvider>
        <UserContextProvider>
          <Router>
            <GameplayContextProvider>
              <div className="min-h-screen bg-gray-900 text-white">
                <main className="container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<AdminPage />} />
                    <Route path="/:gameplayType" element={<AdminPage />} />
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