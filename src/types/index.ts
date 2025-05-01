export interface Product {
  barcode: string;
  quantity: number;
  size: string;
  color: string;
  age: string;
  styleNumber: string;
  department: string;
  retailPrice: number;
  location?: string;
  boxNumber?: string;
}

export interface Box {
  id: string;
  name: string;
  location: string;
  products: Product[];
}

export interface User {
  id: string;
  name: string;
  role: 'stock-manager' | 'sales-staff';
}

export interface StockHistory {
  date: string;
  fileName: string;
  changes: {
    added: number;
    removed: number;
    updated: number;
  };
}

export enum Location {
  MainStore = 'Main Store',
  BackStore = 'Back Store',
  Box = 'Box'
}