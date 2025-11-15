// src/App.jsx
import { useState, useRef, useEffect } from "react";
import FileUpload from "./components/FileUpload";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

/* Top-level presentational components to avoid remounting on every App render */
function FilterControls({ columns, selected, onSelect, value, onChange, visibleCount, totalCount, inputRef }) {
  return (
    <div className="filter-row">
      <div className="filter-controls">
        <div className="filter-select-wrap">
          <label className="label-small">Filter by column:</label>
          <select value={selected || ''} onChange={(e) => onSelect(e.target.value)} className="select-input">
            {columns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-input-wrap">
          <label className="label-small">Contains text:</label>
          <input ref={inputRef} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={`Search in ${selected || 'selected column'}...`} className="filter-input" />
        </div>
      </div>
      <div className="count-info">Showing <strong>{visibleCount}</strong> of <strong>{totalCount}</strong> unassigned rows</div>
    </div>
  );
}

function TableView({ rows: tableRows, columns, compact=false, topRef, mainRef }) {
  return (
    <div className="table-container">
      <div className="horizontal-scroll" ref={topRef} style={{ '--scroll-width': `${columns.length * 120}px` }}>
        <div className="horizontal-scroll-content" />
      </div>
      <div className="table-scroll" ref={mainRef}>
        <table className={`data-table ${compact ? 'compact' : ''}`}>
          <thead>
            <tr>{columns.map((col) => <th key={col} className={`${col.toLowerCase()}-column`}>{col}</th>)}</tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={col} className={`${col.toLowerCase()}-column`}>{col === 'amount' ? parseFloat(row[col]).toFixed(2) : row[col]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function App() {
  const [rows, setRows] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [bins, setBins] = useState([]);
  const [isAddingBin, setIsAddingBin] = useState(false);
  const [newBinName, setNewBinName] = useState("");
  const [currentView, setCurrentView] = useState("table");

  const topScrollRef = useRef(null);
  const mainScrollRef = useRef(null);
  const filterInputRef = useRef(null);

  // Derived state helpers
  const unassignedRows = rows.filter((r) => !r.category);
  const visibleUnassignedRows = selectedColumn && filterText
    ? unassignedRows.filter((row) => String(row[selectedColumn]).toLowerCase().includes(filterText.toLowerCase()))
    : unassignedRows;

  const [binHistory, setBinHistory] = useState({});

  const assignFilteredToBin = (binName) => {
    // find ids that will be assigned
    const toAssignIds = visibleUnassignedRows.filter((r) => !r.category).map((r) => r.id);
    if (toAssignIds.length === 0) return;

    // apply assignment
    setRows((prev) => prev.map((row) => (toAssignIds.includes(row.id) ? { ...row, category: binName } : row)));

    // record history (stack) for undo
    setBinHistory((prev) => {
      const prevStack = prev[binName] ? [...prev[binName]] : [];
      return { ...prev, [binName]: [...prevStack, toAssignIds] };
    });
  };

  const confirmAddBin = () => {
    if (!newBinName.trim()) return;
    setBins((b) => [...b, { id: Date.now(), name: newBinName.trim() }]);
    setNewBinName("");
    setIsAddingBin(false);
  };

  // Ensure the text input keeps focus even if React re-renders/remounts it
  useEffect(() => {
    if (filterInputRef.current) {
      try {
        filterInputRef.current.focus();
      } catch (e) {
        // ignore
      }
    }
  }, [filterText]);

  const cancelAddBin = () => {
    setNewBinName("");
    setIsAddingBin(false);
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  // Per-bin assignment history for undo (map: binName -> array of batches (array of row ids))
  // setBinHistory keeps a stack of assignment batches so the user can undo the most recent assign.
  const undoBin = (binName) => {
    setBinHistory((prev) => {
      const stack = prev[binName] ? [...prev[binName]] : [];
      if (stack.length === 0) return prev;
      const lastBatch = stack.pop();
      // revert rows in lastBatch to unassigned
      setRows((prevRows) => prevRows.map((row) => (lastBatch.includes(row.id) ? { ...row, category: undefined } : row)));
      return { ...prev, [binName]: stack };
    });
  };

  const clearBin = (binName) => {
    // find all ids currently in this bin
    const idsInBin = rows.filter((r) => r.category === binName).map((r) => r.id);
    if (idsInBin.length === 0) return;
    // unset category for all those rows
    setRows((prevRows) => prevRows.map((row) => (idsInBin.includes(row.id) ? { ...row, category: undefined } : row)));
    // clear history for this bin
    setBinHistory((prev) => ({ ...prev, [binName]: [] }));
  };

  const deleteBin = (binId, binName) => {
    // clear all rows from the bin first
    const idsInBin = rows.filter((r) => r.category === binName).map((r) => r.id);
    setRows((prevRows) => prevRows.map((row) => (idsInBin.includes(row.id) ? { ...row, category: undefined } : row)));
    // remove the bin
    setBins((prevBins) => prevBins.filter((b) => b.id !== binId));
    // clear history for this bin
    setBinHistory((prev) => ({ ...prev, [binName]: [] }));
  };

  /* UnassignedPanel, BinsPanel and AddBinModal remain as internal components */

  const UnassignedPanel = () => (
    <div className="left-panel">
      <h2 className="section-title">Unassigned expenses</h2>
      <p className="muted">Select a column to filter and enter text to search within that column.</p>
      <FilterControls
        columns={availableColumns}
        selected={selectedColumn}
        onSelect={setSelectedColumn}
        value={filterText}
        onChange={setFilterText}
        visibleCount={visibleUnassignedRows.length}
        totalCount={unassignedRows.length}
        inputRef={filterInputRef}
      />

      <div className="list">
        <TableView rows={visibleUnassignedRows} columns={availableColumns} topRef={topScrollRef} mainRef={mainScrollRef} />
        {visibleUnassignedRows.length === 0 && <p className="no-match">No unassigned rows match this filter.</p>}
      </div>
    </div>
  );

  const BinsPanel = () => (
    <div className="right-panel">
      <div className="bins-header-row">
        <h2 className="section-title">Category bins</h2>
        <button type="button" onClick={() => setIsAddingBin(true)} className="pill-btn">+ Add bin</button>
      </div>

      {bins.length === 0 && (
        <p className="muted">You don't have any bins yet. Click <strong>+ Add bin</strong> to create one (e.g. <em>Groceries</em>, <em>Gas</em>, <em>Dining out</em>).</p>
      )}

      {bins.length > 0 && (
        <div className="bin-list">
          {bins.map((bin) => {
            const binRows = rows.filter((r) => r.category === bin.name);
            const binTotal = binRows.reduce((s, r) => s + (isNaN(parseFloat(r[amountColumn] ?? '0')) ? 0 : parseFloat(r[amountColumn])), 0);

            return (
              <div key={bin.id} className="bin">
                <div className="bin-header">
                  <strong>{bin.name}</strong>
                  <div style={{display:'flex',gap:8}}>
                    <button type="button" onClick={() => assignFilteredToBin(bin.name)} className="small-pill">Send filtered here</button>
                    <button type="button" onClick={() => undoBin(bin.name)} className="small-pill" disabled={!(binHistory[bin.name] && binHistory[bin.name].length>0)}>Undo</button>
                    <button type="button" onClick={() => clearBin(bin.name)} className="small-pill" disabled={binRows.length===0}>Clear</button>
                    <button type="button" onClick={() => deleteBin(bin.id, bin.name)} className="trash-btn" title="Delete this category">🗑️</button>
                  </div>
                </div>
                <div>
                  <span>{binRows.length} rows</span>
                  <span className="bin-total">• Total: <strong>{formatCurrency(binTotal)}</strong></span>
                </div>

                {binRows.length > 0 && (
                  <div className="bin-rows">
                    <TableView rows={binRows} columns={availableColumns} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const AddBinModal = () => (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Create new bin</h3>
        <p>Choose a name for this category (e.g. <em>Groceries</em>, <em>Gas</em>, <em>Entertainment</em>).</p>
        <input type="text" value={newBinName} onChange={(e) => setNewBinName(e.target.value)} placeholder="Bin name" autoFocus className="filter-input modal-input" />
        <div className="modal-actions">
          <button type="button" onClick={cancelAddBin} className="ghost-btn">Cancel</button>
          <button type="button" onClick={confirmAddBin} className="primary-btn">Create bin</button>
        </div>
      </div>
    </div>
  );

  // Find the amount column (case-insensitive)
  const amountColumn = availableColumns?.find((col) => col.toLowerCase() === 'amount');

  const chartData = bins.map((bin) => {
    const binRows = rows.filter((r) => r.category === bin.name);
    const total = binRows.reduce((s, r) => {
      const amount = parseFloat(r[amountColumn] ?? '0');
      return s + (isNaN(amount) ? 0 : amount);
    }, 0);
    return { name: bin.name, value: parseFloat(Math.abs(total).toFixed(2)) };
  }).filter((item) => item.value > 0);

  const COLORS = ['#0ea5a4', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#f87171'];

  const ChartView = () => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const CustomPieTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const { name, value } = payload[0];
        const percentage = ((value / total) * 100).toFixed(1);
        return (
          <div style={{background:'#fff',padding:'8px',border:'1px solid #ccc',borderRadius:'4px'}}>
            <p style={{margin:'0 0 4px 0',fontWeight:'600'}}>{name}</p>
            <p style={{margin:'0 0 2px 0'}}>${value.toFixed(2)}</p>
            <p style={{margin:'0'}}>{percentage}%</p>
          </div>
        );
      }
      return null;
    };

    return (
    <div className="chart-view">
      <h2 className="section-title">Overview</h2>
      {chartData.length === 0 ? (
        <p className="muted">No data to display. Add items to categories to see charts.</p>
      ) : (
        <div className="charts-grid">
          <div className="chart-container">
            <h3>Distribution (Pie Chart)</h3>
            <ResponsiveContainer width={500} height={300}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-container">
            <h3>Totals (Bar Chart)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Bar dataKey="value" fill="#0ea5a4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Expense Tracker</h1>
        <p className="subtitle">Upload a CSV file to analyze and categorize your expenses</p>
      </header>

      <main>
        <FileUpload onDataLoaded={(loadedRows, columns) => { setRows(loadedRows); setAvailableColumns(columns); setSelectedColumn(columns[0]); }} />

        <section className="workspace-section">
          <div className="view-tabs">
            <button type="button" onClick={() => setCurrentView("table")} className={`tab-btn ${currentView === "table" ? "active" : ""}`}>📊 Table</button>
            <button type="button" onClick={() => setCurrentView("charts")} className={`tab-btn ${currentView === "charts" ? "active" : ""}`}>📈 Charts</button>
          </div>

          {rows.length === 0 && <p className="no-data">No data loaded yet. Upload a CSV to see your transactions here.</p>}

          {rows.length > 0 && currentView === "table" && (
            <div className="workspace-inner">
              <UnassignedPanel />
              <BinsPanel />
            </div>
          )}

          {rows.length > 0 && currentView === "charts" && <ChartView />}
        </section>
      </main>

      {isAddingBin && <AddBinModal />}
    </div>
  );
}

export default App;
