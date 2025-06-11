import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { InventoryLookup } from './pages/InventoryLookup';
import { BoxManagement } from './pages/BoxManagement';
import { SohUpload } from './pages/SohUpload';
import { UserManagement } from './pages/UserManagement';
import { Login } from './pages/Login';

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactNode; adminOnly?: boolean }> = ({ 
  element, 
  adminOnly = false 
}) => {
  const { isAuthenticated, isStockManager } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && !isStockManager) {
    return <Navigate to="/" />;
  }
  
  return <>{element}</>;
};

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <InventoryProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={<ProtectedRoute element={<Layout />} />}
            >
              <Route index element={<Dashboard />} />
              <Route path="inventory" element={<InventoryLookup />} />
              <Route path="boxes" element={<BoxManagement />} />
              <Route 
                path="upload" 
                element={<ProtectedRoute element={<SohUpload />} adminOnly />} 
              />
              <Route 
                path="users" 
                element={<ProtectedRoute element={<UserManagement />} adminOnly />} 
              />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </InventoryProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;