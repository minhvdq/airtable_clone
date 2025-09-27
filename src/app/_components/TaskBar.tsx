"use client"

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Base, Workspace } from "@prisma/client";
import { useSession, signOut } from "next-auth/react";  
import { useState, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { api } from "~/trpc/react";

type TaskBarProps = {
    bases: Base[];
    workspaces: Workspace[];
    setBases: Dispatch<SetStateAction<Base[]>>;
    setWorkspaces: Dispatch<SetStateAction<Workspace[]>>;
};

export default function TaskBar({ bases, workspaces, setBases, setWorkspaces }: TaskBarProps) {
    // Props are typed for future interactions
    void bases; void workspaces; void setBases; void setWorkspaces;

    const { data: session } = useSession();
    const router = useRouter();

    const utils = api.useUtils();
    const createWorkspace = api.workspace.create.useMutation();
    const createBase      = api.base.create.useMutation();
    const deleteWorkspace = api.workspace.delete.useMutation();
    const renameWorkspace = api.workspace.rename.useMutation();

    const handleDeleteWorkspace = async (id: string) => {
        await deleteWorkspace.mutateAsync({id});
        setWorkspaces(workspaces.filter((workspace) => workspace.id !== id));
        // Invalidate queries to sync across all components
        await utils.workspace.getAllForUser.invalidate();
        await utils.base.getAllForUser.invalidate(); // Also invalidate bases since workspace deletion affects them
    }
    
    const handleRenameWorkspace = async (id: string, name: string) => {
        await renameWorkspace.mutateAsync({id, name});
        setWorkspaces(workspaces.map((workspace) => workspace.id === id ? { ...workspace, name } : workspace));
        // Invalidate queries to sync across all components
        await utils.workspace.getAllForUser.invalidate();
    }

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showWorkspaces, setShowWorkspaces] = useState(true);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
    const [showCreatePanel, setShowCreatePanel] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [activeWorkspaceModal, setActiveWorkspaceModal] = useState<string | null>(null);
    const [isRenamingWorkspace, setIsRenamingWorkspace] = useState(false);
    const [renamingWorkspaceId, setRenamingWorkspaceId] = useState<string | null>(null);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [showDeleteWorkspaceConfirm, setShowDeleteWorkspaceConfirm] = useState(false);
    const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<string | null>(null);
    const workspaceModalRef = useRef<HTMLDivElement>(null);

    console.log(JSON.stringify(session));
    console.log('Active workspace modal:', activeWorkspaceModal);
    console.log('Show workspaces:', showWorkspaces);
    console.log('Workspaces count:', workspaces.length);

    const email = session?.user?.email ?? "User";
    const name = session?.user?.name ?? "User";
    const initial = name[0] ?? "U";

    // Close modals when clicking outside - temporarily disabled for debugging
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeWorkspaceModal && workspaceModalRef.current && !workspaceModalRef.current.contains(event.target as Node)) {
                console.log('Closing workspace modal due to outside click');
                setActiveWorkspaceModal(null);
            }
        };

        if (activeWorkspaceModal) {
            // Add a small delay to prevent immediate closure
            setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 100);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeWorkspaceModal]);

    // Handle workspace renaming
    const handleWorkspaceRename = async () => {
        if (renamingWorkspaceId && newWorkspaceName.trim()) {
            void handleRenameWorkspace(renamingWorkspaceId, newWorkspaceName.trim());
            setIsRenamingWorkspace(false);
            setRenamingWorkspaceId(null);
            setNewWorkspaceName("");
        }
    };

    const handleWorkspaceKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            void handleWorkspaceRename();
        } else if (e.key === 'Escape') {
            setIsRenamingWorkspace(false);
            setRenamingWorkspaceId(null);
            setNewWorkspaceName("");
        }
    };

    const handleAddBase = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try{
            if (!selectedWorkspaceId) return;
            const newBase: Base = await createBase.mutateAsync({ name: "Untitled Base", workspaceId: selectedWorkspaceId });
            setBases([...bases, newBase].sort((a, b) => b.lastOpenAt.getTime() - a.lastOpenAt.getTime()));
            // Invalidate queries to sync across all components
            await utils.base.getAllForUser.invalidate();
        }catch (err: unknown){
            if (err instanceof Error) {
                console.error(err.message);
            } else {
                console.error(String(err));
            }
        }
    }

    const handleAddWorkspace = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try{
            const newWorkspace: Workspace = await createWorkspace.mutateAsync({ name: "Workspace" });
            setWorkspaces([...workspaces, newWorkspace]);
            // Invalidate queries to sync across all components
            await utils.workspace.getAllForUser.invalidate();
        }catch (err: unknown){
            if (err instanceof Error) {
                console.error(err.message);
            } else {
                console.error(String(err));
            }
        }
    }

    const handleCreateButton = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try{
            if(!workspaces || workspaces.length === 0){
                // create workspace first
                const newWorkspace: Workspace = await createWorkspace.mutateAsync({ name: "Workspace" });
                setWorkspaces([...workspaces, newWorkspace]);

                // create base second
                const newBase: Base = await createBase.mutateAsync({ name: "Untitled Base", workspaceId: newWorkspace.id });
                setBases([...bases, newBase].sort((a, b) => b.lastOpenAt.getTime() - a.lastOpenAt.getTime()));
                
                // Invalidate queries to sync across all components
                await utils.workspace.getAllForUser.invalidate();
                await utils.base.getAllForUser.invalidate();
            }else if(workspaces.length === 1){
                const onlyWorkspace = workspaces[0];
                if (!onlyWorkspace) return;
                const newBase: Base = await createBase.mutateAsync({ name: "Untitled Base", workspaceId: onlyWorkspace.id });
                setBases([...bases, newBase].sort((a, b) => b.lastOpenAt.getTime() - a.lastOpenAt.getTime()));
                
                // Invalidate queries to sync across all components
                await utils.base.getAllForUser.invalidate();
            }else{
                setSelectedWorkspaceId(null);
                setShowCreatePanel((v) => !v);
            }
        }catch (err: unknown){
            if (err instanceof Error) {
                console.error(err.message);
            } else {
                console.error(String(err));
            }
        }
    }

    const BaseCreatePanel = () => {
        if (!showCreatePanel) return null;
        return(
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
                <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-800">Create base</h3>
                        <button aria-label="Close" onClick={() => setShowCreatePanel(false)} className="rounded p-1 text-gray-500 hover:bg-gray-100">✕</button>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void handleAddBase(e as unknown as React.MouseEvent<HTMLButtonElement>);
                            setShowCreatePanel(false);
                        }}
                        className="space-y-3"
                    >
                        <label className="block text-xs font-medium text-gray-700">Choose a workspace</label>
                        <select
                            required
                            value={selectedWorkspaceId ?? ""}
                            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="" disabled>
                                Select a workspace
                            </option>
                            {workspaces.map((ws) => (
                                <option key={ws.id} value={ws.id}>
                                    {ws.name}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button type="button" onClick={() => setShowCreatePanel(false)} className="rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Cancel</button>
                            <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50" disabled={!selectedWorkspaceId}>
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
    return (
        <div className="h-full">
            {/* Top Navigation Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-gray-200 bg-white">
                <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-4">
                    {/* Left cluster: logo + product switcher */}
                    <div className="flex items-center gap-3">
                        <button
                            aria-label="Toggle sidebar"
                            onClick={() => setSidebarOpen((v) => !v)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <Image 
                            src="/Airtable-Logo.png" 
                            alt="Airtable Logo"
                            width={100} 
                            height={100}
                            className="object-contain"
                        />
                    </div>
                    {/* Center: Search */}
                    <div className="hidden w-[360px] items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 focus-within:ring-2 focus-within:ring-blue-500 md:flex">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2 h-4 w-4 text-gray-500"><circle cx="11" cy="11" r="7"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-transparent outline-none placeholder:text-gray-400"
                            disabled
                        />
                        <div className="ml-2 hidden items-center gap-1 text-[11px] text-gray-500 md:flex">
                            <span className="rounded">⌘</span>
                            <span className="rounded">K</span>
                        </div>
                    </div>
                    {/* Right: Quick actions */}
                    <div className="flex items-center gap-2">
                        {/* Help icon */}
                        <button className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-700 hover:bg-gray-100">
                            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="9"/>
                                <path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.7c-.6.6-1.3 1-1.8 1.6-.3.3-.5.7-.5 1.2"/>
                                <path d="M12 17h.01"/>
                            </svg>
                        </button>
                        {/* Bell icon */}
                        <button className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50">
                            <Image src="/bell.png" alt="Notifications" width={14} height={14} className="opacity-80" />
                        </button>
                        {/* Avatar */}
                        <button
                            aria-haspopup="menu"
                            aria-expanded={showUserMenu}
                            onClick={() => setShowUserMenu((v) => !v)}
                            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-gray-500 text-sm font-semibold text-white ring-2 ring-white shadow hover:brightness-95"
                        >
                            {initial}
                        </button>
                    </div>
                </div>
            </div>

            {/* User dropdown */}
            {showUserMenu && (
                <div className="fixed right-4 top-14 z-[70] w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
                    <div className="p-4">
                        <div className="text-base font-semibold text-gray-900">{name}</div>
                        <div className="text-sm text-gray-600">{email}</div>
                    </div>
                    <div className="h-px w-full bg-gray-200" />
                    <button
                        onClick={() => signOut()}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-800 hover:bg-gray-50"
                    >
                        <svg className="h-4.5 w-4.5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        <span>Log out</span>
                    </button>
                </div>
            )}

            {/* Left Sidebar: rail + sliding expanded panel */}
            <div className="group/sidebar fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-14">
                {/* Collapsed rail */}
                <aside className="h-full w-14 border-r border-gray-200 bg-white">
                    <div className="flex h-full flex-col items-center py-3">
                        {/* Top icons */}
                        <button 
                            onClick={() => router.push("/")}
                            className="mb-2 flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100"
                        >
                            <Image src="/hut.png" alt="Home" width={16} height={16} className="opacity-90" />
                        </button>
                        <button className="mb-2 flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100">
                            <svg className="h-5 w-5 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2.8 5.6 6.2.9-4.5 4.3 1.1 6.2L12 17.8l-5.6 2.9 1.1-6.2-4.5-4.3 6.2-.9L12 3z"/></svg>
                        </button>
                        <button className="mb-2 flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100">
                            <svg className="h-5 w-5 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18h7"/><path d="M7 14V6h11l-3 3"/></svg>
                        </button>
                        <button className="mb-4 flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100">
                            <Image src="/people.png" alt="Workspaces" width={16} height={16} className="opacity-90" />
                        </button>
                        <div className="my-2 h-px w-10 bg-gray-200" />
                        <div className="mt-auto flex flex-col items-center gap-2 pb-2">
                            <button className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100">
                                <Image src="/open-book.png" alt="Templates" width={16} height={16} className="opacity-80" />
                            </button>
                            <button className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100">
                                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 10h.01M15 10h.01"/></svg>
                            </button>
                            <button className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-gray-100">
                                <Image src="/globe.png" alt="Import" width={16} height={16} className="opacity-80" />
                            </button>
                        </div>
                    </div>
                </aside>
                {/* Sliding expanded panel */}
                <aside className={`absolute left-0 top-0 h-full w-64 border-r border-gray-200 bg-white shadow-sm transition-transform duration-200 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full group-hover/sidebar:translate-x-0"}`}>
                    <div className="flex h-full flex-col p-2 pb-16">
                        {/* Primary */}
                        <nav className="space-y-1">
                            {/* Home */}
                            <button 
                                onClick={() => router.push("/")}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <Image src="/hut.png" alt="Home" width={16} height={16} className="opacity-90" />
                                <span className="whitespace-nowrap">Home</span>
                            </button>
                            {/* Starred */}
                            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                                <svg className="h-5 w-5 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2.8 5.6 6.2.9-4.5 4.3 1.1 6.2L12 17.8l-5.6 2.9 1.1-6.2-4.5-4.3 6.2-.9L12 3z"/></svg>
                                <span className="whitespace-nowrap">Starred</span>
                            </button>
                            {/* Share */}
                            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                                <svg className="h-5 w-5 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18h7"/><path d="M7 14V6h11l-3 3"/></svg>
                                <span className="whitespace-nowrap">Share</span>
                            </button>
                            <div className="mb-1 flex items-center justify-between px-1">
                                <button 
                                    onClick={() => router.push("/workspaces")}
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                   <Image src="/people.png" alt="Workspaces" width={16} height={16} className="opacity-90" />
                                   <span className="whitespace-nowrap">Workspaces</span>
                                </button>
                                <div className="flex items-center gap-1">
                                    <button onClick={handleAddWorkspace} className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-blue-50">
                                        <span className="text-base leading-none">+</span>
                                    </button>
                                    <button
                                        onClick={() => setShowWorkspaces((v) => !v)}
                                        aria-label="Toggle workspace list"
                                        aria-expanded={showWorkspaces}
                                        className="inline-flex h-5 w-5 items-center justify-center rounded text-gray-600 hover:bg-gray-100"
                                    >
                                        <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${showWorkspaces ? "rotate-90" : "rotate-0"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                                    </button>
                                </div>
                            </div>
                        </nav>

                        {/* Divider */}
                        {/* <div className="my-3 border-t border-gray-200" /> */}

                        {/* Workspaces header */}
                        {/* <div className="mb-1 flex items-center justify-between px-1">
                            <button className="text-xs font-semibold uppercase tracking-wide text-gray-500">Workspaces</button>
                            <div className="flex items-center gap-1">
                                <button onClick={handleAddWorkspace} className="inline-flex h-6 w-6 items-center justify-center rounded text-blue-600 hover:bg-blue-50">
                                    <span className="text-lg leading-none">+</span>
                                </button>
                                <button
                                    onClick={() => setShowWorkspaces((v) => !v)}
                                    aria-label="Toggle workspace list"
                                    aria-expanded={showWorkspaces}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-600 hover:bg-gray-100"
                                >
                                    <svg className={`h-4 w-4 transition-transform duration-200 ${showWorkspaces ? "rotate-90" : "rotate-0"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                                </button>
                            </div>
                        </div> */}
                        <div className={`flex-1 space-y-1 overflow-y-auto transition-[max-height,opacity] duration-200 ease-out ${showWorkspaces ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"}`}>
                            {workspaces.map((workspace) => (
                                <div key={workspace.id} className="relative flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 group">
                                    <Image src="/people.png" alt="Workspace" width={16} height={16} className="opacity-90" />
                                    {isRenamingWorkspace && renamingWorkspaceId === workspace.id ? (
                                        <input
                                            type="text"
                                            value={newWorkspaceName}
                                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                                            onKeyDown={handleWorkspaceKeyPress}
                                            onBlur={handleWorkspaceRename}
                                            className="min-w-0 flex-1 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm"
                                            autoFocus
                                        />
                                    ) : (
                                        <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-400">›</span>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('Workspace modal button clicked for:', workspace.id);
                                                setActiveWorkspaceModal(workspace.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200 transition-opacity"
                                        >
                                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="1"/>
                                                <circle cx="19" cy="12" r="1"/>
                                                <circle cx="5" cy="12" r="1"/>
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    {/* Workspace Modal */}
                                    {activeWorkspaceModal === workspace.id && (
                                        <div ref={workspaceModalRef} className="absolute right-0 top-12 z-50" role="dialog" aria-modal="true">
                                            <div className="w-48 rounded-lg border border-gray-200 bg-white shadow-xl">
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => {
                                                            setActiveWorkspaceModal(null);
                                                            setIsRenamingWorkspace(true);
                                                            setRenamingWorkspaceId(workspace.id);
                                                            setNewWorkspaceName(workspace.name);
                                                        }}
                                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                    >
                                                        <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                        </svg>
                                                        <span>Rename workspace</span>
                                                    </button>
                                                </div>
                                                <div className="border-t border-gray-200"></div>
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => {
                                                            setActiveWorkspaceModal(null);
                                                            setShowDeleteWorkspaceConfirm(true);
                                                            setDeletingWorkspaceId(workspace.id);
                                                        }}
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

                                    {/* Delete Workspace Confirmation Modal */}
                                    {showDeleteWorkspaceConfirm && deletingWorkspaceId === workspace.id && (
                                        <div className="absolute right-0 top-12 z-[60]" role="dialog" aria-modal="true">
                                            <div className="w-48 h-36 rounded-lg border border-gray-200 bg-white p-3 shadow-xl">
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
                                                        onClick={() => {
                                                            setShowDeleteWorkspaceConfirm(false);
                                                            setDeletingWorkspaceId(null);
                                                        }}
                                                        className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            await handleDeleteWorkspace(workspace.id);
                                                            setShowDeleteWorkspaceConfirm(false);
                                                            setDeletingWorkspaceId(null);
                                                        }}
                                                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Footer icons and Create button */}
                        <div className="mt-auto space-y-1">
                            <button className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm text-gray-600 hover:bg-gray-100">
                                <Image src="/open-book.png" alt="Templates and apps" width={18} height={18} className="opacity-80" />
                                <span>Templates and apps</span>
                            </button>
                            <button className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm text-gray-600 hover:bg-gray-100">
                                <svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 10h.01M15 10h.01"/></svg>
                                <span>Marketplace</span>
                            </button>
                            <button className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm text-gray-600 hover:bg-gray-100">
                                <Image src="/globe.png" alt="Import" width={18} height={18} className="opacity-80" />
                                <span>Import</span>
                            </button>
                        </div>
                        <div className="pointer-events-none absolute bottom-3 left-0 right-0 px-2">
                            <button
                                onClick={handleCreateButton}
                                className="pointer-events-auto w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
            <BaseCreatePanel />
        </div>
    )
}

