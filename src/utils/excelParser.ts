import ExcelJS from 'exceljs';
import { Product, Box } from '../types';

interface ExcelParseResult {
  products: Product[];
  boxes: Box[];
}

export const parseExcelFile = (file: File, signal?: AbortSignal): Promise<ExcelParseResult> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./excelParser.worker.ts', import.meta.url), { type: 'module' });
    
    // If a signal is provided, terminate the worker when the signal aborts
    if (signal) {
      signal.onabort = () => {
        worker.terminate();
        reject(new Error('Parsing cancelled')); // Reject the promise if cancelled
      };
    }

    worker.onmessage = (e) => {
      const { type, progress, stage, result, error } = e.data;
      
      switch (type) {
        case 'progress':
          // Update progress in the UI
          if (typeof progress === 'number') {
            // Dispatch a custom event that components can listen to
            window.dispatchEvent(new CustomEvent('excelParseProgress', {
              detail: { progress, stage }
            }));
          }
          break;
          
        case 'complete':
          worker.terminate();
          resolve(result);
          break;
          
        case 'error':
          worker.terminate();
          reject(new Error(error));
          break;
      }
    };
    
    worker.onerror = (errorEvent: ErrorEvent) => {
      worker.terminate();
      console.error('Web Worker Error:', errorEvent.message); // Log the specific error message
      reject(new Error(errorEvent.message || 'An unknown error occurred in the Excel parsing worker.'));
    };
    
    // Pass only the file, not the signal, to the worker via postMessage
    worker.postMessage({ file });
  });
};

export async function downloadSampleTemplate() {
  const workbook = new ExcelJS.Workbook();
  const productsSheet = workbook.addWorksheet('Products');
  
  // Add headers
  productsSheet.addRow([
    'item code',
    'qty',
    'size',
    'color',
    'style code',
    'style number',
    'department',
    'price',
    'ctn'
  ]);
  
  // Add sample data
  productsSheet.addRow(['12345', 10, 'M', 'Red', 'STY001', 'SN001', 'Mens', 29.99, '1']);
  productsSheet.addRow(['67890', 5, 'L', 'Blue', 'STY002', 'SN002', 'Womens', 39.99, '2']);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventory_template.xlsx';
  a.click();
  window.URL.revokeObjectURL(url);
}