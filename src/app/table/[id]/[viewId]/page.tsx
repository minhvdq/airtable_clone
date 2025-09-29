"use client"

import React, { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '~/trpc/react';
import { useTableNavigationStore } from '~/stores/tableNavigationStore';

export default function ViewPage({ params }: { params: Promise<{ id: string; viewId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const tableId = resolvedParams.id;
    const viewId = resolvedParams.viewId;
    const { setNavigation } = useTableNavigationStore();

    // Fetch the view with all related data (optimized single query)
    const viewQuery = api.view.getById.useQuery({ id: viewId }, { 
        enabled: !!viewId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
    const view = viewQuery.data;

    // Extract table and base data from the view query
    const table = view?.table ?? null;
    const baseId = table?.baseId ?? null;

    // Update navigation state when data is loaded
    useEffect(() => {
        if (view && table && baseId) {
            setNavigation(tableId, viewId, baseId);
        }
    }, [view, table, baseId, tableId, viewId, setNavigation]);

    // Handle redirects when data is not found
    useEffect(() => {
        if (!tableId || !viewId) {
            console.log('Missing table or view ID, redirecting to home');
            router.push('/');
            return;
        }

        // Only redirect if the query has finished with no data
        if (viewQuery.isSuccess && !view) {
            console.log('No view found, redirecting to home');
            router.push('/');
            return;
        }
    }, [tableId, viewId, view, router, viewQuery.isSuccess]);

    // Show loading state while fetching data
    if (viewQuery.isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-gray-600">Loading view data...</div>
            </div>
        );
    }

    // Show error state if no data found
    if (!view || !table) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-red-600">View not found</div>
            </div>
        );
    }

    // Extract view-specific data for display
    const filters = view?.filters ?? [];
    const sorts = view?.sorts ?? [];
    const columns = table?.columns ?? [];
    const rows = table?.rows ?? [];

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
                <h2 className="text-xl font-semibold text-gray-800">
                    {view.name} - {table.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    {columns.length} columns, {rows.length} rows
                    {filters.length > 0 && `, ${filters.length} filters`}
                    {sorts.length > 0 && `, ${sorts.length} sorts`}
                </p>
            </div>
            
            {/* View data display */}
            <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-medium text-gray-700 mb-2">Columns</h3>
                        <div className="space-y-1">
                            {columns.map(column => (
                                <div key={column.id} className="text-sm text-gray-600">
                                    {column.name} ({column.type})
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="font-medium text-gray-700 mb-2">Filters</h3>
                        <div className="space-y-1">
                            {filters.length > 0 ? (
                                filters.map(filter => (
                                    <div key={filter.id} className="text-sm text-gray-600">
                                        {filter.columnId}: {filter.operator} {filter.value}
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-400">No filters applied</div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="mt-4">
                    <h3 className="font-medium text-gray-700 mb-2">Sorts</h3>
                    <div className="space-y-1">
                        {sorts.length > 0 ? (
                            sorts.map(sort => (
                                <div key={sort.id} className="text-sm text-gray-600">
                                    {sort.columnId}: {sort.direction}
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-gray-400">No sorts applied</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}