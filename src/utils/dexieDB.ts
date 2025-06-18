// @ts-ignore: If you see a type error, ensure 'dexie' types are installed (npm install --save-dev @types/dexie if needed)
import Dexie, { Table } from 'dexie';
import { Product, Box, StockHistory } from '../types';

export class InventoryDB extends Dexie {
  products!: Table<Product, string>; // string = barcode
  boxes!: Table<Box, string>; // string = id
  stockHistory!: Table<StockHistory, string>; // string = date (ISO)

  constructor() {
    super('InventoryDB');
    super.version(1).stores({
      products: 'barcode',
      boxes: 'id',
      stockHistory: 'date',
    });
  }
}

export const db = new InventoryDB(); 