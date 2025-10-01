"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '~/trpc/react';
import { useTableNavigationStore } from '~/stores/tableNavigationStore';

interface ViewSidebarProps {
  isOpen: boolean;
  tableId: string | null;
  currentViewId: string | null;
}

export default function ViewSidebar({ isOpen, tableId, currentViewId }: ViewSidebarProps) {
  const router = useRouter();
  const { setNavigation } = useTableNavigationStore();
  const [isCreatingView, setIsCreatingView] = useState(false);
  const [newViewName, setNewViewName] = useState("");

  // Fetch views for the current table
  const viewsQuery = api.view.getAllForTable.useQuery({ tableId: tableId ?? "" }, { 
    enabled: !!tableId && isOpen,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // tRPC mutations
  const utils = api.useUtils();
  const createView = api.view.create.useMutation();

  const handleViewClick = (viewId: string) => {
    if (tableId) {
      // Get baseId from the current view or table data
      const currentView = viewsQuery.data?.find(v => v.id === viewId);
      const baseId = currentView?.table?.baseId ?? '';
      setNavigation(tableId, viewId, baseId);
      router.push(`/table/${tableId}/${viewId}`);
    }
  };

  const handleCreateView = async () => {
    if (!tableId || !newViewName.trim()) {
      setIsCreatingView(false);
      setNewViewName("");
      return;
    }

    try {
      const newView = await createView.mutateAsync({
        tableId,
        name: newViewName.trim()
      });
      
      // Invalidate queries to sync across all components
      await utils.view.getAllForTable.invalidate({ tableId });
      
      // Navigate to the new view
      const currentView = viewsQuery.data?.[0];
      const baseId = currentView?.table?.baseId ?? '';
      setNavigation(tableId, newView.id, baseId);
      router.push(`/table/${tableId}/${newView.id}`);
      
      setIsCreatingView(false);
      setNewViewName("");
    } catch (err) {
      console.error("Failed to create view:", err);
      setIsCreatingView(false);
      setNewViewName("");
    }
  };

  const handleCancelCreate = () => {
    setIsCreatingView(false);
    setNewViewName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleCreateView();
    } else if (e.key === 'Escape') {
      handleCancelCreate();
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 p-4">
        {/* Create new view button */}
        {isCreatingView ? (
          <div className="mb-2">
            <input
              type="text"
              placeholder="View name"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => void handleCreateView()}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
        ) : (
          <button 
            onClick={() => setIsCreatingView(true)}
            className="w-full flex items-center gap-1 p-1 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors mb-2"
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <span>Create new...</span>
          </button>
        )}

        {/* Find view input */}
        <div className="relative mb-2">
          <input
            type="text"
            placeholder="Find a view"
            className="w-full pl-8 pr-3 py-1 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Views list */}
        <div className="space-y-1">
          {viewsQuery.isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            </div>
          ) : viewsQuery.data && viewsQuery.data.length > 0 ? (
            viewsQuery.data.map((view) => (
              <button
                key={view.id}
                onClick={() => handleViewClick(view.id)}
                className={`w-full flex items-center gap-3 p-1 text-xs rounded transition-colors ${
                  currentViewId === view.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <span className="truncate">{view.name}</span>
              </button>
            ))
          ) : (
            <div className="text-xs text-gray-500 py-1">No views found</div>
          )}
        </div>
      </div>
    </div>
  );
}
