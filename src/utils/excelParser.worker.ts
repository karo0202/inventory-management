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

    // 1. Try to find the worksheet by its specific name 'soh'
    sheet = workbook.getWorksheet('soh'); 

    // 2. If not found by name, or if found but actualRowCount is 0, then try iterating
    if (!sheet || sheet.actualRowCount === 0) {
      sheet = undefined; // Reset sheet for fallback search
      // Fallback: Find the first worksheet with actual rows (excluding header)
      for (const ws of workbook.worksheets) {
        // Check if the sheet has any rows beyond the header (assuming row 1 is header)
        if (ws.actualRowCount > 0) { // Using actualRowCount here is usually best for detecting real data
          sheet = ws;
          break;
        }
      }
    }

    // 3. Final fallback: If still no sheet found, just take the very first one
    // This is a last resort if actualRowCount is unreliable for some reason
    if (!sheet && workbook.worksheets.length > 0) {
      sheet = workbook.worksheets[0];
    }

    if (!sheet) {
      throw new Error('No valid worksheet found in Excel file. Please ensure it contains data and is not empty, or try a different file.');
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
          const header = sheet.getRow(1).getCell(colNumber).value?.toString()?.toLowerCase() || '';
          rowData[header] = cell.value;
        });
        
        chunkRows.push(rowData);
        processedRows++;
        rowsProcessedSinceLastUpdate++;
      }

      // Process products in this chunk
      const chunkProducts = chunkRows.map((row: any) => {
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