import React, { useRef, useState } from 'react';
import Papa from 'papaparse';

const CSVUpload = () => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = (file: File) => {
    setError('');
    setProgress(0);
    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        worker: true,
        step: (row, parser) => {
          // Process each row (can batch for large files)
        },
        complete: (results) => {
          setProgress(100);
          // Handle results.data
        },
        error: (err) => setError(err.message),
      });
    } else if (file.name.endsWith('.xlsx')) {
      // Use existing Excel parser logic (call parseExcelFile)
    } else {
      setError('Unsupported file type. Please upload a .csv or .xlsx file.');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div onDrop={onDrop} onDragOver={e => e.preventDefault()} className="border p-4 rounded">
      <input
        type="file"
        accept=".csv,.xlsx"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={e => {
          if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
        }}
      />
      <button onClick={() => fileInputRef.current?.click()}>Select File</button>
      <div>or drag and drop a .csv or .xlsx file here</div>
      {progress > 0 && <div>Progress: {progress}%</div>}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
};

export default CSVUpload; 