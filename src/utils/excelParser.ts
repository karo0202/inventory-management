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
        
        // Handle Products Sheet
        const productsSheet = workbook.Sheets['Products'] || workbook.Sheets[workbook.SheetNames[0]];
        if (!productsSheet) {
          throw new Error('No product worksheet found in Excel file');
        }

        // Convert to JSON
        const productData = XLSX.utils.sheet_to_json(productsSheet);
        
        if (!Array.isArray(productData) || productData.length === 0) {
          throw new Error('No valid product data found in Excel file');
        }

        // Map to Product type
        const products: Product[] = productData.map((row: any) => ({
          barcode: row.Barcode?.toString() || '',
          quantity: parseInt(row.Quantity) || 0,
          size: row.Size?.toString() || '',
          color: row.Color?.toString() || '',
          age: row.Age?.toString() || '',
          styleNumber: row.StyleNumber?.toString() || '',
          department: row.Department?.toString() || '',
          retailPrice: parseFloat(row.RetailPrice) || 0,
          location: row.Location?.toString() || 'Main Store',
          boxNumber: row.BoxNumber?.toString() || undefined
        }));

        // Validate required product fields
        const invalidProducts = products.filter(
          p => !p.barcode || !p.styleNumber || !p.department
        );

        if (invalidProducts.length > 0) {
          throw new Error('Some products are missing required fields (Barcode, Style Number, or Department)');
        }

        // Handle Boxes Sheet
        const boxesSheet = workbook.Sheets['Boxes'];
        let boxes: Box[] = [];

        if (boxesSheet) {
          const boxData = XLSX.utils.sheet_to_json(boxesSheet);
          
          if (Array.isArray(boxData) && boxData.length > 0) {
            boxes = boxData.map((row: any) => ({
              id: row.BoxNumber?.toString() || '',
              name: row.BoxName?.toString() || '',
              location: row.Location?.toString() || 'Back Store',
              products: []
            }));

            // Validate required box fields
            const invalidBoxes = boxes.filter(b => !b.id || !b.name);
            if (invalidBoxes.length > 0) {
              throw new Error('Some boxes are missing required fields (Box Number or Name)');
            }

            // Associate products with boxes
            products.forEach(product => {
              if (product.boxNumber) {
                const box = boxes.find(b => b.id === product.boxNumber);
                if (box) {
                  box.products.push(product);
                }
              }
            });
          }
        }
        
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