import React, { useState } from 'react';

const defaultRow = { barcode: '', quantity: '', size: '', color: '', styleNumber: '', department: '', retailPrice: '', boxNumber: '' };

const ManualEntry = () => {
  const [rows, setRows] = useState([{ ...defaultRow }]);

  const addRow = () => setRows([...rows, { ...defaultRow }]);
  const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: string, value: string) => {
    setRows(rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  return (
    <div>
      <table className="w-full border mb-2">
        <thead>
          <tr>
            <th>Barcode</th><th>Quantity</th><th>Size</th><th>Color</th><th>Style Number</th><th>Department</th><th>Retail Price</th><th>Box Number</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {Object.keys(defaultRow).map(field => (
                <td key={field}><input className="border p-1 w-20" value={row[field]} onChange={e => updateRow(idx, field, e.target.value)} /></td>
              ))}
              <td><button onClick={() => removeRow(idx)}>-</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow}>Add Row</button>
    </div>
  );
};

export default ManualEntry; 