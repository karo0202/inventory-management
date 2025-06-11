import ExcelJS from 'exceljs';
import { Product, Box } from '../types';

// Listen for messages from the main thread
self.onmessage = async (e: MessageEvent) => {
  const { file, signal } = e.data;
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new Error('No worksheet found in Excel file');
    }

    const rows: any[] = [];
    const totalRows = sheet.rowCount;
    let processedRows = 0;

    // Process rows in chunks to report progress
    const CHUNK_SIZE = 100;
    for (let i = 2; i <= totalRows; i += CHUNK_SIZE) {
      if (signal.aborted) {
        throw new Error('Parsing cancelled');
      }

      const chunkEnd = Math.min(i + CHUNK_SIZE - 1, totalRows);
      for (let rowNum = i; rowNum <= chunkEnd; rowNum++) {
        const row = sheet.getRow(rowNum);
        const rowData: any = {};
        
        row.eachCell((cell, colNumber) => {
          const header = sheet.getRow(1).getCell(colNumber).value?.toString()?.toLowerCase() || '';
          rowData[header] = cell.value;
        });
        
        rows.push(rowData);
        processedRows++;
      }

      // Report progress
      self.postMessage({
        type: 'progress',
        progress: (processedRows / (totalRows - 1)) * 100
      });
    }

    // Map to Product type and collect unique boxes
    const products: Product[] = [];
    const boxMap: Record<string, Box> = {};

    rows.forEach((row: any) => {
      const boxNumber = row.ctn?.toString() || undefined;
      const product: Product = {
        barcode: row['item code']?.toString() || '',
        quantity: parseInt(row.qty) || 0,
        size: row.size?.toString() || '',
        color: row.color?.toString() || '',
        age: '',
        styleNumber: row['style code']?.toString() || row['style number']?.toString() || '',
        department: row.department?.toString() || '',
        retailPrice: parseFloat(row.price) || 0,
        location: boxNumber ? 'Box' : 'Main Store',
        boxNumber
      };
      products.push(product);

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
    
    // Send the final result
    self.postMessage({
      type: 'complete',
      result: { products, boxes }
    });

  } catch (error) {
    if (error instanceof Error) {
      self.postMessage({
        type: 'error',
        error: error.message
      });
    } else {
      self.postMessage({
        type: 'error',
        error: 'An unknown error occurred while parsing the file'
      });
    }
  }
}; 