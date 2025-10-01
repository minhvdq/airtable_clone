"use client"

import React, { useState, useMemo, useEffect } from 'react';
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
        <div className="text-gray-500 text-sm font-mono w-8 text-center">
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
    <div className="h-full w-full bg-white">
      {/* Table Container with proper overflow */}
      <div className="h-full overflow-auto">
        <table className="w-full min-w-max">
          {/* Table Header */}
          <thead className="bg-gray-50 sticky top-0 z-10">
            {tanstackTable.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
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
            {tanstackTable.getRowModel().rows.map((row) => (
              <tr key={row.id} className="group hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100 last:border-r-0"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {/* Empty row for adding new rows - only show if there are columns */}
            {columns.length > 0 && (
              <tr className="group">
                <td colSpan={columns.length + 2} className="px-4 py-3">
                  <button 
                    onClick={handleAddRow}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
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
  );
}