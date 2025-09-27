"use client"

import { api } from "~/trpc/react";
import { useState, useEffect } from "react";
import TaskBar from "../TaskBar";
import WorkspaceCard from "./WorkspaceCard";

export default function WorkspacesPage() {
    const [fetchedBases] = api.base.getAllForUser.useSuspenseQuery();
    const [fetchedWorkspaces] = api.workspace.getAllForUser.useSuspenseQuery();
    const [workspaces, setWorkspaces] = useState(fetchedWorkspaces);
    const [bases, setBases] = useState(fetchedBases);
    const [isScrolled, setIsScrolled] = useState(false);

    const utils = api.useUtils();
    const renameWorkspace = api.workspace.rename.useMutation();
    const deleteWorkspace = api.workspace.delete.useMutation();
    const createWorkspace = api.workspace.create.useMutation();
    const deleteBase = api.base.delete.useMutation();
    const renameBase = api.base.rename.useMutation();

    // Handle scroll to show/hide shadow
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleDeleteBase = async (id: string) => {
        try {
            await deleteBase.mutateAsync({id});
            setBases(bases.filter(base => base.id !== id));
            // Invalidate queries to sync across all components
            await utils.base.getAllForUser.invalidate();
        } catch (err) {
            console.error("Failed to delete base:", err);
        }
    }

    const handleRenameBase = async (id: string, name: string) => {
        try {
            await renameBase.mutateAsync({id, name});
            setBases(bases.map(base => base.id === id ? { ...base, name } : base));
            // Invalidate queries to sync across all components
            await utils.base.getAllForUser.invalidate();
        } catch (err) {
            console.error("Failed to rename base:", err);
        }
    }

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

    const handleCreateWorkspace = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const newWorkspace = await createWorkspace.mutateAsync({name: "Workspace"});
        setWorkspaces([...workspaces, newWorkspace].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
        // Invalidate queries to sync across all components
        await utils.workspace.getAllForUser.invalidate();
    }


    console.log("workspaces:", JSON.stringify(workspaces))
    return (
        <>  
            <TaskBar workspaces={workspaces} setWorkspaces={setWorkspaces} bases={bases} setBases={setBases} />
            
            {/* Fixed Header */}
            <div className={`fixed top-14 left-0 right-0 z-30 bg-[#fbfbfd] transition-shadow duration-200 ${isScrolled ? 'shadow-sm' : ''}`}>
                <div className="mx-auto max-w-screen-2xl px-6 py-6 ml-24 mr-10">
                    {/* Header with title and create button */}
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl text-gray-900">All Workspaces</h1>
                        <button onClick={handleCreateWorkspace} className="rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                            Create a workspace
                        </button>
                    </div>

                    {/* Filter bar */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Created time</span>
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>All organizations and plans</span>
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="w-full pl-24 pr-10 mt-14 min-h-[calc(100vh-3.5rem)] bg-[#fbfbfd]">
                <div className="mx-auto max-w-screen-2xl px-6 py-6 pt-32">
                    {/* Workspace cards - vertical stack */}
                    <div className="space-y-4">
                        {workspaces.map((workspace) => (
                            <WorkspaceCard key={workspace.id} bases={bases} workspace={workspace} deleteWorkspace={handleDeleteWorkspace} renameWorkspace={handleRenameWorkspace} deleteBase={handleDeleteBase} renameBase={handleRenameBase}/>
                        ))}
                    </div>
                </div>
            </main>
        </>
    )
}