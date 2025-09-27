"use client"

import { type Base, type Workspace } from "@prisma/client";
import { useState, useRef, useEffect } from 'react';
import Image from "next/image";
import BaseCard from "../home/BaseCard";

export default function WorkspaceCard({ bases, workspace, deleteWorkspace, renameWorkspace, deleteBase, renameBase }: { bases: Base[], workspace: Workspace, deleteWorkspace: (id: string) => void, renameWorkspace: (id: string, name: string) => void, deleteBase: (id: string) => void, renameBase: (id: string, name: string) => void }) {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(workspace.name);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const confirmRef = useRef<HTMLDivElement>(null);

    // Focus input when renaming starts
    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

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

    const handleRename = () => {
        if (newName.trim() && newName !== workspace.name) {
            renameWorkspace(workspace.id, newName.trim());
        }
        setIsRenaming(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRename();
        } else if (e.key === 'Escape') {
            setIsRenaming(false);
            setNewName(workspace.name);
        }
    };

    const handleModalAction = (action: string) => {
        setShowModal(false);
        if (action === 'rename') {
            setIsRenaming(true);
        } else if (action === 'delete') {
            setShowDeleteConfirm(true);
        }
    };

    const handleConfirmDelete = () => {
        deleteWorkspace(workspace.id);
        setShowDeleteConfirm(false);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    // Filter bases that belong to this workspace
    const workspaceBases = bases.filter(base => base.workspaceId === workspace.id);

    return (
        <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        {isRenaming ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={handleKeyPress}
                                onBlur={handleRename}
                                className="text-xl text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0"
                            />
                        ) : (
                            <p className="text-xl text-gray-900">{workspace.name}</p>
                        )}
                        
                        <div className="flex items-center gap-1.5 bg-gray-100 rounded-md px-1.5 py-0.5">
                            <span className="text-[10px] font-medium text-gray-800">
                                FREE PLAN
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">•</span>
                            <button className="text-[10px] text-blue-600 hover:text-blue-700 font-medium">
                                UPGRADE
                            </button>
                        </div>
                        
                        <button className="text-gray-400 hover:text-gray-600">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m12 3 2.8 5.6 6.2.9-4.5 4.3 1.1 6.2L12 17.8l-5.6 2.9 1.1-6.2-4.5-4.3 6.2-.9L12 3z"/>
                            </svg>
                        </button>
                    </div>
                    
                    {/* Base cards for this workspace */}
                    {workspaceBases.length > 0 && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-4">
                            {workspaceBases.map((base) => (
                                <BaseCard 
                                    key={base.id} 
                                    base={base} 
                                    deleteBase={deleteBase} 
                                    renameBase={renameBase}
                                />
                            ))}
                        </div>
                    )}
                    
                    <button className="text-sm text-gray-500 hover:text-gray-700 font-medium">
                        View workspace →
                    </button>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                    <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Share
                    </button>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowModal(true);
                        }}
                        className="rounded-md border border-gray-300 bg-white p-1.5 text-gray-700 hover:bg-gray-50"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1"/>
                            <circle cx="19" cy="12" r="1"/>
                            <circle cx="5" cy="12" r="1"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="absolute right-0 top-12 z-50" role="dialog" aria-modal="true">
                    <div 
                        ref={modalRef}
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
                                <span>Rename workspace</span>
                            </button>
                            <button
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 16v-4"/>
                                    <path d="M12 8h.01"/>
                                </svg>
                                <span>Edit description</span>
                            </button>
                            <button
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Image src="/settings.png" alt="Settings" width={16} height={16} className="opacity-70" />
                                <span>Workspace settings</span>
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
                                <span>Delete workspace</span>
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
                        className="w-48 h-36 rounded-lg border border-gray-200 bg-white p-3 shadow-xl"
                    >
                        <h3 className="mb-1 text-sm font-semibold text-gray-900">
                            Are you sure you want to delete {workspace.name}?
                        </h3>
                        <p className="mb-4 text-xs text-gray-600">
                            Recently deleted workspaces can be restored from trash.
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