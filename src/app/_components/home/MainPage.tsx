"use client"

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { signOut } from "next-auth/react";
import TaskBar from "~/app/_components/TaskBar";
import BaseCard from "./BaseCard";

export default function MainPage() {
    const [fetchedBases] = api.base.getAllForUser.useSuspenseQuery();
    const [fetchedWorkspaces] = api.workspace.getAllForUser.useSuspenseQuery();
    const [workspaces, setWorkspaces] = useState(fetchedWorkspaces);
    const [bases, setBases] = useState(fetchedBases);
    const [newBaseName, setNewBaseName] = useState("");

    
    console.log("bases:", JSON.stringify(fetchedBases))

    return (
        <>
            <TaskBar bases={bases} setBases={setBases} workspaces={workspaces} setWorkspaces={setWorkspaces} />
            {/* Main Content */}
            <main className="w-full pl-24 pr-10 mt-14 min-h-[calc(100vh-3.5rem)] bg-[#fbfbfd]">
                <div className="mx-auto max-w-screen-2xl px-6 py-6">
                    <h1 className="mb-8 text-2xl font-semibold text-gray-900">Home</h1>

                    {/* Filter row */}
                    <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
                        <span>Opened in the past 7 days</span>
                        <svg className={`h-3.5 w-3.5 transition-transform duration-200 rotate-90`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {bases.map((base) => (
                            <BaseCard key={base.id} base={base} />
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}