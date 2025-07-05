
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Cpu,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  QrCode,
  Shield,
  Shirt,
  User,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "./ui/sheet";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import ArtCodeLogo from "@/assets/artcode_logo.png";

const navItems = [
    { href: "/merch", label: "Merchandise", icon: Shirt, auth: null },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, auth: true },
    { href: "/models", label: "3D Models", icon: Box, auth: "user" },
    { href: "/qr-codes", label: "QR Codes", icon: QrCode, auth: true },
    { href: "/profile", label: "Profile", icon: User, auth: "user" },
    { href: "/admin/requests", label: "Admin Requests", icon: Shield, auth: "admin" },
    { href: "/admin/models", label: "Admin Models", icon: Cpu, auth: "admin" },
    { href: "/", label: "Home", icon: Home, auth: false },
];

const ADMIN_EMAILS = [
    'hou.issam.zi@gmail.com',
    'we.ardesign3d@gmail.com'
];

function NavContent() {
    const pathname = usePathname();
    const { user } = useAuth();

    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

    const visibleNavItems = navItems.filter(item => {
        if (item.auth === null) return true;
        if (item.auth === "admin") return isAdmin;
        if (item.auth === "user") return user && !isAdmin; // Only regular users, not admins
        return item.auth === !!user;
    });

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {visibleNavItems.map((item) => {
                const isActive = item.href === "/" 
                    ? pathname === "/" 
                    : pathname.startsWith(item.href);
                
                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            isActive && "text-primary bg-muted"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}

function UserProfileMenu() {
    const { user, logout } = useAuth();

    if (!user) {
        return (
            <Button asChild variant="secondary" size="sm">
                <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                </Link>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? "User"} />
                        <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.displayName ?? 'My Account'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function AppShellContent({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const homeHref = user ? "/dashboard" : "/";
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href={homeHref} className="flex items-center gap-2 font-semibold">
                            <Image src={ArtCodeLogo} alt="ART CODE Logo" className="h-8 w-8 object-contain" priority />
                            <span className="text-primary">ART CODE</span>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                       {isClient && <NavContent />}
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0">
                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                           <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                                <Link href={homeHref} className="flex items-center gap-2 font-semibold">
                                    <Image src={ArtCodeLogo} alt="ART CODE Logo" className="h-8 w-8 object-contain" priority />
                                    <span className="text-primary">ART CODE</span>
                                </Link>
                            </div>
                            <div className="flex-1 overflow-auto py-2">
                                {isClient && <NavContent />}
                            </div>
                        </SheetContent>
                    </Sheet>
                    <div className="w-full flex-1" />
                    {isClient && <UserProfileMenu />}
                </header>
                <main className="flex flex-1 flex-col overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Image src={ArtCodeLogo} alt="ART CODE Logo" className="h-12 w-12 object-contain animate-pulse" />
            </div>
        );
    }
    
    return <AppShellContent>{children}</AppShellContent>;
}
