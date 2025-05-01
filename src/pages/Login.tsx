import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Package, User, Lock } from 'lucide-react';

// Mock users for demo
const MOCK_USERS = [
  { id: '1', name: 'Demo Admin', role: 'stock-manager', password: 'admin' },
  { id: '2', name: 'Demo Staff', role: 'sales-staff', password: 'staff' }
];

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Username and password are required');
      return;
    }
    
    // For demo purposes, use hardcoded credentials
    const user = MOCK_USERS.find(
      user => 
        (user.name.toLowerCase() === username.toLowerCase() || 
         username.toLowerCase() === user.role) && 
        user.password === password
    );
    
    if (user) {
      login({
        id: user.id,
        name: user.name,
        role: user.role as 'stock-manager' | 'sales-staff'
      });
      navigate('/');
    } else {
      setError('Invalid credentials');
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-indigo-600 text-white w-16 h-16 flex items-center justify-center rounded-full mb-4">
            <Package size={32} />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">StockTrack</CardTitle>
          <CardDescription>
            Inventory Management for Retail Stores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                  Username
                </label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  leftIcon={<User className="h-5 w-5 text-slate-400" />}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  leftIcon={<Lock className="h-5 w-5 text-slate-400" />}
                />
              </div>
              <div className="pt-2">
                <Button className="w-full" type="submit">
                  Log In
                </Button>
              </div>
            </div>
          </form>
          
          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-500 mb-3">For demo purposes, use:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setUsername('Demo Admin');
                  setPassword('admin');
                }}
                className="p-2 text-left text-sm border border-slate-200 rounded hover:bg-slate-50"
              >
                <div className="font-medium">Admin</div>
                <div className="text-xs text-slate-500">Password: admin</div>
              </button>
              <button
                onClick={() => {
                  setUsername('Demo Staff');
                  setPassword('staff');
                }}
                className="p-2 text-left text-sm border border-slate-200 rounded hover:bg-slate-50"
              >
                <div className="font-medium">Staff</div>
                <div className="text-xs text-slate-500">Password: staff</div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};