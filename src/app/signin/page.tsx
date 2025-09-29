"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { useEffect } from "react";


// A component to match the style of the text input fields
const InputPlaceholder = ({ placeholder }: { placeholder: string }) => (
  <input
    type="text"
    placeholder={placeholder}
    // CHANGED: Reduced vertical padding from py-2.5 to py-1.5 to make it shorter (~70% height)
    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 cursor-not-allowed"
    disabled
  />
);

export default function SignInPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Check if the session status is 'authenticated' (i.e., user is logged in)
    if (status === 'authenticated') {
      redirect('/');
    }
  }, [status]); // Dependency array should include status

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg font-medium text-gray-700">Loading...</p>
      </div>
    );
  }
  return (
    // 1. Full-screen container with white background
    <div className="flex min-h-screen bg-white">
      
      {/* 2. Left Column: Login Form Area */}
      {/* CHANGED: Reduced right padding on large screens from lg:pr-64 to lg:pr-32 to better position the now-wider form */}
      <div className="w-full flex flex-col items-center justify-center px-1 py-16 lg:flex-1 lg:items-end lg:justify-center lg:pr-32">
        {/* CHANGED: Increased max width from max-w-sm (24rem) to max-w-lg (32rem) for 150% width. */}
        <div className="w-full max-w-lg">
          
          {/* Logo */}
          <div className="mb-20">
            <Image
              src="/airtable-logo-notext.webp" 
              alt="Airtable Clone Logo"
              width={40} 
              height={40}
              className="object-contain mx-auto lg:mx-0"
            />
          </div>

          {/* Main Title */}
          <h1 className="text-3xl font-semibold text-gray-900 mb-8 text-center lg:text-left">
            Sign in to Airtable
          </h1>

          {/* Email/Password Form Section */}
          <form className="flex flex-col gap-4">
            
            {/* Email Input (Non-Functional Placeholder) */}
            <div className="mb-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-1">
                Email
              </label>
              <InputPlaceholder placeholder="Email address" />
            </div>

            {/* Continue Button (Matches Airtable's Light Blue Primary Button) */}
            <button
              type="button"
              // CHANGED: Reduced vertical padding from py-3 to py-2 to make it shorter (~70% height)
              className="w-full bg-blue-500/70 text-white rounded-md px-4 py-2 font-semibold text-base shadow-sm opacity-60 cursor-not-allowed transition duration-150 hover:bg-blue-600/70"
            >
              Continue
            </button>
          </form>

          {/* --- OR Divider (Matches Airtable's thin, light style) --- */}
          <div className="relative flex justify-center py-6">
            <span className="bg-white px-2 text-sm text-gray-500 z-10 font-medium">
              or
            </span>
          </div>

          {/* --- SSO Buttons Section --- */}
          <div className="flex flex-col space-y-3">
            
            {/* Single Sign On (Non-Functional Placeholder) */}
            <button
              type="button"
              // CHANGED: Reduced vertical padding from py-3 to py-2 to make it shorter (~70% height)
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-md text-base font-mediu bg-white hover:bg-gray-50 focus:outline-none transition duration-150 opacity-60 cursor-not-allowed"
            >
              <span>Sign in with Single Sign On</span>
            </button>
            
            {/* Google Button (FUNCTIONAL) */}
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/' })}
              // CHANGED: Reduced vertical padding from py-3 to py-2 to make it shorter (~70% height)
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
            >
              <Image 
                src="/google-logo.png" 
                alt="Google Logo"
                width={20}
                height={20}
                className="mr-1"
              />
              <span>Continue with Google</span>
            </button>
            
            {/* Apple Button (Non-Functional Placeholder) */}
            <button
              type="button"
              // CHANGED: Reduced vertical padding from py-3 to py-2 to make it shorter (~70% height)
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50 opacity-60 cursor-not-allowed"
            >
              {/* Placeholder for Apple Icon */}
              <span className="text-xl -translate-y-px"></span> 
              <span>Continue with Apple ID</span>
            </button>
          </div>

          {/* --- Footer Link (Matches Airtable's style) --- */}
          <div className="mt-16 text-base text-gray-700 text-center lg:text-left">
            New to Airtable?{" "}
            <Link 
              href="#" 
              className="text-blue-600 hover:underline font-medium"
            >
              Create an account
            </Link>{" "}
            instead
          </div>
        </div>
      </div>
      
      {/* 3. Right Column: Omni Intro Image (Functional Hover Effect) */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8">
        {/* CHANGED: Increased width from 400px to 600px for 150% width */}
        <div className="relative cursor-pointer rounded-xl overflow-hidden shadow-xl transform transition-all duration-300 hover:scale-[1.02]" style={{width: '400px', height: '550px'}}>
          <Image
            src="/omni-intro.png"
            alt="Meet Omni, your AI collaborator"
            fill
            className="object-cover" 
          />
        </div>
      </div>
    </div>
  );
}