import React from 'react';
import { Box as BoxIcon, PackageOpen, Tag } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Box } from '../../types';

interface BoxCardProps {
  box: Box;
  onViewDetails: (boxId: string) => void;
}

export const BoxCard: React.FC<BoxCardProps> = ({ box, onViewDetails }) => {
  if (!box) {
    return null;
  }

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center text-lg">
          <BoxIcon className="h-5 w-5 text-indigo-600 mr-2" />
          <span>Box #{box.id}</span>
        </CardTitle>
        <span className="text-sm text-slate-500">{box.name}</span>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <PackageOpen className="h-4 w-4 text-slate-500 mr-2" />
            <span className="text-sm font-medium text-slate-600">
              {box.products?.length || 0} items
            </span>
          </div>
          <div className="flex items-center">
            <Tag className="h-4 w-4 text-slate-500 mr-2" />
            <span className="text-sm font-medium text-slate-600">
              Location: {box.location}
            </span>
          </div>
        </div>
        
        {box.products && box.products.length > 0 && (
          <div className="mt-3 border-t border-slate-200 pt-3">
            <h4 className="text-xs uppercase font-semibold text-slate-500 mb-2">Top items</h4>
            <ul className="space-y-1">
              {box.products.slice(0, 3).map((product) => (
                <li key={product.barcode} className="text-sm text-slate-700 truncate">
                  {product.department} - {product.color} {product.size}
                </li>
              ))}
              {box.products.length > 3 && (
                <li className="text-xs text-slate-500">
                  + {box.products.length - 3} more items
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-slate-50">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => onViewDetails(box.id)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};