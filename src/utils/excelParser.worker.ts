import ExcelJS from 'exceljs';
import { Product, Box } from '../types';

// Listen for messages from the main thread
self.onmessage = async (e: MessageEvent) => {
  const { file } = e.data;
  
  try {
    // Use much larger chunks for terabyte files
    const chunkSize = 100 * 1024 * 1024; // 100MB chunks for better throughput with massive files
    const totalChunks = Math.ceil(file.size / chunkSize);
    let processedChunks = 0;
    let lastProgressUpdate = Date.now();
    const PROGRESS_UPDATE_INTERVAL = 100; // Update progress every 100ms
    
    // Create a stream for the file
    const stream = file.stream();
    const reader = stream.getReader();
    
    // Process the file in chunks without loading it all into memory
    const workbook = new ExcelJS.Workbook();
    let currentChunk = new Uint8Array(0);
    let isFirstChunk = true;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Combine with current chunk
      const newChunk = new Uint8Array(currentChunk.length + value.length);
      newChunk.set(currentChunk, 0);
      newChunk.set(value, currentChunk.length);
      currentChunk = newChunk;
      
      // If we have enough data for a chunk or this is the last chunk
      if (currentChunk.length >= chunkSize || done) {
        if (isFirstChunk) {
          // Load the workbook with the first chunk
          await workbook.xlsx.load(currentChunk.buffer);
          isFirstChunk = false;
        } else {
          // For subsequent chunks, we'll need to process them differently
          // since ExcelJS doesn't support appending
          const tempWorkbook = new ExcelJS.Workbook();
          await tempWorkbook.xlsx.load(currentChunk.buffer);
          
          // Copy rows from temp workbook to main workbook
          const tempSheet = tempWorkbook.worksheets[0];
          if (tempSheet) {
            const mainSheet = workbook.worksheets[0];
            tempSheet.eachRow((row, rowNumber) => {
              if (rowNumber > 1) { // Skip header row
                mainSheet.addRow(row.values);
              }
            });
          }
          
          // Clear temp workbook
          tempWorkbook.removeWorksheet(tempWorkbook.worksheets[0].id);
        }
        
        // Clear the chunk to free memory
        currentChunk = new Uint8Array(0);
        processedChunks++;
        
        // Throttle progress updates
        const now = Date.now();
        if (now - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL) {
          self.postMessage({
            type: 'progress',
            progress: (processedChunks / totalChunks) * 50,
            stage: 'reading',
            processedBytes: processedChunks * chunkSize,
            totalBytes: file.size,
            estimatedTimeRemaining: calculateEstimatedTime(processedChunks, totalChunks, now - lastProgressUpdate)
          });
          lastProgressUpdate = now;
        }
      }
    }

    // Clear the stream
    reader.releaseLock();
    
    let sheet: ExcelJS.Worksheet | undefined;

    // --- Start Logging for Debugging --- //
    console.log('Workbook loaded. Inspecting worksheets...');
    console.log(`Total worksheets found: ${workbook.worksheets.length}`);
    
    workbook.worksheets.forEach((ws, index) => {
      console.log(`  Worksheet ${index + 1}: Name = '${ws.name}', actualRowCount = ${ws.actualRowCount}, rowCount = ${ws.rowCount}`);
      if (ws.rowCount > 0) {
        const headerRow = ws.getRow(1);
        // Ensure headerRow.values is an array before slicing
        const headerValues = Array.isArray(headerRow.values) ? headerRow.values.slice(1, 6) : [];
        console.log(`    Header (first 5 cells): ${JSON.stringify(headerValues)}`);
      }
    });
    console.log('--- End Logging for Debugging ---');
    // --- End Logging for Debugging --- //

    // 1. Try to find the first worksheet with actual data rows (excluding header)
    sheet = undefined;
    for (const ws of workbook.worksheets) {
      // Check if the sheet has any rows beyond the header (assuming row 1 is header)
      if (ws.actualRowCount > 1) { // At least one data row
        sheet = ws;
        break;
      }
    }
    // 2. Fallback: If still not found, just take the very first worksheet
    if (!sheet && workbook.worksheets.length > 0) {
      sheet = workbook.worksheets[0];
    }
    if (!sheet) {
      throw new Error('No worksheet with data found in Excel file. Please ensure your file has at least one worksheet with a header row and data.');
    }
    // Check for a valid header row
    const headerRow = sheet.getRow(1);
    const headerValues = Array.isArray(headerRow.values) ? headerRow.values.map(v => v?.toString().toLowerCase().trim()).filter(Boolean) : [];
    if (headerValues.length < 2) {
      throw new Error('No valid header row found in the first worksheet. Please ensure the first row contains column names.');
    }

    // Build a mapping from normalized header to actual header in the sheet
    const normalizedHeaderMap: Record<string, string> = {};
    headerRow.eachCell((cell, colNumber) => {
      const header = cell.value?.toString().toLowerCase().replace(/\s+/g, '').replace(/_/g, '') || '';
      normalizedHeaderMap[header] = cell.value?.toString() || '';
    });

    // Define the mapping from normalized header to Product field
    const fieldMapping: Record<string, string[]> = {
      barcode: ['itemcode', 'scancode'],
      quantity: ['grnitprsikonhand', 'qty'],
      size: ['size'],
      color: ['color'],
      styleNumber: ['itemstyleno', 'stylecode', 'stylenumber'],
      department: ['department'],
      retailPrice: ['retailprice', 'price'],
      boxNumber: ['ctn'],
    };

    // Helper to get the value from row using the mapping
    function getFieldValue(row: any, field: string[]): any {
      for (const key of field) {
        if (key in row && row[key] != null) return row[key];
      }
      return '';
    }

    // Process rows in very large chunks for better performance with massive files
    const ROW_CHUNK_SIZE = 10000; // Process 10,000 rows at a time
    const totalRows = sheet.rowCount;
    let processedRows = 0;
    let products: Product[] = [];
    const boxMap: Record<string, Box> = {};
    let lastParsingProgressUpdate = Date.now();
    let lastProcessedTime = Date.now();
    let rowsProcessedSinceLastUpdate = 0;

    // Process rows in chunks
    for (let i = 2; i <= totalRows; i += ROW_CHUNK_SIZE) {
      const chunkEnd = Math.min(i + ROW_CHUNK_SIZE - 1, totalRows);
      const chunkRows = [];
      
      // Get all rows in the chunk at once
      for (let rowNum = i; rowNum <= chunkEnd; rowNum++) {
        const row = sheet.getRow(rowNum);
        const rowData: any = {};
        row.eachCell((cell, colNumber) => {
          const header = sheet.getRow(1).getCell(colNumber).value?.toString()?.toLowerCase().replace(/\s+/g, '').replace(/_/g, '') || '';
          rowData[header] = cell.value;
        });
        chunkRows.push(rowData);
        processedRows++;
        rowsProcessedSinceLastUpdate++;
      }

      // Process products in this chunk
      const chunkProducts = chunkRows.map((row: any) => {
        const boxNumber = getFieldValue(row, fieldMapping.boxNumber)?.toString() || undefined;
        const product: Product = {
          barcode: getFieldValue(row, fieldMapping.barcode)?.toString() || '',
          quantity: parseInt(getFieldValue(row, fieldMapping.quantity)) || 0,
          size: getFieldValue(row, fieldMapping.size)?.toString() || '',
          color: getFieldValue(row, fieldMapping.color)?.toString() || '',
          age: '',
          styleNumber: getFieldValue(row, fieldMapping.styleNumber)?.toString() || '',
          department: getFieldValue(row, fieldMapping.department)?.toString() || '',
          retailPrice: parseFloat(getFieldValue(row, fieldMapping.retailPrice)) || 0,
          location: boxNumber ? 'Box' : 'Main Store',
          boxNumber
        };
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
        return product;
      });

      // Add products from this chunk
      products = products.concat(chunkProducts);
      
      // Clear chunk data to free memory
      chunkRows.length = 0;
      
      // Calculate processing speed and estimate time remaining
      const now = Date.now();
      const timeSinceLastUpdate = now - lastParsingProgressUpdate;
      if (timeSinceLastUpdate >= PROGRESS_UPDATE_INTERVAL) {
        const rowsPerSecond = (rowsProcessedSinceLastUpdate * 1000) / timeSinceLastUpdate;
        const remainingRows = totalRows - processedRows;
        const estimatedSecondsRemaining = remainingRows / rowsPerSecond;
        
        self.postMessage({
          type: 'progress',
          progress: 50 + ((processedRows / (totalRows - 1)) * 50),
          stage: 'parsing',
          processedRows,
          totalRows: totalRows - 1,
          rowsPerSecond: Math.round(rowsPerSecond),
          estimatedTimeRemaining: Math.round(estimatedSecondsRemaining)
        });
        
        lastParsingProgressUpdate = now;
        rowsProcessedSinceLastUpdate = 0;
      }
    }

    // Clear workbook to free memory
    workbook.removeWorksheet(sheet.id);
    
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

// Helper function to calculate estimated time remaining
function calculateEstimatedTime(processed: number, total: number, timePerChunk: number): number {
  if (processed === 0 || timePerChunk === 0) return 0;
  const remaining = total - processed;
  const chunksPerMs = processed / timePerChunk;
  return remaining / chunksPerMs; // Returns time in ms
} 