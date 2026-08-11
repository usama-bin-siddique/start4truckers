import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    UserCheck,
    CreditCard,
    Settings,
    FileText,
    CheckSquare,
    BarChart3,
    ChevronLeft,
    Bell,
    LogOut,
    Menu,
    Briefcase,
    FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface PageProps {
    auth: {
        user: User;
        unread_notifications: number;
    };
    flash: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    roles?: string[];
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Leads', href: '/leads', icon: <Users size={18} />, roles: ['admin', 'sales'] },
    { label: 'Clients', href: '/clients', icon: <UserCheck size={18} /> },
    { label: 'Payments', href: '/payments', icon: <CreditCard size={18} />, roles: ['admin', 'sales'] },
    { label: 'Operations', href: '/operations', icon: <Briefcase size={18} />, roles: ['admin', 'processing'] },
    { label: 'Documents', href: '/documents', icon: <FolderOpen size={18} /> },
    { label: 'Tasks', href: '/tasks', icon: <CheckSquare size={18} /> },
    { label: 'Notifications', href: '/notifications', icon: <Bell size={18} /> },
    { label: 'Reports', href: '/reports', icon: <BarChart3 size={18} />, roles: ['admin'] },
    { label: 'Settings', href: '/settings', icon: <Settings size={18} />, roles: ['admin'] },
];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
    const { auth, flash } = usePage<PageProps>().props;
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [flashMsg, setFlashMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const currentPath = window.location.pathname;
    const userRole = auth?.user?.role || 'admin';

    useEffect(() => {
        if (flash?.success) setFlashMsg({ type: 'success', msg: flash.success });
        else if (flash?.error) setFlashMsg({ type: 'error', msg: flash.error });
        else setFlashMsg(null);
    }, [flash]);

    useEffect(() => {
        if (flashMsg) {
            const t = setTimeout(() => setFlashMsg(null), 4000);
            return () => clearTimeout(t);
        }
    }, [flashMsg]);

    const visibleNav = navItems.filter(
        (item) => !item.roles || item.roles.includes(userRole)
    );

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={cn('flex items-center px-4 h-16 border-b border-gray-200', collapsed ? 'justify-center' : 'justify-between')}>
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-bold">S4T</span>
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">Start4Truckers</span>
                    </div>
                )}
                {collapsed && (
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">S4T</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="hidden lg:flex h-7 w-7"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronLeft size={14} className={cn('transition-transform', collapsed && 'rotate-180')} />
                </Button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
                <TooltipProvider delayDuration={0}>
                    {visibleNav.map((item) => {
                        const isActive = currentPath.startsWith(item.href);
                        return (
                            <Tooltip key={item.href}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors relative',
                                            isActive
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                                            collapsed && 'justify-center px-2'
                                        )}
                                    >
                                        <span className={cn(isActive ? 'text-blue-600' : 'text-gray-400')}>
                                            {item.icon}
                                        </span>
                                        {!collapsed && <span>{item.label}</span>}
                                        {item.label === 'Notifications' && auth?.unread_notifications > 0 && (
                                            <span className={cn(
                                                'absolute top-1 left-1 h-2 w-2 rounded-full bg-red-500',
                                                collapsed && 'top-0.5 left-6'
                                            )} />
                                        )}
                                    </Link>
                                </TooltipTrigger>
                                {collapsed && (
                                    <TooltipContent side="right">{item.label}</TooltipContent>
                                )}
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            </nav>

            {/* User */}
            <div className={cn('border-t border-gray-200 p-3', collapsed && 'flex justify-center')}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            'flex items-center gap-3 w-full rounded-md p-2 hover:bg-gray-100 transition-colors text-left',
                            collapsed && 'w-auto'
                        )}>
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                    {auth?.user ? getInitials(auth.user.name) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            {!collapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">{auth?.user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate capitalize">{auth?.user?.role}</p>
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="w-48">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="cursor-pointer">Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/logout" method="post" as="button" className="cursor-pointer w-full flex items-center gap-2 text-red-600">
                                <LogOut size={14} />
                                Sign out
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className={cn(
                'hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-200 shrink-0',
                collapsed ? 'w-16' : 'w-60'
            )}>
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="fixed left-0 top-0 z-50 flex flex-col w-60 h-full bg-white border-r border-gray-200 lg:hidden">
                        <SidebarContent />
                    </aside>
                </>
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu size={18} />
                        </Button>
                        {title && (
                            <h1 className="text-base font-semibold text-gray-900">{title}</h1>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell size={18} />
                            {auth?.unread_notifications > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                            )}
                        </Button>
                    </div>
                </header>

                {/* Flash message */}
                {flashMsg && (
                    <div className={`mx-6 mt-4 flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium ${
                        flashMsg.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                        <span className="flex-1">{flashMsg.msg}</span>
                        <button onClick={() => setFlashMsg(null)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
                    </div>
                )}

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
