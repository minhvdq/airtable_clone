"use client"

import { type Base } from "@prisma/client";

export default function BaseCard({ base }: { base: Base }) {
    const lastOpenAt = base.lastOpenAt;
    const dateNow = Date.now()
    
    const gap = dateNow - lastOpenAt.getTime();
    const days = Math.floor(gap / (1000 * 60 * 60 * 24));
    const hours = Math.floor(gap / (1000 * 60 * 60));
    const minutes = Math.floor(gap / (1000 * 60));
    
    let lastOpenString = ""
    if (minutes < 60) {
        lastOpenString = `Opened ${minutes} minutes ago`;
    }else if (hours < 24) {
        lastOpenString = `Opened ${hours} hours ago`;
    }else {
        lastOpenString = `Opened ${days} days ago`;
    }

    const initials = (base.name || "Untitled").trim().slice(0, 2);
    
    return (
        <div
            className="group relative flex items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:shadow"
            role="button"
            tabIndex={0}
        >
            {/* Hover actions */}
            <div className="pointer-events-none absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50">
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2.8 5.6 6.2.9-4.5 4.3 1.1 6.2L12 17.8l-5.6 2.9 1.1-6.2L3 9.5l6.2-.9L12 3z"/></svg>
                </button>
                <button className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50">
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </button>
            </div>

            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-600 text-base font-semibold tracking-wide text-white">
                {initials}
            </div>
            <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900">{base.name}</div>
                <div className="text-xs text-gray-500 group-hover:hidden">{lastOpenString}</div>
                <div className="hidden items-center gap-2 text-xs text-gray-600 group-hover:flex">
                    <img src="/stack-of-three-coins.png" alt="Open data" className="h-4 w-4 opacity-90" />
                    <span>Open data</span>
                </div>
            </div>
        </div>
    )
}