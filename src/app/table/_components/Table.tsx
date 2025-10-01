"use client"

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { type View, type Table } from "@prisma/client";
import { api } from "~/trpc/react";
import { ColumnType } from '@prisma/client';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
    type ColumnFiltersState,
  } from '@tanstack/react-table';

// Define table data types
type TableColumn = {
  id: string;
  name: string;
  type: 'text' | 'number';
  width?: number;
};

type TableRow = {
  id: string;
  [key: string]: string | number;
};

const columnHelper = createColumnHelper<TableRow>();

export default function Table({ view: _view, table: _table }: { view: View; table: Table }) {
  const getColumns = api.column.getAllForTable.useQuery({ tableId: _table.id });
  const getRows = api.row.getAllForTable.useQuery({ tableId: _table.id });
  const getAllCells = api.cell.getAllForTable.useQuery({ tableId: _table.id });
  const createColumnAPI = api.column.create.useMutation();
  const createRowAPI = api.row.create.useMutation();
  const createCellAPI = api.cell.create.useMutation();
  const updateCellAPI = api.cell.update.useMutation();

  const fcolumns = useMemo(() => getColumns.data ?? [], [getColumns.data]);
  const frows = useMemo(() => getRows.data ?? [], [getRows.data]);
  const allCells = useMemo(() => getAllCells.data ?? [], [getAllCells.data]);
  
  // Table state for sorting and filtering
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  // Modal state for adding columns
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<ColumnType>(ColumnType.STRING);
  const [columnNameError, setColumnNameError] = useState('');
  
  // Cell selection state
  const [selectedCell, setSelectedCell] = useState<{rowIndex: number, columnIndex: number} | null>(null);
  const [editingCell, setEditingCell] = useState<{rowIndex: number, columnIndex: number} | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [cellError, setCellError] = useState<string>('');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Table state management with fetched data
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [rows, setRows] = useState<TableRow[]>([]);

  const updatedColumns = useMemo(() => 
    fcolumns.map((col) => ({
      id: col.id,
      name: col.name,
      type: col.type === ColumnType.STRING ? 'text' : 'number',
      width: 200,
    }) as TableColumn), [fcolumns]
  );
  // Map rows with their cells, ordered by column position
  const updatedRows = useMemo(() => 
    frows.map((row) => {
      const rowCells = allCells.filter(cell => cell.rowId === row.id);
      
      // Create an object with columnId as key and cell value as value
      const cellMap: Record<string, string | number> = {};
      rowCells.forEach(cell => {
        cellMap[cell.columnId] = cell.value as string | number;
      });

      // Create row object with all column values in the correct order
      const rowData: TableRow = { id: row.id };
      fcolumns.forEach(col => {
        rowData[col.id] = cellMap[col.id] ?? '';
      });

      return rowData;
    }), [frows, allCells, fcolumns]
  );

  useEffect(() => {
    setColumns(updatedColumns);
    setRows(updatedRows);
  }, [updatedColumns, updatedRows])

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAddColumnModal) {
        const target = event.target as Element;
        if (!target.closest('.add-column-modal')) {
          handleCancelAddColumn();
        }
      }
    };

    if (showAddColumnModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddColumnModal]);

  // Cell editing functions
  const validateCellValue = (value: string, columnType: string): boolean => {
    if (columnType === 'number') {
      if (value === '' || value === null || value === undefined) return true; // Allow empty
      const num = Number(value);
      return !isNaN(num) && isFinite(num);
    }
    return true; // String type always valid
  }

  const handleCellEdit = useCallback(async (newValue: string) => {
    if (!editingCell) return;
    
    const { rowIndex, columnIndex } = editingCell;
    const column = columns[columnIndex];
    const row = rows[rowIndex];
    
    if (!column || !row) return;

    // Validate the value
    if (!validateCellValue(newValue, column.type)) {
      setCellError('Please enter a number');
      return;
    }

    setCellError('');
    
    // Update client state immediately (optimistic update)
    setRows(prevRows => 
      prevRows.map((r, idx) => 
        idx === rowIndex 
          ? { ...r, [column.id]: column.type === 'number' ? (newValue === '' ? '' : Number(newValue)) : newValue } as TableRow
          : r
      )
    );

    // Find the cell to update
    const cellToUpdate = allCells.find(cell => 
      cell.rowId === row.id && cell.columnId === column.id
    );

    if (cellToUpdate) {
      // Update existing cell
      try {
        await updateCellAPI.mutateAsync({
          id: cellToUpdate.id,
          value: String(column.type === 'number' ? (newValue === '' ? '' : Number(newValue)) : newValue)
        });
      } catch (error) {
        console.error('Error updating cell:', error);
        // Revert optimistic update on error
        setRows(prevRows => 
          prevRows.map((r, idx) => 
            idx === rowIndex 
              ? { ...r, [column.id]: cellToUpdate.value } as TableRow
              : r
          )
        );
      }
    } else {
      // Create new cell if it doesn't exist
      try {
        await createCellAPI.mutateAsync({
          rowId: row.id,
          columnId: column.id,
          value: String(column.type === 'number' ? (newValue === '' ? '' : Number(newValue)) : newValue)
        });
      } catch (error) {
        console.error('Error creating cell:', error);
        // Revert optimistic update on error
        setRows(prevRows => 
          prevRows.map((r, idx) => 
            idx === rowIndex 
              ? { ...r, [column.id]: '' } as TableRow
              : r
          )
        );
      }
    }

    setEditingCell(null);
    setEditingValue('');
  }, [editingCell, columns, rows, allCells, updateCellAPI, createCellAPI]);

  const moveToNextCell = useCallback((direction: 'down' | 'right') => {
    if (!editingCell) return;
    
    const { rowIndex, columnIndex } = editingCell;
    let newRowIndex = rowIndex;
    let newColumnIndex = columnIndex;

    if (direction === 'down') {
      newRowIndex = Math.min(rows.length - 1, rowIndex + 1);
    } else {
      newColumnIndex = Math.min(columns.length - 1, columnIndex + 1);
    }

    setEditingCell({ rowIndex: newRowIndex, columnIndex: newColumnIndex });
    setSelectedCell({ rowIndex: newRowIndex, columnIndex: newColumnIndex });
    
    const newColumn = columns[newColumnIndex];
    const newRow = rows[newRowIndex];
    if (newColumn && newRow) {
      const currentValue = newRow[newColumn.id] ?? '';
      setEditingValue(String(currentValue));
    }
    setCellError('');
  }, [editingCell, rows, columns]);

  // Keyboard navigation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If we're editing a cell, handle editing-specific keys
      if (editingCell) {
        switch (e.key) {
        case 'Enter':
          e.preventDefault();
          void handleCellEdit(editingValue);
          moveToNextCell('down');
          return;
        case 'Tab':
          e.preventDefault();
          void handleCellEdit(editingValue);
          moveToNextCell('right');
          return;
          case 'Escape':
            e.preventDefault();
            setEditingCell(null);
            setEditingValue('');
            setCellError('');
            return;
        }
        return; // Don't handle other keys when editing
      }

      // If we're not editing, handle navigation keys
      if (!selectedCell) return;

      const { rowIndex, columnIndex } = selectedCell;
      const maxRow = rows.length - 1;
      const maxCol = columns.length - 1;

      let newRowIndex = rowIndex;
      let newColumnIndex = columnIndex;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newRowIndex = Math.max(0, rowIndex - 1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newRowIndex = Math.min(maxRow, rowIndex + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newColumnIndex = Math.max(0, columnIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newColumnIndex = Math.min(maxCol, columnIndex + 1);
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            if (columnIndex > 0) {
              newColumnIndex = columnIndex - 1;
            } else if (rowIndex > 0) {
              newRowIndex = rowIndex - 1;
              newColumnIndex = maxCol;
            }
          } else {
            if (columnIndex < maxCol) {
              newColumnIndex = columnIndex + 1;
            } else if (rowIndex < maxRow) {
              newRowIndex = rowIndex + 1;
              newColumnIndex = 0;
            }
          }
          break;
        case 'Escape':
          setSelectedCell(null);
          return;
        // Start editing on any printable character
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            const column = columns[columnIndex];
            const row = rows[rowIndex];
            if (column && row) {
              setEditingCell({ rowIndex, columnIndex });
              setEditingValue(e.key);
              setCellError('');
            }
          }
          return;
      }
      
      setSelectedCell({ rowIndex: newRowIndex, columnIndex: newColumnIndex });
      
      // Scroll to the new selected cell
      setTimeout(() => {
        scrollToSelectedCell(newRowIndex, newColumnIndex);
      }, 0);
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [selectedCell, editingCell, editingValue, rows.length, columns.length, rows, columns, handleCellEdit, moveToNextCell]);

  // Auto-scroll to selected cell when selection changes
  useEffect(() => {
    if (selectedCell) {
      setTimeout(() => {
        scrollToSelectedCell(selectedCell.rowIndex, selectedCell.columnIndex);
      }, 0);
    }
  }, [selectedCell]);

  const createColumn = async ({name, type}: {name: string, type: ColumnType}) => {
    // Check for duplicate column name
    const existingColumn = columns.find(col => 
      col.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingColumn) {
      setColumnNameError(`A column with the name "${name}" already exists. Please choose a different name.`);
      return;
    }
    
    // Generate temporary ID for optimistic update
    const tempColumnId = `temp_col_${Date.now()}`;
    
    // Create optimistic column data
    const optimisticColumn: TableColumn = {
      id: tempColumnId,
      name: name,
      type: type === ColumnType.STRING ? 'text' : 'number',
      width: 200,
    };
    
    // Add column to UI immediately (optimistic update)
    setColumns([...columns, optimisticColumn]);
    
    // Update all existing rows with the new column (empty value)
    setRows(rows.map(row => ({
      ...row,
      [tempColumnId]: ''
    })));
    
    // Close modal and reset form immediately
    setShowAddColumnModal(false);
    setNewColumnName('');
    setNewColumnType(ColumnType.STRING);
    
    try {
      // Create the column in the database
      const column = await createColumnAPI.mutateAsync({ 
        name: name, 
        type: type, 
        tableId: _table.id, 
        position: columns.length * 1000 
      });
      
      // Prepare all cell creation promises for existing rows
      const cellPromises = rows.map(row => 
        createCellAPI.mutateAsync({ 
          rowId: row.id, 
          columnId: column.id, 
          value: '' 
        })
      );
      
      // Execute all cell creations in parallel
      await Promise.all(cellPromises);
      
      // Update the column with the real ID from database
      setColumns(prevColumns => 
        prevColumns.map(col => 
          col.id === tempColumnId 
            ? {
                id: column.id,
                name: column.name,
                type: column.type === ColumnType.STRING ? 'text' : 'number',
                width: 200,
              }
            : col
        )
      );
      
      // Update rows with the real column ID
      setRows(prevRows => 
        prevRows.map(row => {
          const { [tempColumnId]: tempValue, ...rest } = row;
          return {
            ...rest,
            [column.id]: tempValue
          } as TableRow;
        })
      );
    } catch (error) {
      console.error('Error creating column:', error);
      // Remove the optimistic column if creation failed
      setColumns(prevColumns => prevColumns.filter(col => col.id !== tempColumnId));
      setRows(prevRows => 
        prevRows.map(row => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [tempColumnId]: _tempValue, ...rest } = row;
          return rest as TableRow;
        })
      );
    }
  }

  const validateColumnName = (name: string) => {
    if (!name.trim()) {
      setColumnNameError('');
      return true;
    }
    
    const existingColumn = columns.find(col => 
      col.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingColumn) {
      setColumnNameError(`A column with the name "${name}" already exists. Please choose a different name.`);
      return false;
    }
    
    setColumnNameError('');
    return true;
  }

  const handleAddColumn = () => {
    if (newColumnName.trim() && validateColumnName(newColumnName.trim())) {
      createColumn({ name: newColumnName.trim(), type: newColumnType }).catch(error => console.error('Error creating column:', error));
    }
  }

  const handleCancelAddColumn = () => {
    setShowAddColumnModal(false);
    setNewColumnName('');
    setNewColumnType(ColumnType.STRING);
    setColumnNameError('');
  }

  // Cell selection and navigation functions
  const handleCellClick = (rowIndex: number, columnIndex: number) => {
    console.log('Cell clicked:', { rowIndex, columnIndex });
    setSelectedCell({ rowIndex, columnIndex });
    setEditingCell(null);
    setCellError('');
  }

  const handleCellDoubleClick = (rowIndex: number, columnIndex: number) => {
    console.log('Cell double-clicked:', { rowIndex, columnIndex });
    const column = columns[columnIndex];
    const row = rows[rowIndex];
    if (!column || !row) return;
    
    const currentValue = row[column.id] ?? '';
    setEditingCell({ rowIndex, columnIndex });
    setEditingValue(String(currentValue));
    setCellError('');
  }

  const scrollToSelectedCell = (rowIndex: number, columnIndex: number) => {
    // Find the selected cell element
    const cellElement = tableContainerRef.current?.querySelector(
      `[data-row-index="${rowIndex}"][data-column-index="${columnIndex}"]`
    );
    
    if (cellElement) {
      // Scroll the cell into view with some padding
      cellElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }



  const handleAddRow = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!_table.id) return;
    
    // Generate temporary ID for optimistic update
    const tempId = `temp_${Date.now()}`;
    
    // Create optimistic row data
    const optimisticRowData: TableRow = { id: tempId };
    columns.forEach(column => {
      optimisticRowData[column.id] = '';
    });
    
    // Add row to UI immediately (optimistic update)
    setRows([...rows, optimisticRowData]);
    
    try {
      // Create the row in the database
      const newRow = await createRowAPI.mutateAsync({ 
        tableId: _table.id, 
        position: rows.length * 1000 
      });
      
      // Prepare all cell creation promises
      const cellPromises = columns.map(column => 
        createCellAPI.mutateAsync({ 
          rowId: newRow.id, 
          columnId: column.id, 
          value: '' 
        })
      );
      
      // Execute all cell creations in parallel
      await Promise.all(cellPromises);
      
      // Update the row with the real ID from database
      setRows(prevRows => 
        prevRows.map(row => 
          row.id === tempId 
            ? { ...row, id: newRow.id }
            : row
        )
      );
    } catch (error) {
      console.error('Error creating row:', error);
      // Remove the optimistic row if creation failed
      setRows(prevRows => prevRows.filter(row => row.id !== tempId));
    }
  }

  // Create table columns dynamically
  const tableColumns = useMemo(() => [
    // Counter column (not part of data)
    columnHelper.display({
      id: 'counter',
      header: '',
      cell: ({ row }) => (
        <div className="text-gray-500 text-xs font-mono w-8 text-center">
          {row.index + 1}
        </div>
      ),
      size: 32,
    }),
    // Data columns
    ...columns.map((col) => 
      columnHelper.accessor(col.id, {
        header: col.name,
        cell: ({ getValue }) => {
          const value = getValue();
          if (col.type === 'number') {
            // For number fields, only display if there's a value, otherwise show nothing
            if (value === '' || value === null || value === undefined) {
              return '';
            }
            return typeof value === 'number' ? value.toLocaleString() : value;
          }
          return value;
        },
        size: col.width ?? 150,
      })
    ),
  ], [columns]);

  // Initialize the TanStack table
  const tanstackTable = useReactTable({
    data: rows,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

    return (
    <div className="h-full w-full bg-gray-100 flex flex-col">
      {/* Debug info */}
      {selectedCell && (
        <div className="bg-gray-100 p-2 text-xs text-gray-600 flex-shrink-0">
          Selected: Row {selectedCell.rowIndex}, Column {selectedCell.columnIndex}
        </div>
      )}
      
      {/* Table Container with scrollable margins */}
      <div ref={tableContainerRef} className="flex-1 overflow-auto min-h-0">
        <div className="pr-32 pb-20">
          <table className="w-full min-w-max">
          {/* Table Header */}
          <thead className="bg-white sticky top-0 z-10 h-4">
            {tanstackTable.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                     className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-r border-b border-gray-200 last:border-r-0"
                    style={{ width: header.getSize() }}
                  >
                    <div
                      className={`flex items-center gap-2 ${
                        header.column.getCanSort() ? 'cursor-pointer hover:text-gray-700' : ''
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <div className="flex flex-col">
                          <svg
                            className={`w-3 h-3 ${
                              header.column.getIsSorted() === 'asc' ? 'text-gray-900' : 'text-gray-400'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
                {/* Add Column Button */}
                <th className="px-2 py-3 border-r border-gray-200 relative">
                  <button 
                    onClick={() => setShowAddColumnModal(true)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Add column"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                  
                  {/* Small Modal positioned below the button */}
                  {showAddColumnModal && (
                    <div className="absolute top-full left-0 mt-1 z-50 add-column-modal">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Add Column</h4>
                        
                        <div className="space-y-3">
                          {/* Column Name Input */}
                          <div>
                            <input
                              type="text"
                              value={newColumnName}
                              onChange={(e) => {
                                setNewColumnName(e.target.value);
                                validateColumnName(e.target.value);
                              }}
                              placeholder="Column name"
                              className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:border-transparent ${
                                columnNameError 
                                  ? 'border-red-300 focus:ring-red-500' 
                                  : 'border-gray-300 focus:ring-blue-500'
                              }`}
                              autoFocus
                            />
                            {columnNameError && (
                              <p className="mt-1 text-xs text-red-600">{columnNameError}</p>
                            )}
                          </div>

                          {/* Column Type Dropdown */}
        <div>
                            <select
                              value={newColumnType}
                              onChange={(e) => setNewColumnType(e.target.value as ColumnType)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value={ColumnType.STRING}>String</option>
                              <option value={ColumnType.INTEGER}>Number</option>
                            </select>
                          </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex justify-end space-x-2 mt-3">
                          <button
                            onClick={handleCancelAddColumn}
                            className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddColumn}
                            disabled={!newColumnName.trim() || !!columnNameError}
                            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </th>
              </tr>
            ))}
          </thead>

          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {tanstackTable.getRowModel().rows.map((row, rowIndex) => (
              <tr key={row.id} className="group hover:bg-gray-50">
                {row.getVisibleCells().map((cell, cellIndex) => {
                  // Skip the counter column (index 0) - data columns start from index 1
                  const isDataColumn = cellIndex > 0;
                  const dataColumnIndex = cellIndex - 1; // Convert to 0-based index for data columns
                  const isSelected = selectedCell?.rowIndex === rowIndex && selectedCell?.columnIndex === dataColumnIndex;
                  
                  // Debug logging
                  if (isDataColumn && isSelected) {
                    console.log('Cell is selected:', { rowIndex, dataColumnIndex, selectedCell });
                  }
                  
                  const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnIndex === dataColumnIndex;
                  const hasError = isEditing && cellError;
                  const currentColumn = columns[dataColumnIndex];
                  
                  return (
                    <td
                      key={cell.id}
                      onClick={() => isDataColumn && handleCellClick(rowIndex, dataColumnIndex)}
                      onDoubleClick={() => isDataColumn && handleCellDoubleClick(rowIndex, dataColumnIndex)}
                      data-row-index={rowIndex}
                      data-column-index={dataColumnIndex}
                      className={`px-3 py-2 text-xs text-gray-900 bg-white relative ${
                        isDataColumn ? 'cursor-pointer' : ''
                      } ${
                        isSelected 
                          ? 'border-2 border-blue-500' 
                          : 'border-r border-b border-gray-200 last:border-r-0 hover:bg-gray-50'
                      }`}
                    >
                      {isEditing ? (
                        <div className="relative">
                          <input
                            type={currentColumn && currentColumn.type === 'number' ? 'number' : 'text'}
                            value={editingValue}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setEditingValue(newValue);
                              
                              // Clear error if user starts typing a valid number
                              if (currentColumn && currentColumn.type === 'number') {
                                if (newValue === '' || !isNaN(Number(newValue))) {
                                  setCellError('');
                                } else {
                                  setCellError('Please enter a number');
                                }
                              } else {
                                setCellError('');
                              }
                            }}
                            onKeyDown={(e) => {
                              // Prevent typing non-numeric characters in number fields
                              if (currentColumn && currentColumn.type === 'number') {
                                // Allow: backspace, delete, tab, escape, enter, arrow keys, and numbers
                                const allowedKeys = [
                                  'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                                  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                                  'Home', 'End'
                                ];
                                
                                // Allow numbers, decimal point, and minus sign
                                const isNumber = /^[0-9.-]$/.test(e.key);
                                
                                if (!allowedKeys.includes(e.key) && !isNumber) {
                                  e.preventDefault();
                                  setCellError('Please enter a number');
                                }
                              }
                            }}
                            onBlur={() => handleCellEdit(editingValue)}
                            className="w-full bg-transparent border-none outline-none text-xs"
                            autoFocus
                          />
                          {hasError && (
                            <div className="absolute top-full left-0 right-0 bg-red-50 text-red-600 text-xs px-2 py-1 border border-red-200 rounded-b z-10">
                              {cellError}
                            </div>
                          )}
                        </div>
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Empty row for adding new rows - only show if there are columns */}
            {columns.length > 0 && (
              <tr className="group">
                <td colSpan={columns.length + 2} className="px-3 py-2 bg-white">
                  <button 
                    onClick={handleAddRow}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add a record
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
      {/* Record count bar - positioned relative to table container */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between z-20">
        <div className="text-xs text-gray-600">
        {rows.length} record{rows.length !== 1 ? 's' : ''}
        </div>
        <div className="text-xs text-gray-500">
        {columns.length} column{columns.length !== 1 ? 's' : ''}
        </div>
    </div>


    </div>
  );
}