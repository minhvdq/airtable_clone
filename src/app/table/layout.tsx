"use client"

import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { api } from '~/trpc/react';
import { useTableNavigationStore } from '~/stores/tableNavigationStore';
import TableTaskbar from '~/app/_components/table/TableTaskbar';
import TableListBar from '~/app/_components/table/TableListBar';
import { type Table } from '@prisma/client';

interface TableLayoutProps {
  children: React.ReactNode;
}

export default function TableLayout({ children }: TableLayoutProps) {
  const router = useRouter();
  const { 
    currentTableId, 
    currentViewId, 
    setNavigation 
  } = useTableNavigationStore();

  // Fetch current view data
  const viewQuery = api.view.getById.useQuery({ id: currentViewId ?? "" }, { 
    enabled: !!currentViewId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const view = viewQuery.data;

  // Extract table and base data from the view query
  const table = view?.table ?? null;
  const baseId = table?.baseId ?? null;

  // Fetch base information
  const baseQuery = api.base.getById.useQuery({ id: baseId ?? "" }, { 
    enabled: !!baseId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const base = baseQuery.data ?? null;

  // Fetch all tables for this base
  const tablesQuery = api.table.getAllForBase.useQuery({ baseId: baseId ?? "" }, { 
    enabled: !!baseId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
  const tables = tablesQuery.data ?? [];

  const addTable = api.table.create.useMutation();
  const utils = api.useUtils();

  const handleTableClick = async (table: Table) => {
    try {
      // Get the first view for the clicked table
      const tableViews = await utils.view.getAllForTable.fetch({ tableId: table.id });
      const firstView = tableViews?.[0];
      
      if (firstView) {
        setNavigation(table.id, firstView.id, table.baseId);
        // Update URL without reload
        router.push(`/table/${table.id}/${firstView.id}`, { scroll: false });
      }
    } catch (error) {
      console.error('Error switching table:', error);
    }
  };

  const handleAddTable = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!base?.id) return;
    
    try {
      // Find the maximum table number
      let maxTableNumber = 0;
      if (tables.length > 0) {
        tables.forEach(table => {
          const match = /^Table (\d+)$/.exec(table.name);
          if (match) {
            const tableNumber = parseInt(match[1]!, 10);
            if (tableNumber > maxTableNumber) {
              maxTableNumber = tableNumber;
            }
          }
        });
      }
      
      const newTableName = `Table ${maxTableNumber + 1}`;
      
      const newTable = await addTable.mutateAsync({
        name: newTableName,
        baseId: base.id
      });
      
      if (newTable?.id) {
        // Invalidate tables query to refresh the list
        await utils.table.getAllForBase.invalidate({ baseId: base.id });
        
        // Get the first view for the new table
        const newTableView = await utils.view.getAllForTable.fetch({ tableId: newTable.id });
        const firstView = newTableView?.[0];
        
        if (firstView) {
          setNavigation(newTable.id, firstView.id, newTable.baseId);
          router.push(`/table/${newTable.id}/${firstView.id}`, { scroll: false });
        }
      }
    } catch (error) {
      console.error('Error creating table:', error);
    }
  };

  return (
    <>
      <TableTaskbar />
      
      {/* Main Content */}
      <main className="w-full pt-14 min-h-[calc(100vh-3.5rem)] bg-[#fbfbfd]">
        <div className="mx-auto max-w-screen-2xl pl-14">
          {/* The tables bar */}
          <TableListBar 
            isClient={true}
            tables={tables} 
            curTable={table} 
            handleAddTable={handleAddTable}
            handleTableClick={handleTableClick}
          />
          
          {/* Show subtle loading indicator if data is being refetched */}
          {viewQuery.isFetching && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-2">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-2"></div>
                <div className="text-xs text-blue-600">Updating view...</div>
              </div>
            </div>
          )}
          
          {/* Dynamic content area */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
