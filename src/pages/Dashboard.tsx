import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PackageSearch, 
  PackageOpen, 
  AlertTriangle,
  ShoppingBag,
  ArrowRight,
  Package
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useInventory } from '../context/InventoryContext';
import { ProductCard } from '../components/inventory/ProductCard';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { products, boxes, getLowStockProducts } = useInventory();
  const [lowStockProducts, setLowStockProducts] = useState<typeof products>([]);
  
  useEffect(() => {
    setLowStockProducts(getLowStockProducts(5));
  }, [products, getLowStockProducts]);
  
  const totalInventory = products.reduce((sum, product) => sum + product.quantity, 0);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Button 
          onClick={() => navigate('/inventory')}
          rightIcon={<ArrowRight size={16} />}
        >
          Inventory Lookup
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 mb-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium">Total Inventory</h3>
              <Package className="h-7 w-7 sm:h-8 sm:w-8 opacity-80" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{totalInventory.toLocaleString()}</p>
            <p className="text-indigo-100 mt-1 text-sm sm:text-base">items in stock</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium">Product Variants</h3>
              <ShoppingBag className="h-7 w-7 sm:h-8 sm:w-8 opacity-80" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{products.length.toLocaleString()}</p>
            <p className="text-emerald-100 mt-1 text-sm sm:text-base">unique products</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium">Storage Boxes</h3>
              <PackageOpen className="h-7 w-7 sm:h-8 sm:w-8 opacity-80" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold">{boxes.length.toLocaleString()}</p>
            <p className="text-amber-100 mt-1 text-sm sm:text-base">boxes in use</p>
          </CardContent>
        </Card>
      </div>
      
      {lowStockProducts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            <h2 className="text-xl font-semibold text-slate-900">Low Stock Items</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.slice(0, 3).map(product => (
              <ProductCard key={product.barcode} product={product} />
            ))}
          </div>
          
          {lowStockProducts.length > 3 && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline"
                onClick={() => navigate('/inventory', { state: { filter: 'low-stock' } })}
              >
                View All {lowStockProducts.length} Low Stock Items
              </Button>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center mb-4">
            <PackageSearch className="h-5 w-5 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <PackageSearch className="h-10 w-10 text-indigo-600 mb-3" />
                <h3 className="text-lg font-medium mb-2">Inventory Lookup</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Scan or search for items in your inventory
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/inventory')}
                >
                  Search Inventory
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <PackageOpen className="h-10 w-10 text-indigo-600 mb-3" />
                <h3 className="text-lg font-medium mb-2">Box Management</h3>
                <p className="text-slate-500 text-sm mb-4">
                  View and manage storage boxes
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/boxes')}
                >
                  View Boxes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div>
          <div className="flex items-center mb-4">
            <Package className="h-5 w-5 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
          </div>
          
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              {products.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-slate-500 mb-3">No inventory data available</p>
                  <Button 
                    variant="primary"
                    onClick={() => navigate('/upload')}
                  >
                    Upload Inventory
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    {products.length} products in inventory
                  </p>
                  <div className="h-32 flex items-center justify-center border border-slate-200 rounded-md">
                    <p className="text-slate-400 text-sm">Activity chart will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};