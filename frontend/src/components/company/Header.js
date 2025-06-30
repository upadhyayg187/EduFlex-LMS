'use client';

import { Bell, ChevronDown, Menu, User, Search } from 'lucide-react';
import { useState } from 'react';
import useUser from '@/hooks/useUser';
import Link from 'next/link';

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const user = useUser();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden">
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <form className="relative flex flex-1" action="#" method="GET">
                <label htmlFor="search-field" className="sr-only">Search</label>
                <Search className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400" />
                <input
                    id="search-field"
                    className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                    placeholder="Search..."
                    type="search"
                    name="search"
                />
            </form>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
                <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative">
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-6 w-6" />
                    <span className="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full bg-blue-600 ring-1 ring-white"></span>
                </button>

                {/* Separator */}
                <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

                {/* Profile dropdown */}
                <div className="relative">
                     <button onClick={toggleDropdown} className="-m-1.5 flex items-center p-1.5">
                        <span className="sr-only">Open user menu</span>
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                           {user?.name?.slice(0, 2).toUpperCase() || 'CA'}
                        </div>
                        <span className="hidden lg:flex lg:items-center">
                            <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                                {user?.name || 'Company Admin'}
                            </span>
                            <ChevronDown className="ml-2 h-5 w-5 text-gray-400" />
                        </span>
                    </button>

                    {dropdownOpen && (
                         <div 
                            className="absolute right-0 mt-2.5 w-48 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none animate-in fade-in-0 zoom-in-95"
                            onClick={() => setDropdownOpen(false)}
                        >
                             <div className="py-1">
                                <Link href="/company/profile" className="block px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-50">
                                    Your Profile
                                </Link>
                                <Link href="#" className="block px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-50">
                                    Sign out
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </header>
  );
}
