import React, { useState } from 'react';

const PasteTableUpload = () => {
  const [raw, setRaw] = useState('');
  const [rows, setRows] = useState<any[]>([]);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('Text');
    setRaw(text);
    // Parse tabular data (TSV/CSV)
    const lines = text.split(/\r?\n/).filter(Boolean);
    const headers = lines[0]?.split(/\t|,/);
    const data = lines.slice(1).map(line => {
      const values = line.split(/\t|,/);
      return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] }), {});
    });
    setRows(data);
  };

  return (
    <div>
      <textarea
        rows={8}
        className="w-full border p-2"
        placeholder="Paste your table data here (from Excel or Sheets)"
        onPaste={handlePaste}
      />
      {rows.length > 0 && (
        <div className="mt-2">
          <div>Preview ({rows.length} rows):</div>
          <pre className="overflow-x-auto bg-gray-100 p-2 rounded text-xs">{JSON.stringify(rows.slice(0, 10), null, 2)}{rows.length > 10 && '...'}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PasteTableUpload; 