import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { parseExcelFile, downloadSampleTemplate } from '../utils/excelParser';
import { Product } from '../types';

export const SohUpload: React.FC = () => {
  const { uploadInventory, stockHistory } = useInventory();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setUploadError('Please select an Excel file (.xlsx or .xls)');
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
    setUploadSuccess(false);
    setUploadError(null);
    setParsedProducts([]);
    
    try {
      const products = await parseExcelFile(file);
      setParsedProducts(products);
    } catch (error) {
      console.error('Error parsing file:', error);
      setUploadError('Could not parse the Excel file. Please check the format.');
      setSelectedFile(null);
    }
  };
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };
  
  const handleUpload = async () => {
    if (!parsedProducts.length) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      await uploadInventory(parsedProducts);
      setUploadSuccess(true);
      setSelectedFile(null);
      setParsedProducts([]);
      
      // Reset the file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error uploading inventory:', error);
      setUploadError('Failed to update inventory. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">SOH Upload</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload Inventory File</CardTitle>
            </CardHeader>
            <CardContent>
              {uploadSuccess ? (
                <div className="p-6 bg-emerald-50 rounded-md border border-emerald-100 flex items-start mb-6">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-emerald-800 mb-1">Upload Successful</h3>
                    <p className="text-emerald-600 text-sm">
                      Your inventory has been updated successfully.
                    </p>
                  </div>
                </div>
              ) : uploadError ? (
                <div className="p-6 bg-red-50 rounded-md border border-red-100 flex items-start mb-6">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-800 mb-1">Upload Failed</h3>
                    <p className="text-red-600 text-sm">{uploadError}</p>
                  </div>
                </div>
              ) : null}
              
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-50'
                    : selectedFile
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div>
                    <FileText className="h-12 w-12 text-indigo-500 mx-auto mb-2" />
                    <p className="text-indigo-700 font-medium mb-1">{selectedFile.name}</p>
                    <p className="text-slate-500 text-sm mb-4">
                      {parsedProducts.length
                        ? `${parsedProducts.length} products found`
                        : 'Processing file...'}
                    </p>
                    <div className="flex justify-center space-x-3">
                      <Button
                        variant="primary"
                        onClick={handleUpload}
                        isLoading={isUploading}
                        disabled={!parsedProducts.length || isUploading}
                      >
                        {isUploading ? 'Uploading...' : 'Update Inventory'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setParsedProducts([]);
                          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                          if (fileInput) {
                            fileInput.value = '';
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <UploadCloud className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">
                      {isDragging ? 'Drop your file here' : 'Upload SOH Excel File'}
                    </h3>
                    <p className="text-slate-500 mb-4">
                      Drag and drop your Excel file here, or click to browse
                    </p>
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border border-slate-300 bg-transparent hover:bg-slate-100 focus-visible:ring-slate-500 h-10 px-4 cursor-pointer"
                    >
                      <UploadCloud size={16} className="mr-2" />
                      Browse Files
                    </label>
                    <p className="mt-2 text-xs text-slate-500">
                      Supported formats: .xlsx, .xls
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-slate-600">
                  Need a template? Download our sample Excel format
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download size={16} />}
                  onClick={downloadSampleTemplate}
                >
                  Download Template
                </Button>
              </div>
              
              {parsedProducts.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-slate-900 mb-3">Preview</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Barcode
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Style #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Size/Color
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {parsedProducts.slice(0, 5).map((product) => (
                          <tr key={product.barcode}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                              {product.barcode}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {product.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {product.styleNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {product.size} / {product.color}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {product.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              ${product.retailPrice.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedProducts.length > 5 && (
                      <p className="text-sm text-slate-500 mt-2 text-center">
                        Showing 5 of {parsedProducts.length} products
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
            </CardHeader>
            <CardContent>
              {stockHistory.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-500">No uploads yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stockHistory.map((entry, index) => (
                    <div 
                      key={index} 
                      className="p-3 border border-slate-200 rounded-md hover:bg-slate-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-slate-900">{entry.fileName}</h4>
                          <p className="text-xs text-slate-500">
                            {new Date(entry.date).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-emerald-600">
                            +{entry.changes.added}
                          </span>
                          {' / '}
                          <span className="text-xs font-medium text-amber-600">
                            ~{entry.changes.updated}
                          </span>
                          {' / '}
                          <span className="text-xs font-medium text-red-600">
                            -{entry.changes.removed}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};