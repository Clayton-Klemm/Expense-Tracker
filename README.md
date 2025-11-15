# 💸 Expense Tracker

**Author:** Clayton Klemm  
**Version:** 0.1  
**Live Demo:** 👉 [https://clayton-klemm.github.io/Expense-Tracker/](https://clayton-klemm.github.io/Expense-Tracker/)

---

## 📘 Overview

**Expense Tracker** is a web-based tool for importing, filtering, and categorizing expense data directly in the browser.  
It’s built with **React + Vite** and processes CSV files entirely in memory — no backend or database required.

Each year, organizing expenses for tax purposes can be tedious and repetitive.  
This project automates that workflow by allowing users to visually sort and total their expenses into categories (or “bins”) in real time.

---

## 🧠 Core Features

✅ **CSV Upload** — drag-and-drop a `.csv` file of your transactions  
✅ **Column Filtering** — select which column to search and filter within  
✅ **Dynamic Category Bins** — create custom bins like “Groceries,” “Fuel,” or “Entertainment”  
✅ **Assign Rows Quickly** — filter visible rows and send them to a chosen bin  
✅ **Real-Time Totals** — see live sum calculations per bin  
✅ **In-Memory Workflow** — all parsing and calculations happen client-side  

---

## 🧩 Technologies & Tools

| Category | Tool |
|-----------|------|
| Frontend Framework | **React (Vite)** |
| Language | JavaScript (ESNext) |
| Styling | CSS (custom layout) |
| File Handling | CSV parsing via FileReader / Papaparse |
| Hosting | GitHub Pages |

---

## 🧱 Architecture & Components

### `src/App.jsx`
Main React component controlling the entire UI and state:
- Manages CSV data, columns, and category bins
- Handles user actions like filtering and assigning expenses
- Renders the two main panels:
  - **Left:** unassigned expenses + filters  
  - **Right:** category bins and totals
- Implements the modal for creating new bins

### `src/components/FileUpload.jsx`
Handles file input logic:
- Reads CSV files with the FileReader API  
- Extracts column headers and passes parsed data back to the parent  
- Calls the `onDataLoaded(rows, columns)` callback from `App.jsx`

### Derived Data Flow
CSV File → Parsing → In-Memory Store → UI Components → Derived Totals

1. User uploads a CSV  
2. CSV parsed → array of row objects  
3. Data stored in top-level React state (`useState`)  
4. Components reactively re-render filtered views and category totals  

---

## ⚙️ Functional Requirements (from spec)

1. Provide a React-based interface for managing expense data  
2. Allow importing of CSV files containing expenses  
3. Let users choose which column to extract unique values from  
4. Enable creation of custom “category bins”  
5. Support filtering, searching, and visual assignment of rows  
6. Display real-time totals for each bin  
7. (Future) Allow saving and re-loading prior configurations  

---

## 📷 Screenshot of the Chart View

<img width="936" height="517" alt="chart view" src="https://github.com/user-attachments/assets/939927d7-3198-41d6-be4e-79d4d1d8faf6" />

---

## 🖥️ Local Development

To run the project locally:

```bash
git clone https://github.com/Clayton-Klemm/Expense-Tracker.git
cd Expense-Tracker
npm install
npm run dev
```
