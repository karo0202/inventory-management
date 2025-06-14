import { parseExcelFile } from './excelParser';
import { useInventory } from '../context/InventoryContext';

export const loadTestData = async (fileName: string = 'soh/sp soh.xlsx', signal?: AbortSignal) => {
  try {
    // Fetch the file from the public directory
    const response = await fetch(fileName);
    if (!response.ok) {
      throw new Error(`Failed to fetch test data file: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    // Create a File object from the blob. The second argument is the file name.
    const file = new File([blob], fileName.split('/').pop() || 'test_data.xlsx', { type: blob.type });
    
    console.log('Starting to parse test data...');

    // Parse the Excel file using the existing worker, passing the signal
    const { products, boxes } = await parseExcelFile(file, signal);
    
    console.log(`Parsed ${products.length} products from test data.`);

    // Get the uploadInventory function from the InventoryContext (this requires a bit of a trick for standalone use)
    // For a quick test, you might temporarily expose it or call it in a component.
    // For this utility, we'll assume a way to access it, or you can copy the logic here.
    
    // *** IMPORTANT: You will need to manually call uploadInventory after this. ***
    // This function can prepare the products and boxes. You'd then call useInventory().uploadInventory(products, boxes)
    // from a React component context. For a quick console test:
    // 1. Run your app
    // 2. Open console and run: window.loadTestData = loadTestData; 
    // 3. Then in console: 
    //    import('./src/utils/testDataImporter.ts').then(m => m.loadTestData()).then(({ products, boxes }) => {
    //        // Now get the useInventory hook in a component and call uploadInventory with these.
    //        // Alternatively, for a truly quick test, we can directly manipulate localforage here if desired,
    //        // but that bypasses your existing logic and might not be ideal for testing the full flow.
    //    });

    // Let's modify this to directly return the parsed data,
    // and you can then call uploadInventory from a component that has access to useInventory().
    return { products, boxes };

  } catch (error) {
    console.error('Error loading test data:', error);
    throw error;
  }
}; 