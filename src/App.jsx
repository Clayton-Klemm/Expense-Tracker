// src/App.jsx
import { useState, useEffect, useRef } from "react";
import FileUpload from "./components/FileUpload";

function App() {
  const [rows, setRows] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [bins, setBins] = useState([]);
  const [isAddingBin, setIsAddingBin] = useState(false);
  const [newBinName, setNewBinName] = useState("");
  const [fileUploaded, setFileUploaded] = useState(false);
  
  const topScrollRef = useRef(null);
  const mainScrollRef = useRef(null);

  // Derived state
  const unassignedRows = rows.filter((row) => !row.category);
  const visibleUnassignedRows = selectedColumn && filterText
    ? unassignedRows.filter((row) =>
        String(row[selectedColumn])
          .toLowerCase()
          .includes(filterText.toLowerCase())
      )
    : unassignedRows;

  const handleAssignFilteredToBin = (binName) => {
    // Update each filtered row to be in this bin
    const updatedRows = rows.map((row) => {
      if (!row.category && visibleUnassignedRows.includes(row)) {
        return { ...row, category: binName };
      }
      return row;
    });
    setRows(updatedRows);
  };

  const handleConfirmAddBin = () => {
    if (newBinName.trim()) {
      setBins([...bins, { id: Date.now(), name: newBinName.trim() }]);
      setNewBinName("");
      setIsAddingBin(false);
    }
  };

  const handleCancelAddBin = () => {
    setNewBinName("");
    setIsAddingBin(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Expense Tracker</h1>
        <p className="subtitle">Upload a CSV file to analyze and categorize your expenses</p>
      </header>
      <main>
        <FileUpload 
          onDataLoaded={(loadedRows, columns) => {
            setRows(loadedRows);
            setAvailableColumns(columns);
            setSelectedColumn(columns[0]);
          }}
        />

        {/* Workspace */}
        <section className="workspace-section">
          <strong>Workspace</strong>

          {rows.length === 0 && (
            <p className="no-data">
              No data loaded yet. Upload a CSV to see your transactions here.
            </p>
          )}

          {rows.length > 0 && (
            <div className="workspace-inner">
              <div className="left-panel">
                <h2 className="section-title">Unassigned expenses</h2>
                <p className="muted">Select a column to filter and enter text to search within that column.</p>

                <div className="filter-row">
                  <div className="filter-controls">
                    <div className="filter-select-wrap">
                      <label className="label-small">Filter by column:</label>
                      <select 
                        value={selectedColumn || ''} 
                        onChange={(e) => setSelectedColumn(e.target.value)} 
                        className="select-input"
                      >
                        {availableColumns.map(column => (
                          <option key={column} value={column}>{column}</option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-input-wrap">
                      <label className="label-small">Contains text:</label>
                      <input 
                        type="text" 
                        value={filterText} 
                        onChange={(e) => setFilterText(e.target.value)}
                        placeholder={`Search in ${selectedColumn || 'selected column'}...`} 
                        className="filter-input" 
                      />
                    </div>
                  </div>
                  <div className="count-info">
                    Showing <strong>{visibleUnassignedRows.length}</strong> of <strong>{unassignedRows.length}</strong> unassigned rows
                  </div>
                </div>

                <div className="list">
                  <div className="table-container">
                    <div className="horizontal-scroll" ref={topScrollRef} style={{ '--scroll-width': `${availableColumns.length * 120}px` }}>
                      <div className="horizontal-scroll-content" />
                    </div>
                    <div className="table-scroll" ref={mainScrollRef}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            {availableColumns.map((column) => (
                              <th key={column} className={`${column.toLowerCase()}-column`}>{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {visibleUnassignedRows.map((row) => (
                            <tr key={row.id}>
                              {availableColumns.map((column) => (
                                <td key={column} className={`${column.toLowerCase()}-column`}>
                                  {column === 'amount' ? parseFloat(row[column]).toFixed(2) : row[column]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {visibleUnassignedRows.length === 0 && (
                    <p className="no-match">No unassigned rows match this filter.</p>
                  )}
                </div>
              </div>

              <div className="right-panel">
                <div className="bins-header-row">
                  <h2 className="section-title">Category bins</h2>
                  <button type="button" onClick={() => setIsAddingBin(true)} className="pill-btn">+ Add bin</button>
                </div>

                {bins.length === 0 && (
                  <p className="muted">
                    You don&apos;t have any bins yet. Click{" "}
                    <strong>+ Add bin</strong> to create one (e.g.
                    &nbsp;<em>Groceries</em>, <em>Gas</em>, <em>Dining out</em>,
                    etc.). Then you can send filtered rows into that bin.
                  </p>
                )}

                {bins.length > 0 && (
                  <div className="bin-list">
                    {bins.map((bin) => {
                      const binRows = rows.filter(
                        (row) => row.category === bin.name
                      );
                      const binTotal = binRows.reduce((sum, row) => {
                        const n = parseFloat(row.amount ?? "0");
                        return sum + (isNaN(n) ? 0 : n);
                      }, 0);

                      return (
                        <div key={bin.id} className="bin">
                          <div className="bin-header">
                            <strong>{bin.name}</strong>
                            <button type="button" onClick={() => handleAssignFilteredToBin(bin.name)} className="small-pill">Send filtered here</button>
                          </div>
                          <div>
                            <span>{binRows.length} rows</span>
                            <span className="bin-total">• Total: <strong>{formatCurrency(binTotal)}</strong></span>
                          </div>

                          {binRows.length > 0 && (
                            <div className="bin-rows">
                              <div className="table-container">
                                <div className="horizontal-scroll" style={{ '--scroll-width': `${availableColumns.length * 120}px` }}>
                                  <div className="horizontal-scroll-content" />
                                </div>
                                <div className="table-scroll">
                                  <table className="data-table compact">
                                    <thead>
                                      <tr>
                                        {availableColumns.map((column) => (
                                          <th key={column} className={`${column.toLowerCase()}-column`}>{column}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {binRows.map((row) => (
                                        <tr key={row.id}>
                                          {availableColumns.map((column) => (
                                            <td key={column} className={`${column.toLowerCase()}-column`}>
                                              {column === 'amount' ? parseFloat(row[column]).toFixed(2) : row[column]}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Simple popup modal for adding a bin */}
      {isAddingBin && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Create new bin</h3>
            <p>Choose a name for this category (e.g. <em>Groceries</em>, <em>Gas</em>, <em>Entertainment</em>).</p>
            <input
              type="text"
              value={newBinName}
              onChange={(e) => setNewBinName(e.target.value)}
              placeholder="Bin name"
              autoFocus
              className="filter-input modal-input"
            />
            <div className="modal-actions">
              <button type="button" onClick={handleCancelAddBin} className="ghost-btn">Cancel</button>
              <button type="button" onClick={handleConfirmAddBin} className="primary-btn">Create bin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
