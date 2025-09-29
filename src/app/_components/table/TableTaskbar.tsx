"use client"
import Image from "next/image"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useSelectedBaseStore } from '~/stores/selectedBaseStore';

export default function TableTaskbar() {
    const { data: session } = useSession();
    const { selectedBase } = useSelectedBaseStore();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isLogoHovered, setIsLogoHovered] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const email = session?.user?.email ?? "User";
    const name = session?.user?.name ?? "User";
    const initial = name[0] ?? "U";

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    return (
        <>
            {/* Top Navigation Bar */}
            <div className="fixed top-0 left-14 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center px-4">
                {/* Left side - Base name and navigation */}
                <div className="flex items-center gap-2 flex-shrink-0"> 
                    {/* Base name with dropdown */}
                    <div className="flex items-center gap-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-600 flex-shrink-0">
                            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                        </div>
                        <span className="ml-2 text-md font-semibold text-gray-900 truncate max-w-[120px]">{selectedBase?.name ?? "Untitled Base"}</span>
                        <button className="flex h-4 w-4 items-center justify-center text-gray-500 hover:text-gray-700 flex-shrink-0">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Center tabs - flex-1 to take remaining space */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-1">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-purple-600 border-b-2 border-purple-600">
                            <span>Data</span>
                        </button>
                        <button className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">
                            <span>Automations</span>
                        </button>
                        <button className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">
                            <span>Interfaces</span>
                        </button>
                        <button className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">
                            <span>Forms</span>
                        </button>
                    </div>
                </div>

                {/* Right side - Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Upgrade button */}
                    <button className="flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                        <svg className="h-3 w-3 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span>Upgrade</span>
                    </button>

                    {/* Launch button */}
                    <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-gray-700 border border-gray-200 shadow-xs hover:bg-gray-100">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 7h10v10"/>
                            <path d="M7 17L17 7"/>
                        </svg>
                        <span>Launch</span>
                    </button>

                    {/* Share button */}
                    <button className="flex items-center gap-1 rounded-md bg-purple-600 px-3 py-1 text-sm font-lg text-white hover:bg-purple-700">
                        
                        <span>Share</span>
                    </button>
                </div>
            </div>

            {/* Left Sidebar */}
            <div className="fixed left-0 top-0 z-50 h-screen w-14 bg-white border-r border-gray-200 flex flex-col items-center py-3">
                {/* Logo at top with hover effect */}
                <div className="mb-8">
                    <Link 
                        href="/"
                        className="flex items-center justify-center w-8 h-8 rounded transition-colors duration-200"
                        onMouseEnter={() => setIsLogoHovered(true)}
                        onMouseLeave={() => setIsLogoHovered(false)}
                    >
                        {isLogoHovered ? (
                            // Back arrow when hovered
                            <svg 
                                className="w-4 h-4 text-gray-700" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            >
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        ) : (
                            // Original logo when not hovered
                            <Image 
                                src="/airtable-black.svg" 
                                alt="Airtable Logo"
                                width={22} 
                                height={22}
                                className="object-contain"
                            />
                        )}
                    </Link>
                </div>

            {/* Spacer to push buttons to bottom */}
            <div className="flex-1" />

            {/* Three buttons at bottom - copied from TaskBar */}
            <div className="flex flex-col items-center gap-2">
                {/* Help icon */}
                <button className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-700 hover:bg-gray-100">
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="9"/>
                        <path d="M9.5 9a2.5 2.5 0 1 1 4.3 1.7c-.6.6-1.3 1-1.8 1.6-.3.3-.5.7-.5 1.2"/>
                        <path d="M12 17h.01"/>
                    </svg>
                </button>

                {/* Bell icon */}
                <button className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-700 hover:bg-gray-50">
                    <Image src="/bell.png" alt="Notifications" width={14} height={14} className="opacity-80" />
                </button>

                {/* Avatar */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        aria-haspopup="menu"
                        aria-expanded={showUserMenu}
                        onClick={() => setShowUserMenu((v) => !v)}
                        className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-gray-500 text-sm font-semibold text-white ring-1 ring-white shadow hover:brightness-95"
                    >
                        {initial}
                    </button>

                    {/* User dropdown */}
                    {showUserMenu && (
                        <div className="absolute left-0 bottom-12 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
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
                </div>
                </div>
            </div>
        </>
    )
}