"use client"

import React, { useEffect, use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '~/trpc/react';
import { useTableNavigationStore } from '~/stores/tableNavigationStore';
import { type Filter, type Sort, type View } from '@prisma/client';
import Table from '~/app/table/_components/Table';

export default function ViewPage({ params }: { params: Promise<{ id: string; viewId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const tableId = resolvedParams.id;
    const viewId = resolvedParams.viewId;
    const { setNavigation } = useTableNavigationStore();
    
    // Hook states for all data (keeping for future use)
    const [, setView] = useState<View | null>(null);
    const [, setPrismaTable] = useState<unknown>(null);
    const [, setBaseId] = useState<string | null>(null);
    const [, setFilters] = useState<Array<Filter>>([]);
    const [, setSorts] = useState<Array<Sort>>([]);

    // Fetch the view with all related data (optimized single query)
    const viewQuery = api.view.getById.useQuery({ id: viewId }, { 
        enabled: !!viewId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    // Update navigation state and hook states when data is loaded
    useEffect(() => {
        if (viewQuery.data) {
            const viewData = viewQuery.data;
            
            // Update all hook states
            setView(viewData);
            setPrismaTable(viewData.table ?? null);
            setBaseId(viewData.table?.baseId ?? null);
            setFilters(viewData.filters ?? []);
            setSorts(viewData.sorts ?? []);
            
            // Update navigation state
            if (viewData.table?.baseId) {
                setNavigation(tableId, viewId, viewData.table.baseId);
            }
        }
    }, [viewQuery.data, tableId, viewId, setNavigation]);

    // Handle redirects when data is not found
    useEffect(() => {
        if (!tableId || !viewId) {
            console.log('Missing table or view ID, redirecting to home');
            router.push('/');
            return;
        }

        // Only redirect if the query has finished with no data
        if (viewQuery.isSuccess && !viewQuery.data) {
            console.log('No view found, redirecting to home');
            router.push('/');
            return;
        }
    }, [tableId, viewId, router, viewQuery.isSuccess, viewQuery.data]);


    // Show loading state while fetching data
    if (viewQuery.isLoading || !viewQuery.data) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-gray-600">Loading view data...</div>
            </div>
        );
    }

    // Show error state if no data found after loading
    if (viewQuery.isSuccess && !viewQuery.data) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-red-600">View not found</div>
            </div>
        );
    }

    return (
        <Table view={viewQuery.data} table={viewQuery.data?.table ?? null} />
    );
}