import React from 'react';

const GoogleSheetsInstructions = () => (
  <div className="p-4 bg-gray-50 rounded">
    <h2 className="font-bold mb-2">Google Sheets Upload</h2>
    <ol className="list-decimal ml-6">
      <li>Open your SOH data in Google Sheets.</li>
      <li>Go to <b>File &gt; Download &gt; Comma-separated values (.csv, current sheet)</b>.</li>
      <li>Upload the downloaded CSV file using the <b>Excel/CSV Upload</b> tab.</li>
      <li>For very large files, the app will process the data in the background and show progress.</li>
    </ol>
    <p className="mt-2 text-sm text-gray-600">If you need direct Google Sheets integration, contact the developer for advanced setup.</p>
  </div>
);

export default GoogleSheetsInstructions; 