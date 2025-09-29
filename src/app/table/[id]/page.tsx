"use client"

import { useSelectedBaseStore } from '~/stores/selectedBaseStore';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { api } from '~/trpc/react';
import TableTaskbar from '../../_components/table/TableTaskbar';

export default function TablePage({ params }: { params: { id: string } }) {
    const { selectedBase, hasSelectedBase } = useSelectedBaseStore();
    // const opeBase = api.base.open.useQuery({ id: selectedBase?.id ?? "1" });
    const router = useRouter();
    
    // Get the table ID from the URL params
    // const tableId = params.id
    // console.log("tableId", tableId)
    
    // Redirect to home if no base is selected
    useEffect(() => {
        if (!hasSelectedBase()) {
            console.log('No base selected, redirecting to home');
            router.push('/');
        }
        api.base.open.useMutation({
            onSuccess: () => {
                console.log('Base opened');
            }
        });
        
    }, [hasSelectedBase, router]);


    return (
        <>
            <TableTaskbar />
            
            {/* Main Content */}
            <main className="w-full pl-14 pr-10 pt-14 min-h-[calc(100vh-3.5rem)] bg-[#fbfbfd]">
                <div className="mx-auto max-w-screen-2xl px-6 py-6">
                    
                </div>
            </main>
        </>
    );
}
