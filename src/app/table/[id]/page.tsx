"use client"

import { useRouter } from 'next/navigation';
import React, { useEffect, use } from 'react';
import { api } from '~/trpc/react';
import { useTableNavigationStore } from '~/stores/tableNavigationStore';

console.log('🔥 TABLE PAGE FILE LOADED!');

export default function TablePage({ params }: { params: Promise<{ id: string }> }) {
    console.log('🚀 TablePage component rendered!');
    
    const resolvedParams = use(params);
    const router = useRouter();
    const tableId = resolvedParams.id;
    const { setNavigation } = useTableNavigationStore();
    
    // Fetch views for this table to get the first view
    const viewsQuery = api.view.getAllForTable.useQuery({ tableId }, { 
        enabled: !!tableId,
        retry: 1,
        retryDelay: 1000,
        staleTime: 0,
        gcTime: 0,
    });

    // Debug logging
    console.log('TablePage render:', { 
        tableId, 
        isLoading: viewsQuery.isLoading, 
        isError: viewsQuery.isError,
        isSuccess: viewsQuery.isSuccess,
        data: viewsQuery.data,
        error: viewsQuery.error 
    });

    // Redirect to the first view when views are loaded
    useEffect(() => {
        console.log('Views query state:', { 
            isLoading: viewsQuery.isLoading, 
            isError: viewsQuery.isError, 
            isSuccess: viewsQuery.isSuccess,
            data: viewsQuery.data,
            error: viewsQuery.error 
        });

        if (viewsQuery.isError) {
            console.error('Error fetching views:', viewsQuery.error);
            router.push('/');
            return;
        }

        if (viewsQuery.data && viewsQuery.data.length > 0) {
            const firstView = viewsQuery.data[0];
            console.log("firstView", firstView)
            if (firstView?.id) {
                // Update navigation state
                setNavigation(tableId, firstView.id, firstView.table?.baseId ?? '');
                router.replace(`/table/${tableId}/${firstView.id}`);
            }
        } else if (viewsQuery.isSuccess && viewsQuery.data?.length === 0) {
            // If no views exist, redirect to home
            console.log('No views found for table, redirecting to home');
            router.push('/');
        }
    }, [viewsQuery.data, viewsQuery.isSuccess, viewsQuery.isError, viewsQuery.isLoading, viewsQuery.error, router, tableId, setNavigation]);

    // Timeout fallback - redirect to home if query takes too long
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (viewsQuery.isLoading) {
                console.error('Query timeout - redirecting to home');
                router.push('/');
            }
        }, 10000); // 10 second timeout

        return () => clearTimeout(timeout);
    }, [viewsQuery.isLoading, router]);

    // Show loading state while fetching views
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-600">
                Loading table {tableId}... 
                {viewsQuery.isError && <div className="text-red-500 mt-2">Error: {viewsQuery.error?.message}</div>}
            </div>
        </div>
    );
}