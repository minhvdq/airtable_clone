"use client"

import { type Base } from "@prisma/client";
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSelectedBaseStore } from '~/stores/selectedBaseStore'
import { api } from "~/trpc/react";

export default function BaseCard({ base, deleteBase, renameBase }: { base: Base, deleteBase: (id: string) => void, renameBase: (id: string, name: string) => void }) {
    const tables = api.table.getAllForBase.useQuery({ baseId: base.id }).data ?? [];
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const confirmRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Zustand store for selected base
    const { setSelectedBase } = useSelectedBaseStore();
    const router = useRouter();
    
    const lastOpenAt = base.lastOpenAt;
    const dateNow = Date.now()
    const initials = (base.name || "Untitled").trim().slice(0, 2);
    
    const gap = dateNow - lastOpenAt.getTime();
    const days = Math.floor(gap / (1000 * 60 * 60 * 24));
    const hours = Math.floor(gap / (1000 * 60 * 60));
    const minutes = Math.floor(gap / (1000 * 60));

    const [newName, setNewName] = useState("");
    
    let lastOpenString = ""
    if (minutes < 60) {
        lastOpenString = `Opened ${minutes} minutes ago`;
    }else if (hours < 24) {
        lastOpenString = `Opened ${hours} hours ago`;
    }else {
        lastOpenString = `Opened ${days} days ago`;
    }

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setShowModal(false);
            }
            if (confirmRef.current && !confirmRef.current.contains(event.target as Node)) {
                setShowDeleteConfirm(false);
            }
        };

        if (showModal || showDeleteConfirm) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showModal, showDeleteConfirm]);

    const handleModalAction = (action: string) => {
        console.log(`${action} clicked for base: ${base.name}`);
        setShowModal(false);
        if (action === 'delete') {
            setShowDeleteConfirm(true);
        } else if (action === 'rename') {
            setNewName(base.name);
            setIsRenaming(true);
        }
    };

    const handleConfirmDelete = () => {
        deleteBase(base.id);
        setShowDeleteConfirm(false);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const handleRename = () => {
        if (newName.trim() && newName !== base.name) {
            renameBase(base.id, newName.trim());
        }
        setIsRenaming(false);
        setNewName("");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRename();
        } else if (e.key === 'Escape') {
            setIsRenaming(false);
            setNewName("");
        }
    };

    // Handle base card click to navigate to table
    const handleBaseClick = async () => {
        console.log('Base clicked:', base.name);
        const tableId = tables?.[0]?.id ?? "";
        console.log("id", tableId)
        setSelectedBase(base);
        router.push(`/table/${tableId}`);
    };

    // Focus input when renaming starts
    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);
    
    return (
        <div
            onClick={handleBaseClick}
            className="group relative flex items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:shadow"
            role="button"
            tabIndex={0}
        >
            {/* Hover actions */}
            <div className="pointer-events-none absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50">
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2.8 5.6 6.2.9-4.5 4.3 1.1 6.2L12 17.8l-5.6 2.9 1.1-6.2L3 9.5l6.2-.9L12 3z"/></svg>
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowModal(true);
                    }}
                    className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                >
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </button>
            </div>

            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-600 text-base font-semibold tracking-wide text-white">
                {initials}
            </div>
            <div className="min-w-0">
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={handleRename}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-sm font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0"
                    />
                ) : (
                    <div className="truncate text-sm font-semibold text-gray-900">{base.name}</div>
                )}
                <div className="text-xs text-gray-500 group-hover:hidden">{lastOpenString}</div>
                <div className="hidden items-center gap-2 text-xs text-gray-600 group-hover:flex">
                    <Image src="/stack-of-three-coins.png" alt="Open data" width={16} height={16} className="opacity-90" />
                    <span>Open data</span>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="absolute right-0 top-12 z-50" role="dialog" aria-modal="true">
                    <div 
                        ref={modalRef}
                        onClick={(e) => e.stopPropagation()}
                        className="w-48 rounded-lg border border-gray-200 bg-white shadow-xl"
                    >
                        <div className="py-1">
                            <button
                                onClick={() => handleModalAction('rename')}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                <span>Rename</span>
                            </button>
                            <button
                                onClick={() => handleModalAction('duplicate')}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                                <span>Duplicate</span>
                            </button>
                            <button
                                onClick={() => handleModalAction('move')}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12h18m-9-9l9 9-9 9"/>
                                </svg>
                                <span>Move</span>
                            </button>
                            <button
                                onClick={() => handleModalAction('go to workspace')}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                    <polyline points="9,22 9,12 15,12 15,22"/>
                                </svg>
                                <span>Go to Workspace</span>
                            </button>
                        </div>
                        <div className="border-t border-gray-200"></div>
                        <div className="py-1">
                            <button
                                onClick={() => handleModalAction('delete')}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3,6 5,6 21,6"/>
                                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                                <span>Delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="absolute right-0 top-12 z-[60]" role="dialog" aria-modal="true">
                    <div 
                        ref={confirmRef}
                        onClick={(e) => e.stopPropagation()}
                        className="w-48 h-36 rounded-lg border border-gray-200 bg-white p-3 shadow-xl"
                    >
                        <h3 className="mb-1 text-sm font-semibold text-gray-900">
                            Are you sure you want to delete {base.name}?
                        </h3>
                        <p className="mb-4 text-xs text-gray-600">
                            Recently deleted bases can be restored from trash.
                            <button className="ml-1 inline-flex h-3 w-3 items-center justify-center rounded-full bg-gray-100 text-[10px] text-gray-500 hover:bg-gray-200">
                                ?
                            </button>
                        </p>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={handleCancelDelete}
                                className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}   