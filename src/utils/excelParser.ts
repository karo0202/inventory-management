import * as XLSX from 'xlsx';
import { Product, Box } from '../types';

interface ExcelParseResult {
  products: Product[];
  boxes: Box[];
}

export const parseExcelFile = (file: File): Promise<ExcelParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('No data found in file');
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) {
          throw new Error('No worksheet found in Excel file');
        }

        // Convert to JSON
        const rows = XLSX.utils.sheet_to_json(sheet);
        if (!Array.isArray(rows) || rows.length === 0) {
          throw new Error('No valid data found in Excel file');
        }

        // Map to Product type and collect unique boxes
        const products: Product[] = [];
        const boxMap: Record<string, Box> = {};

        rows.forEach((row: any) => {
          const boxNumber = row.CTN?.toString() || undefined;
          const product: Product = {
            barcode: row['item code']?.toString() || '',
            quantity: parseInt(row.qty) || 0,
            size: row.size?.toString() || '',
            color: row.color?.toString() || '',
            age: '',
            styleNumber: row['style code']?.toString() || row['style number']?.toString() || '',
            department: '',
            retailPrice: 0,
            location: boxNumber ? 'Box' : 'Main Store',
            boxNumber
          };
          products.push(product);

          // Create or update box
          if (boxNumber) {
            if (!boxMap[boxNumber]) {
              boxMap[boxNumber] = {
                id: boxNumber,
                name: `Box ${boxNumber}`,
                location: 'Back Store',
                products: []
              };
            }
            boxMap[boxNumber].products.push(product);
          }
        });

        const boxes = Object.values(boxMap);
        resolve({ products, boxes });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsBinaryString(file);
  });
};

export const downloadSampleTemplate = (): void => {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Create Products sheet
  const productsSheet = XLSX.utils.aoa_to_sheet([
    ['Barcode', 'Quantity', 'Size', 'Color', 'Age', 'StyleNumber', 'Department', 'RetailPrice', 'Location', 'BoxNumber'],
    ['123456789012', 10, 'M', 'Blue', 'Adult', 'STY001', 'Menswear', 29.99, 'Box', 'BOX001'],
    ['223456789012', 5, 'S', 'Red', 'Adult', 'STY002', 'Womenswear', 39.99, 'Box', 'BOX001'],
    ['323456789012', 3, 'L', 'Black', 'Adult', 'STY003', 'Accessories', 19.99, 'Main Store', '']
  ]);
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

  // Create Boxes sheet
  const boxesSheet = XLSX.utils.aoa_to_sheet([
    ['BoxNumber', 'BoxName', 'Location'],
    ['BOX001', 'Winter Collection', 'Back Store'],
    ['BOX002', 'Summer Collection', 'Warehouse'],
    ['BOX003', 'Accessories', 'Storage Room']
  ]);
  XLSX.utils.book_append_sheet(workbook, boxesSheet, 'Boxes');
  
  // Generate and download the Excel file
  XLSX.writeFile(workbook, 'inventory_template.xlsx');
};