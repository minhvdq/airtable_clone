"use client"

import { type Table, type View } from "@prisma/client"
import { useRouter } from "next/navigation"
import type React from "react";
import { useState } from "react";

export default function ViewTaskbar({
    isClient, 
    tables, 
    curTable, 
    curView,
    handleAddTable, 
    handleTableClick
}: {
    isClient: boolean, 
    tables: Table[], 
    curTable: Table | null, 
    curView: View | null,
    handleAddTable: (e : React.MouseEvent<HTMLButtonElement>) => void, 
    handleTableClick?: (table: Table) => void
}) {
    
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
        <div className="bg-white border-b border-gray-200">
            {/* Table List Section */}
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

            {/* View Controls Section */}
            <div className="px-4 py-2">
                <div className="flex items-center justify-between">
                    {/* Left side - Menu and View controls */}
                    <div className="flex items-center space-x-4">
                        {/* Hamburger menu */}
                        <button className="p-1 hover:bg-gray-100 rounded">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Grid icon and view name */}
                        <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-800">{curView?.name ?? 'Loading...'}</span>
                            <button className="p-1 hover:bg-gray-100 rounded">
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Center - View controls */}
                    <div className="flex items-center space-x-6">
                        {/* Hide fields */}
                        <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                            <span>Hide fields</span>
                        </button>

                        {/* Filter */}
                        <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                            </svg>
                            <span>Filter</span>
                        </button>

                        {/* Group */}
                        <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span>Group</span>
                        </button>

                        {/* Sort */}
                        <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            <span>Sort</span>
                        </button>

                        {/* Color */}
                        <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                            </svg>
                            <span>Color</span>
                        </button>

                        {/* Share and sync */}
                        <button className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                            <span>Share and sync</span>
                        </button>
                    </div>

                    {/* Right side - Search */}
                    <div className="flex items-center">
                        <button className="p-2 hover:bg-gray-100 rounded">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}