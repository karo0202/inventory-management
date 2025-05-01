import React from 'react';
import { Package, AlertTriangle, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Product } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ProductCardProps {
  product: Product;
  onAssignToBox?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product,
  onAssignToBox 
}) => {
  const { isStockManager } = useAuth();
  const isLowStock = product.quantity < 5;
  
  return (
    <Card className="w-full transition-shadow hover:shadow-lg">
      <CardHeader className={`${isLowStock ? 'bg-amber-50' : ''}`}>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600" />
            <span>Product #{product.styleNumber}</span>
          </CardTitle>
          {isLowStock && (
            <Badge variant="warning" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Low Stock</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Barcode</p>
            <p className="text-lg font-mono">{product.barcode}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Department</p>
            <p className="text-lg">{product.department}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Color</p>
            <p className="text-lg">{product.color}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Size</p>
            <p className="text-lg">{product.size}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Quantity</p>
            <p className={`text-lg font-semibold ${isLowStock ? 'text-amber-600' : ''}`}>
              {product.quantity} units
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Retail Price</p>
            <p className="text-lg">${product.retailPrice.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">Location:</span>
            <span>{product.location || 'Main Store'}</span>
            {product.boxNumber && (
              <Badge variant="info" className="ml-2">
                Box #{product.boxNumber}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      
      {isStockManager && onAssignToBox && (
        <CardFooter className="bg-slate-50">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onAssignToBox(product)}
          >
            Assign to Box
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};