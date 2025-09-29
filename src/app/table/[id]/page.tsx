"use client"

import { useRouter } from 'next/navigation';
import React, { useEffect, use } from 'react';
import { api } from '~/trpc/react';
import { useTableNavigationStore } from '~/stores/tableNavigationStore';

export default function TablePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const tableId = resolvedParams.id;
    const { setNavigation } = useTableNavigationStore();

    // Fetch views for this table to get the first view
    const viewsQuery = api.view.getAllForTable.useQuery({ tableId }, { enabled: !!tableId });

    // Redirect to the first view when views are loaded
    useEffect(() => {
        if (viewsQuery.data && viewsQuery.data.length > 0) {
            const firstView = viewsQuery.data[0];
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
    }, [viewsQuery.data, viewsQuery.isSuccess, router, tableId, setNavigation]);

    // Show loading state while fetching views
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-gray-600">Loading...</div>
        </div>
    );
}
