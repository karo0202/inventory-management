import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UserPlus, User, ShieldCheck, AlertTriangle } from 'lucide-react';

// Mock users for demo purposes
const mockUsers = [
  { id: '1', name: 'John Smith', role: 'stock-manager' },
  { id: '2', name: 'Jane Doe', role: 'sales-staff' },
  { id: '3', name: 'Robert Johnson', role: 'sales-staff' }
];

export const UserManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState(mockUsers);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'stock-manager' | 'sales-staff'>('sales-staff');
  
  // Check if user has permission
  if (!currentUser || currentUser.role !== 'stock-manager') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-600 mb-6">
          You don't have permission to access this page.
        </p>
        <Button 
          variant="primary" 
          onClick={() => window.location.href = '/'}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }
  
  const handleAddUser = () => {
    if (!newUserName) return;
    
    const newUser = {
      id: `user-${Date.now()}`,
      name: newUserName,
      role: newUserRole
    };
    
    setUsers([...users, newUser]);
    setNewUserName('');
    setNewUserRole('sales-staff');
    setShowAddUser(false);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <Button 
          onClick={() => setShowAddUser(true)}
          leftIcon={<UserPlus size={16} />}
        >
          Add User
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold mr-3">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{user.name}</h3>
                    <div className="flex items-center mt-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400 mr-1" />
                      <span className="text-xs text-slate-500">
                        {user.role === 'stock-manager' ? 'Stock Manager' : 'Sales Staff'}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === 'stock-manager' 
                    ? 'bg-indigo-100 text-indigo-800' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {user.role === 'stock-manager' ? 'Admin' : 'Staff'}
                </span>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                >
                  Edit
                </Button>
                {user.id !== currentUser?.id && (
                  <Button 
                    variant="danger" 
                    size="sm" 
                    className="flex-1"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 text-indigo-600 mr-2" />
                <span>Add New User</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <Input
                    placeholder="John Smith"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'stock-manager' | 'sales-staff')}
                  >
                    <option value="sales-staff">Sales Staff</option>
                    <option value="stock-manager">Stock Manager (Admin)</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <Button
                  variant="primary"
                  onClick={handleAddUser}
                  disabled={!newUserName}
                >
                  Add User
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddUser(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};