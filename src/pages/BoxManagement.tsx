import React, { useState } from 'react';
import { Box, Plus, PackageOpen, Package, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { BoxCard } from '../components/inventory/BoxCard';
import { ProductCard } from '../components/inventory/ProductCard';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';

export const BoxManagement: React.FC = () => {
  const { boxes, createBox, getBoxById } = useInventory();
  const { isStockManager } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBoxName, setNewBoxName] = useState('');
  const [newBoxLocation, setNewBoxLocation] = useState('Back Store');
  
  const selectedBox = selectedBoxId ? getBoxById(selectedBoxId) : null;
  
  const filteredBoxes = searchQuery && boxes
    ? boxes.filter(box => 
        box && (
          box.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          box.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          box.location.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : boxes || [];
  
  const validBoxes = filteredBoxes.filter(box => box !== null && box !== undefined);
  
  const handleCreateBox = async () => {
    if (!newBoxName) return;
    
    await createBox({
      id: `BOX${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      name: newBoxName,
      location: newBoxLocation
    });
    
    setNewBoxName('');
    setNewBoxLocation('Back Store');
    setIsCreateModalOpen(false);
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Box Management</h1>
        {isStockManager && (
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus size={16} />}
          >
            Create New Box
          </Button>
        )}
      </div>
      
      <div className="mb-6">
        <Input
          placeholder="Search boxes by ID, name, or location"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-5 w-5 text-slate-400" />}
        />
      </div>
      
      {selectedBox ? (
        <div>
          <div className="mb-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedBoxId(null)}
            >
              Back to All Boxes
            </Button>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BoxCard className="h-5 w-5 text-indigo-600 mr-2" />
                <span>Box Details: {selectedBox.name} (#{selectedBox.id})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-slate-500">Location: {selectedBox.location}</p>
                <p className="text-slate-500">Total Items: {selectedBox.products?.length || 0}</p>
              </div>
              
              {(!selectedBox.products || selectedBox.products.length === 0) ? (
                <div className="p-4 bg-slate-50 rounded-md text-center">
                  <PackageOpen className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500">This box is empty.</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Box Contents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedBox.products.map(product => (
                      <ProductCard key={product.barcode} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>
          {validBoxes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Box className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No Boxes Found</h3>
                {searchQuery ? (
                  <p className="text-slate-500">
                    No boxes match your search criteria. Try a different search term.
                  </p>
                ) : (
                  <p className="text-slate-500">
                    You haven't created any boxes yet. Create one to start organizing your inventory.
                  </p>
                )}
                {isStockManager && !searchQuery && (
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Create Your First Box
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {validBoxes.map(box => (
                <BoxCard 
                  key={box.id} 
                  box={box} 
                  onViewDetails={(id) => setSelectedBoxId(id)} 
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Box</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Box Name
                  </label>
                  <Input
                    placeholder="e.g., Winter Collection"
                    value={newBoxName}
                    onChange={(e) => setNewBoxName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Location
                  </label>
                  <select
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newBoxLocation}
                    onChange={(e) => setNewBoxLocation(e.target.value)}
                  >
                    <option value="Main Store">Main Store</option>
                    <option value="Back Store">Back Store</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Storage Room">Storage Room</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <Button
                  variant="primary"
                  onClick={handleCreateBox}
                  disabled={!newBoxName}
                >
                  Create Box
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
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