'use client';

import React from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  ChevronDown,
  LayoutDashboard,
  StarIcon,
  FileText,
  PenBox,
  GraduationCap,
  MessageCircle,
  LogIn,
  History,
  Bot,
  LogOut,
  User as UserIcon,
  TrendingUp
} from "lucide-react";

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto py-3 px-6 h-16 flex item-center justify-between">
        <Link href="/">
          <h5 className="text-2xl mt-2">Skill Edge <span className="text-indigo-500">AI</span></h5>
        </Link>

        <div className="flex items-center space-x-2 md:space-x-4 ">
          {isAuthenticated ? (
            <>
              <Link href="/chatbot">
                <Button variant="outline">
                  <Bot className="h-4 w-4" />
                  <span className="hidden md:block">AI Assistant</span>
                </Button>
              </Link>

              <Link href="/past-interviews">
                <Button variant="outline">
                  <History className="h-4 w-4" />
                  <span className="hidden md:block">Past Interviews</span>
                </Button>
              </Link>

              <Link href="/progress">
                <Button variant="outline">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden md:block">Progress</span>
                </Button>
              </Link>

              <Link href="/industry-insights">
                <Button variant="outline">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden md:block">Industry Insights</span>
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <StarIcon className="h-4 w-4" />
                    <span className="hidden md:block">Growth Tools</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <PenBox className="h-4 w-4" />
                      Cover Letter
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <GraduationCap className="h-4 w-4" />
                      Interview Prep
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Feedback
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {user?.email}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={async () => {
                      try {
                        // Call server-side logout first to clear HTTP-only cookies
                        await fetch('/api/auth/logout', { method: 'POST' });
                      } catch (error) {
                        console.error('Server logout error:', error);
                      }
                      // Then call client-side logout to clear localStorage
                      logout();
                    }}
                    className="cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/sign-in">
              <Button variant="outline">
                <LogIn className="h-4 w-4" />
                <span className="hidden md:block">Sign In</span>
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
