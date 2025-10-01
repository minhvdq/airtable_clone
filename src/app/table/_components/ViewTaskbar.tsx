"use client"

import { type Table, type View } from "@prisma/client"
import { useRouter } from "next/navigation"
import React from "react";
import { useState, useRef, useEffect } from "react";
import { api } from "~/trpc/react";

export default function ViewTaskbar({
    isClient, 
    tables, 
    curTable, 
    curView,
    views,
    handleAddTable, 
    handleTableClick,
    onToggleSidebar
}: {
    isClient: boolean, 
    tables: Table[], 
    curTable: Table | null, 
    curView: View | null,
    views: View[],
    handleAddTable: (e : React.MouseEvent<HTMLButtonElement>) => void, 
    handleTableClick?: (table: Table) => void,
    onToggleSidebar?: () => void
}) {
    
    const router = useRouter();
    const [isNavigating, setIsNavigating] = useState(false);
    const [showTableMenu, setShowTableMenu] = useState<string | null>(null);
    const [editingTableId, setEditingTableId] = useState<string | null>(null);
    const [editTableName, setEditTableName] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [showViewMenu, setShowViewMenu] = useState<boolean>(false);
    const [showViewDeleteConfirm, setShowViewDeleteConfirm] = useState<boolean>(false);
    const tableMenuRef = useRef<HTMLDivElement>(null);
    const deleteConfirmRef = useRef<HTMLDivElement>(null);
    const viewMenuRef = useRef<HTMLDivElement>(null);
    const viewDeleteConfirmRef = useRef<HTMLDivElement>(null);

    // tRPC mutations
    const utils = api.useUtils();
    const renameTable = api.table.rename.useMutation();
    const deleteTable = api.table.delete.useMutation();
    const deleteView = api.view.delete.useMutation();

    // Close modals when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tableMenuRef.current && !tableMenuRef.current.contains(event.target as Node)) {
                setShowTableMenu(null);
            }
            if (deleteConfirmRef.current && !deleteConfirmRef.current.contains(event.target as Node)) {
                setShowDeleteConfirm(null);
            }
            if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
                setShowViewMenu(false);
            }
            if (viewDeleteConfirmRef.current && !viewDeleteConfirmRef.current.contains(event.target as Node)) {
                setShowViewDeleteConfirm(false);
            }
        };

        if (showTableMenu || showDeleteConfirm || showViewMenu || showViewDeleteConfirm) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTableMenu, showDeleteConfirm, showViewMenu, showViewDeleteConfirm]);

    // Initialize edit name when editing starts
    useEffect(() => {
        if (editingTableId) {
            const table = tables.find(t => t.id === editingTableId);
            setEditTableName(table?.name ?? "");
        }
    }, [editingTableId, tables]);

    const handleEditStart = (tableId: string) => {
        setEditingTableId(tableId);
        setShowTableMenu(null);
    };

    const handleEditSave = async (tableId: string) => {
        if (!editTableName.trim()) {
            setEditingTableId(null);
            setEditTableName("");
            return;
        }

        const currentTable = tables.find(t => t.id === tableId);
        if (!currentTable || editTableName.trim() === currentTable.name) {
            setEditingTableId(null);
            setEditTableName("");
            return;
        }

        try {
            await renameTable.mutateAsync({
                id: tableId,
                name: editTableName.trim()
            });
            
            // Invalidate queries to sync across all components
            await utils.table.getAllForBase.invalidate();
            
            setEditingTableId(null);
            setEditTableName("");
        } catch (err) {
            console.error("Failed to rename table:", err);
            setEditingTableId(null);
            setEditTableName("");
        }
    };

    const handleEditCancel = () => {
        setEditingTableId(null);
        setEditTableName("");
    };

    const handleDeleteStart = (tableId: string) => {
        setShowDeleteConfirm(tableId);
        setShowTableMenu(null);
    };

    const handleDeleteConfirm = async (tableId: string) => {
        try {
            await deleteTable.mutateAsync({ id: tableId });
            
            // Invalidate queries to sync across all components
            await utils.table.getAllForBase.invalidate();
            
            // Navigate to the last remaining table
            const remainingTables = tables.filter(t => t.id !== tableId);
            if (remainingTables.length > 0) {
                const lastTable = remainingTables[remainingTables.length - 1];
                router.push(`/table/${lastTable?.id}`);
            } else {
                // If no tables left, redirect to home
                router.push('/');
            }
            
            setShowDeleteConfirm(null);
        } catch (err) {
            console.error("Failed to delete table:", err);
            setShowDeleteConfirm(null);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, tableId: string) => {
        if (e.key === 'Enter') {
            void handleEditSave(tableId);
        } else if (e.key === 'Escape') {
            handleEditCancel();
        }
    };

    const handleViewDeleteStart = () => {
        setShowViewDeleteConfirm(true);
        setShowViewMenu(false);
    };

    const handleViewDeleteConfirm = async () => {
        if (!curView?.id) return;

        try {
            await deleteView.mutateAsync({ id: curView.id });
            
            // Invalidate queries to sync across all components
            await utils.view.getAllForTable.invalidate({ tableId: curTable?.id ?? "" });
            
            // Navigate to the last remaining view or first table
            const remainingViews = views.filter(v => v.id !== curView.id);
            if (remainingViews.length > 0) {
                const lastView = remainingViews[remainingViews.length - 1];
                router.push(`/table/${curTable?.id}/${lastView?.id}`);
            } else if (curTable) {
                // If no views left, redirect to table page (which will redirect to home)
                router.push(`/table/${curTable.id}`);
            } else {
                router.push('/');
            }
            
            setShowViewDeleteConfirm(false);
        } catch (err) {
            console.error("Failed to delete view:", err);
            setShowViewDeleteConfirm(false);
        }
    };

    const handleViewDeleteCancel = () => {
        setShowViewDeleteConfirm(false);
    };

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
                        <div key={table.id} className="relative">
                            <button
                                onClick={() => handleTableClickInternal(table)}
                                className={`py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                                    curTable?.id === table.id
                                        ? 'bg-white text-gray-800 px-3'
                                        : isNavigating
                                        ? 'text-gray-400 cursor-not-allowed px-3'
                                        : 'text-gray-600 hover:text-gray-800 hover:bg-white/50 px-3'
                                }`}
                            >
                                {editingTableId === table.id ? (
                                    <input
                                        type="text"
                                        value={editTableName}
                                        onChange={(e) => setEditTableName(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, table.id)}
                                        onBlur={() => void handleEditSave(table.id)}
                                        className="text-sm font-medium bg-transparent border-none outline-none focus:ring-0 p-0 flex-1"
                                        autoFocus
                                    />
                                ) : (
                                    table.name
                                )}
                                {curTable?.id === table.id && editingTableId !== table.id && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowTableMenu(showTableMenu === table.id ? null : table.id);
                                        }}
                                        className="ml-1 p-1 hover:bg-gray-100 rounded"
                                    >
                                        <svg 
                                            className="w-4 h-4 text-gray-600" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2"
                                        >
                                            <polyline points="6,9 12,15 18,9"/>
                                        </svg>
                                    </button>
                                )}
                            </button>
                            {/* Table dropdown menu */}
                            {showTableMenu === table.id && (
                                <div 
                                    ref={tableMenuRef}
                                    className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-[100]"
                                >
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                handleEditStart(table.id);
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                            <span>Rename</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleDeleteStart(table.id);
                                            }}
                                            disabled={tables.length === 1}
                                            className={`flex w-full items-center gap-3 px-4 py-2 text-sm ${
                                                tables.length === 1 
                                                    ? 'text-gray-400 cursor-not-allowed' 
                                                    : 'text-red-600 hover:bg-red-50'
                                            }`}
                                        >
                                            <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3,6 5,6 21,6"/>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                <line x1="10" y1="11" x2="10" y2="17"/>
                                                <line x1="14" y1="11" x2="14" y2="17"/>
                                            </svg>
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="absolute left-0 top-full mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg z-[100]">
                        <div 
                            ref={deleteConfirmRef}
                            className="p-4"
                        >
                            <h3 className="mb-2 text-sm font-semibold text-gray-900">
                                Are you sure you want to delete {tables.find(t => t.id === showDeleteConfirm)?.name}?
                            </h3>
                            <p className="mb-4 text-xs text-gray-600">
                                This action cannot be undone.
                            </p>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={handleDeleteCancel}
                                    className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => void handleDeleteConfirm(showDeleteConfirm)}
                                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Delete Confirmation Modal */}
                {showViewDeleteConfirm && (
                    <div className="absolute left-0 top-full mt-1 w-64 rounded-lg border border-gray-200 bg-white shadow-lg z-[100]">
                        <div 
                            ref={viewDeleteConfirmRef}
                            className="p-4"
                        >
                            <h3 className="mb-2 text-sm font-semibold text-gray-900">
                                Are you sure you want to delete {curView?.name}?
                            </h3>
                            <p className="mb-4 text-xs text-gray-600">
                                This action cannot be undone.
                            </p>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={handleViewDeleteCancel}
                                    className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => void handleViewDeleteConfirm()}
                                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
            <div className="px-4 py-1">
                <div className="flex items-center justify-between">
                    {/* Left side - Menu and View controls */}
                    <div className="flex items-center space-x-4">
                        {/* Hamburger menu */}
                        <button 
                            onClick={onToggleSidebar}
                            className="p-2 hover:bg-gray-100 rounded"
                        >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Grid icon and view name */}
                        <div className="flex items-center space-x-2 relative">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            <span className="text-xs font-medium text-gray-800">{curView?.name ?? 'Loading...'}</span>
                            <button 
                                onClick={() => setShowViewMenu(!showViewMenu)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            
                            {/* View dropdown menu */}
                            {showViewMenu && (
                                <div 
                                    ref={viewMenuRef}
                                    className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-[100]"
                                >
                                    <div className="py-1">
                                        <button
                                            onClick={handleViewDeleteStart}
                                            disabled={views.length === 1}
                                            className={`flex w-full items-center gap-3 px-4 py-2 text-sm ${
                                                views.length === 1 
                                                    ? 'text-gray-400 cursor-not-allowed' 
                                                    : 'text-red-600 hover:bg-red-50'
                                            }`}
                                        >
                                            <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3,6 5,6 21,6"/>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                <line x1="10" y1="11" x2="10" y2="17"/>
                                                <line x1="14" y1="11" x2="14" y2="17"/>
                                            </svg>
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Center - View controls */}
                    <div className="flex items-center">
                        {/* Hide fields */}
                        <button className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            </svg>
                            <span>Hide fields</span>
                        </button>

                        {/* Filter */}
                        <button className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                            </svg>
                            <span>Filter</span>
                        </button>

                        {/* Group */}
                        <button className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            <span>Group</span>
                        </button>

                        {/* Sort */}
                        <button className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            <span>Sort</span>
                        </button>

                        {/* Color */}
                        <button className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                            </svg>
                            <span>Color</span>
                        </button>

                        {/* Share and sync */}
                        <button className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                            <span>Share and sync</span>
                        </button>
                    
                        <button className="p-2 hover:bg-gray-100 rounded">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}