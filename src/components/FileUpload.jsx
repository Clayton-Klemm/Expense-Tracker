// src/components/FileUpload.jsx
import Papa from "papaparse";

function FileUpload({ onDataLoaded }) {
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,          // use first row as column headers
      skipEmptyLines: true,
      complete: (results) => {
        // results.data is an array of objects
        // e.g. [{ Date: "2025-01-01", Vendor: "Target", Amount: "42.50" }, ...]
        const processedData = results.data.map(row => ({
          ...row,
          id: crypto.randomUUID() // Add unique ID to each row
        }));
        onDataLoaded(processedData, Object.keys(results.data[0] || {}));
      },
      error: (error) => {
        console.error("CSV parse error:", error);
        alert("There was an error parsing the CSV file. Check the console for details.");
      },
    });
  };

  return (
    <div className="file-upload-container">
      <label className="file-upload-label">Upload expenses CSV:</label>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default FileUpload;
