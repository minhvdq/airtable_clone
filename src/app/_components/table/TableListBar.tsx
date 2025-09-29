"use client"

import { type Table } from "@prisma/client"
import { useRouter } from "next/navigation"
import type React from "react";
import { useState } from "react";

export default function TableListBar({isClient, tables, curTable, handleAddTable, handleTableClick}: {isClient: boolean, tables: Table[], curTable: Table | null, handleAddTable: (e : React.MouseEvent<HTMLButtonElement>) => void, handleTableClick?: (table: Table) => void}) {
    
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);

    const handleTableClickInternal = async (table: Table) => {
        if (isNavigating) return; // Prevent multiple clicks
        
        setIsNavigating(true);
        try {
            if (handleTableClick) {
                // Use the provided handler (from layout)
                handleTableClick(table);
            } else {
                // Fallback to router navigation
                router.push(`/table/${table.id}`);
            }
        } finally {
            // Reset navigation state after a short delay
            setTimeout(() => setIsNavigating(false), 100);
        }
    };

    return (
        <div>
            <div className="bg-purple-100 flex items-center">
                {/* Table tabs */}
                <div className="flex items-center">
                    {isClient && tables.map((table) => (
                        <button
                            key={table.id}
                            onClick={() => handleTableClickInternal(table)}
                            className={`py-2 px-3 text-sm font-medium transition-colors ${
                                curTable?.id === table.id
                                    ? 'bg-white text-gray-800'
                                    : isNavigating
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                            }`}
                        >
                            {table.name}
                            {curTable?.id === table.id && (
                                <svg 
                                    className="inline w-4 h-4 ml-1" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2"
                                >
                                    <polyline points="6,9 12,15 18,9"/>
                                </svg>
                            )}
                        </button>
                    ))}
                </div>

                {/* Add or import button */}
                <div className="flex items-center">
                    <button 
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded transition-colors"
                        onClick={handleAddTable}
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add or import
                    </button>
                </div>

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Tools dropdown */}
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded transition-colors">
                    Tools
                    <svg 
                        className="w-4 h-4" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                    >
                        <polyline points="6,9 12,15 18,9"/>
                    </svg>
                </button>
            </div>
        </div>
    )
}