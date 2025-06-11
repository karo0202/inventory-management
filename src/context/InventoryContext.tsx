import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import localforage from 'localforage';
import { Product, Box, StockHistory } from '../types';

interface InventoryContextType {
  products: Product[];
  boxes: Box[];
  stockHistory: StockHistory[];
  uploadInventory: (products: Product[], newBoxes?: Box[]) => Promise<void>;
  getProductByBarcode: (barcode: string) => Product | undefined;
  getLowStockProducts: (threshold?: number) => Product[];
  assignProductToBox: (productBarcode: string, boxId: string) => Promise<void>;
  createBox: (boxData: Omit<Box, 'products'>) => Promise<void>;
  getBoxById: (boxId: string) => Box | undefined;
  removeProductFromBox: (productBarcode: string) => Promise<void>;
  searchProducts: (query: string) => Product[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  
  // Load initial data from local storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedProducts = await localforage.getItem<Product[]>('products');
        if (storedProducts) setProducts(storedProducts);
        
        const storedBoxes = await localforage.getItem<Box[]>('boxes');
        if (storedBoxes) setBoxes(storedBoxes);
        
        const storedHistory = await localforage.getItem<StockHistory[]>('stockHistory');
        if (storedHistory) setStockHistory(storedHistory);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Persist data to local storage whenever it changes
  useEffect(() => {
    if (products.length) localforage.setItem('products', products);
  }, [products]);
  
  useEffect(() => {
    if (boxes.length) localforage.setItem('boxes', boxes);
  }, [boxes]);
  
  useEffect(() => {
    if (stockHistory.length) localforage.setItem('stockHistory', stockHistory);
  }, [stockHistory]);
  
  // Upload new inventory from Excel file
  const uploadInventory = async (newProducts: Product[], newBoxes?: Box[]): Promise<void> => {
    if (!Array.isArray(newProducts) || newProducts.length === 0) {
      throw new Error('Invalid products data');
    }

    // Helper to dispatch progress
    const dispatchUploadProgress = (progress: number, stage: string) => {
      window.dispatchEvent(new CustomEvent('inventoryUploadProgress', {
        detail: { progress, stage }
      }));
    };

    dispatchUploadProgress(5, 'Processing products...');

    // Track changes for history
    const changes = {
      added: 0,
      removed: 0,
      updated: 0
    };
    
    // Create a map of existing products by barcode
    const existingProductsMap = new Map(
      products.map(product => [product.barcode, product])
    );
    
    // Create a map of new products by barcode
    const newProductsMap = new Map(
      newProducts.map(product => [product.barcode, product])
    );
    
    // Process new and updated products
    const productsToKeep: Product[] = [];
    
    newProductsMap.forEach((product, barcode) => {
      if (existingProductsMap.has(barcode)) {
        // Preserve location and box information when updating if not specified in new data
        const existingProduct = existingProductsMap.get(barcode)!;
        productsToKeep.push({
          ...product,
          location: product.location || existingProduct.location,
          boxNumber: product.boxNumber || existingProduct.boxNumber
        });
        changes.updated++;
      } else {
        productsToKeep.push(product);
        changes.added++;
      }
    });
    
    // Calculate removed products
    changes.removed = products.length - changes.updated;
    
    dispatchUploadProgress(25, 'Updating product state...');

    // Update products
    setProducts(productsToKeep);
    
    dispatchUploadProgress(40, 'Saving products to storage...');
    // Persist to storage
    await localforage.setItem('products', productsToKeep);
    
    dispatchUploadProgress(60, 'Processing boxes...');

    // Update boxes if provided
    if (newBoxes && newBoxes.length > 0) {
      const existingBoxIds = new Set(boxes.map(box => box.id));
      const boxesToKeep = [...boxes];
      
      newBoxes.forEach(newBox => {
        if (!existingBoxIds.has(newBox.id)) {
          boxesToKeep.push(newBox);
        }
      });
      
      dispatchUploadProgress(75, 'Saving boxes to storage...');
      setBoxes(boxesToKeep);
      await localforage.setItem('boxes', boxesToKeep);
    }
    
    dispatchUploadProgress(90, 'Saving upload history...');

    // Record history
    const newHistoryEntry: StockHistory = {
      date: new Date().toISOString(),
      fileName: `SOH_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`,
      changes
    };
    
    setStockHistory([newHistoryEntry, ...stockHistory]);

    await localforage.setItem('stockHistory', [newHistoryEntry, ...stockHistory]);

    dispatchUploadProgress(100, 'Upload complete!');

  };
  
  // Get product by barcode
  const getProductByBarcode = (barcode: string): Product | undefined => {
    return products.find(product => product.barcode === barcode);
  };
  
  // Get low stock products
  const getLowStockProducts = (threshold = 5): Product[] => {
    return products.filter(product => product.quantity < threshold);
  };
  
  // Assign a product to a box
  const assignProductToBox = async (productBarcode: string, boxId: string): Promise<void> => {
    // Find the product and box
    const productIndex = products.findIndex(p => p.barcode === productBarcode);
    const boxIndex = boxes.findIndex(b => b.id === boxId);
    
    if (productIndex === -1 || boxIndex === -1) {
      throw new Error('Product or box not found');
    }
    
    // Update the product with box information
    const updatedProducts = [...products];
    updatedProducts[productIndex] = {
      ...updatedProducts[productIndex],
      location: 'Box',
      boxNumber: boxId
    };
    
    // Update the box with the product
    const updatedBoxes = [...boxes];
    const box = updatedBoxes[boxIndex];
    const boxProducts = box.products || [];
    
    // Check if product is already in the box
    const existingProductIndex = boxProducts.findIndex(p => p.barcode === productBarcode);
    
    if (existingProductIndex >= 0) {
      boxProducts[existingProductIndex] = { ...updatedProducts[productIndex] };
    } else {
      boxProducts.push({ ...updatedProducts[productIndex] });
    }
    
    updatedBoxes[boxIndex] = { ...box, products: boxProducts };
    
    // Update state
    setProducts(updatedProducts);
    setBoxes(updatedBoxes);

    // Persist to storage
    await localforage.setItem('products', updatedProducts);
    await localforage.setItem('boxes', updatedBoxes);
  };
  
  // Create a new box
  const createBox = async (boxData: Omit<Box, 'products'>): Promise<void> => {
    const newBox: Box = {
      ...boxData,
      products: []
    };
    
    const updatedBoxes = [...boxes, newBox];
    setBoxes(updatedBoxes);
    await localforage.setItem('boxes', updatedBoxes);
  };
  
  // Get box by ID
  const getBoxById = (boxId: string): Box | undefined => {
    return boxes.find(box => box.id === boxId);
  };
  
  // Remove a product from a box
  const removeProductFromBox = async (productBarcode: string): Promise<void> => {
    // Find the product
    const productIndex = products.findIndex(p => p.barcode === productBarcode);
    
    if (productIndex === -1) {
      throw new Error('Product not found');
    }
    
    const product = products[productIndex];
    
    if (!product.boxNumber) {
      return; // Product is not in a box
    }
    
    // Find the box
    const boxIndex = boxes.findIndex(b => b.id === product.boxNumber);
    
    // Update the product
    const updatedProducts = [...products];
    updatedProducts[productIndex] = {
      ...updatedProducts[productIndex],
      location: 'Main Store',
      boxNumber: undefined
    };
    
    // Update the box if found
    let updatedBoxes = [...boxes];
    if (boxIndex !== -1) {
      const box = updatedBoxes[boxIndex];
      const boxProducts = box.products.filter(p => p.barcode !== productBarcode);
      updatedBoxes[boxIndex] = { ...box, products: boxProducts };
    }
    
    // Update state
    setProducts(updatedProducts);
    setBoxes(updatedBoxes);

    // Persist to storage
    await localforage.setItem('products', updatedProducts);
    await localforage.setItem('boxes', updatedBoxes);
  };
  
  // Search products by any field
  const searchProducts = (query: string): Product[] => {
    if (!query) return [];
    
    const lowerQuery = query.toLowerCase();
    return products.filter(product => 
      product.barcode.toLowerCase().includes(lowerQuery) ||
      product.size.toLowerCase().includes(lowerQuery) ||
      product.color.toLowerCase().includes(lowerQuery) ||
      product.department.toLowerCase().includes(lowerQuery) ||
      product.styleNumber.toLowerCase().includes(lowerQuery)
    );
  };
  
  const value = {
    products,
    boxes,
    stockHistory,
    uploadInventory,
    getProductByBarcode,
    getLowStockProducts,
    assignProductToBox,
    createBox,
    getBoxById,
    removeProductFromBox,
    searchProducts
  };
  
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};