"use client"

import { useSelectedBaseStore } from '~/stores/selectedBaseStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import TaskBar from '~/app/_components/TaskBar';
import { useState } from 'react';
import { api } from '~/trpc/react';

export default function TablePage() {
    const { selectedBase, hasSelectedBase, getSelectedBaseName } = useSelectedBaseStore();
    const router = useRouter();
    
    // Get bases and workspaces for TaskBar (we'll use empty arrays for now)
    const [bases] = api.base.getAllForUser.useSuspenseQuery();
    const [workspaces] = api.workspace.getAllForUser.useSuspenseQuery();
    
    // Redirect to home if no base is selected
    useEffect(() => {
        if (!hasSelectedBase()) {
            console.log('No base selected, redirecting to home');
            router.push('/');
        }
    }, [hasSelectedBase, router]);

    // Show loading or redirect if no base selected
    if (!selectedBase) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mb-4 text-lg text-gray-600">No base selected</div>
                    <div className="text-sm text-gray-500">Redirecting to home...</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <TaskBar 
                bases={bases} 
                setBases={() => {}} 
                workspaces={workspaces} 
                setWorkspaces={() => {}} 
            />
            
            {/* Main Content */}
            <main className="w-full pl-24 pr-10 mt-14 min-h-[calc(100vh-3.5rem)] bg-[#fbfbfd]">
                <div className="mx-auto max-w-screen-2xl px-6 py-6">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {selectedBase.name}
                            </h1>
                            <p className="text-sm text-gray-600">
                                Base ID: {selectedBase.id}
                            </p>
                        </div>
                        
                        {/* Base Info Card */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                            <h3 className="mb-2 text-sm font-medium text-gray-900">Base Information</h3>
                            <div className="space-y-1 text-xs text-gray-600">
                                <div>Name: {selectedBase.name}</div>
                                <div>Workspace ID: {selectedBase.workspaceId}</div>
                                <div>Last opened: {selectedBase.lastOpenAt.toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Table Placeholder */}
                    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
                        <div className="text-center">
                            <div className="mb-4 text-lg font-medium text-gray-900">
                                🗂️ Table View
                            </div>
                            <p className="mb-6 text-gray-600">
                                This is where your table data will be displayed for <strong>{selectedBase.name}</strong>
                            </p>
                            
                            {/* Debug Info */}
                            <div className="rounded-md bg-gray-50 p-4 text-left">
                                <h4 className="mb-2 text-sm font-medium text-gray-900">Debug Information:</h4>
                                <pre className="text-xs text-gray-600">
                                    {JSON.stringify(selectedBase, null, 2)}
                                </pre>
                            </div>
                            
                            {/* Navigation Buttons */}
                            <div className="mt-6 flex gap-3 justify-center">
                                <button
                                    onClick={() => router.push('/')}
                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    ← Back to Home
                                </button>
                                <button
                                    onClick={() => router.push('/workspaces')}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    View Workspaces
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
