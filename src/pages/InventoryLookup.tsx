import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Camera, BarChart4, AlertTriangle } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { ProductCard } from '../components/inventory/ProductCard';
import { BarcodeScanner } from '../components/inventory/BarcodeScanner';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types';

const LOW_STOCK_THRESHOLD = 5;
const LARGE_DATASET_SIZE = 1000;

export const InventoryLookup: React.FC = () => {
  const location = useLocation();
  const { products, searchProducts, getProductByBarcode, getLowStockProducts } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'low-stock'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const workerRef = useRef<Worker | null>(null);
  
  // Handle filter from location state if any
  useEffect(() => {
    if (location.state?.filter === 'low-stock') {
      setActiveTab('low-stock');
    }
  }, [location.state]);
  
  // Filter products based on active tab
  useEffect(() => {
    setIsLoading(true);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (activeTab === 'low-stock') {
        if (products.length > LARGE_DATASET_SIZE) {
          // Use web worker for large datasets
          if (!workerRef.current) {
            // @ts-ignore
            workerRef.current = new Worker(new URL('../utils/lowStockFilter.worker.ts', import.meta.url), { type: 'module' });
          }
          workerRef.current.onmessage = (e: MessageEvent) => {
            setSearchResults(e.data.lowStock);
            setIsLoading(false);
          };
          workerRef.current.postMessage({ products, threshold: LOW_STOCK_THRESHOLD });
        } else {
          setSearchResults(getLowStockProducts(LOW_STOCK_THRESHOLD));
          setIsLoading(false);
        }
      } else if (searchQuery) {
        setSearchResults(searchProducts(searchQuery));
        setIsLoading(false);
      } else {
        setSearchResults([]);
        setIsLoading(false);
      }
    }, 200);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [activeTab, searchQuery, getLowStockProducts, searchProducts, products]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      setSearchResults(searchProducts(searchQuery));
    }
  };
  
  const handleBarcodeDetected = (barcode: string) => {
    setIsScannerOpen(false);
    setSearchQuery(barcode);
    
    const product = getProductByBarcode(barcode);
    if (product) {
      setSelectedProduct(product);
      setSearchResults([]);
    } else {
      setSearchResults([]);
      setSelectedProduct(null);
    }
  };
  
  const handleManualSearch = (product: Product) => {
    setSelectedProduct(product);
    setSearchResults([]);
    setSearchQuery(product.barcode);
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Inventory Lookup</h1>
      
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex-1">
            <form onSubmit={handleSearch}>
              <Input
                placeholder="Search by barcode, style number, color, etc."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-5 w-5 text-slate-400" />}
              />
            </form>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsScannerOpen(true)}
            leftIcon={<Camera className="h-5 w-5" />}
          >
            Scan
          </Button>
        </div>
        
        <div className="flex border-b border-slate-200 mb-4">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('all')}
          >
            <BarChart4 className="h-4 w-4 inline mr-1" />
            All Items
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'low-stock'
                ? 'border-b-2 border-amber-500 text-amber-500'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('low-stock')}
          >
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            Low Stock
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <span className="text-indigo-600 text-lg font-medium">Loading...</span>
        </div>
      ) : selectedProduct ? (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Product Details</h2>
          <ProductCard 
            product={selectedProduct} 
            onAssignToBox={() => {}} 
          />
          <div className="mt-4">
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedProduct(null);
                setSearchQuery('');
              }}
            >
              Back to Search
            </Button>
          </div>
        </div>
      ) : searchResults.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            {activeTab === 'low-stock' ? 'Low Stock Items' : 'Search Results'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map(product => (
              <div key={product.barcode} onClick={() => handleManualSearch(product)}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Inventory Data</h3>
            <p className="text-slate-500 mb-4">
              Upload your inventory data to get started.
            </p>
            <Button
              onClick={() => {
                // Navigate to upload
                window.location.href = '/upload';
              }}
            >
              Upload Inventory
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {activeTab === 'low-stock' 
                ? 'No Low Stock Items Found'
                : 'Search for Inventory Items'}
            </h3>
            <p className="text-slate-500">
              {activeTab === 'low-stock'
                ? 'All items have adequate stock levels.'
                : 'Enter a barcode, style number, or other product information in the search box above.'}
            </p>
          </CardContent>
        </Card>
      )}
      
      {isScannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
};