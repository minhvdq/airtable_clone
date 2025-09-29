"use client"

import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { api } from '~/trpc/react';
import { useTableNavigationStore } from '~/stores/tableNavigationStore';
import TableTaskbar from '~/app/_components/table/TableTaskbar';
import ViewTaskbar from '~/app/_components/table/ViewTaskbar';
import { type Table } from '@prisma/client';

interface TableLayoutClientProps {
  children: React.ReactNode;
}

export default function TableLayoutClient({ children }: TableLayoutClientProps) {
  const router = useRouter();
  const { 
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
  const table = view?.table ?? null;
  const baseId = table?.baseId;

  // Fetch all tables for this base (for the table list bar)
  const tablesQuery = api.table.getAllForBase.useQuery({ baseId: baseId ?? "" }, { 
    enabled: !!baseId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
  const tables = useMemo(() => tablesQuery.data ?? [], [tablesQuery.data]);

  const addTable = api.table.create.useMutation();
  const utils = api.useUtils();

  const handleTableClick = async (clickedTable: Table) => {
    try {
      // Get the first view for the clicked table
      const tableViews = await utils.view.getAllForTable.fetch({ tableId: clickedTable.id });
      const firstView = tableViews?.[0];
      
      if (firstView) {
        setNavigation(clickedTable.id, firstView.id, clickedTable.baseId);
        // Update URL without reload
        router.push(`/table/${clickedTable.id}/${firstView.id}`, { scroll: false });
      }
    } catch (error) {
      console.error('Error switching table:', error);
    }
  };

  const handleAddTable = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!baseId) return;
    
    try {
      // Find the maximum table number
      let maxTableNumber = 0;
      if (tables.length > 0) {
        tables.forEach(t => {
          const match = /^Table (\d+)$/.exec(t.name);
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
        baseId: baseId
      });
      
      if (newTable?.id) {
        // Invalidate tables query to refresh the list
        await utils.table.getAllForBase.invalidate({ baseId: baseId });
        
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

  // Show loading state for initial load
  if (viewQuery.isLoading || !viewQuery.data) {
    return (
      <>
        <TableTaskbar />
        <main className="w-full pt-14 min-h-[calc(100vh-3.5rem)] bg-[#fbfbfd]">
          <div className="mx-auto max-w-screen-2xl pl-14">
            <div className="bg-purple-100 flex items-center p-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <div className="text-sm text-gray-600">Loading table...</div>
              </div>
            </div>
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-600">Loading view data...</div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TableTaskbar />
      
               {/* Fixed View Taskbar */}
               <div className="fixed left-14 top-14 right-0 z-40">
                 <ViewTaskbar 
                   isClient={true}
                   tables={tables} 
                   curTable={table} 
                   curView={view ?? null}
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
        </div>

      {/* Main Content */}
      <main className="w-full pt-20 pl-14 min-h-[calc(100vh-3.5rem)] bg-[#fbfbfd]">
        <div className="mx-auto max-w-screen-2xl">
          {/* Dynamic content area */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
