import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    UserCheck,
    CreditCard,
    Settings,
    CheckSquare,
    BarChart3,
    ChevronLeft,
    Bell,
    LogOut,
    Menu,
    Briefcase,
    FolderOpen,
    X,
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
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Leads', href: '/leads', icon: <Users size={20} />, roles: ['admin', 'sales'] },
    { label: 'Clients', href: '/clients', icon: <UserCheck size={20} /> },
    { label: 'Payments', href: '/payments', icon: <CreditCard size={20} />, roles: ['admin', 'sales'] },
    { label: 'Operations', href: '/operations', icon: <Briefcase size={20} />, roles: ['admin', 'processing'] },
    { label: 'Documents', href: '/documents', icon: <FolderOpen size={20} /> },
    { label: 'Tasks', href: '/tasks', icon: <CheckSquare size={20} /> },
    { label: 'Notifications', href: '/notifications', icon: <Bell size={20} /> },
    { label: 'Reports', href: '/reports', icon: <BarChart3 size={20} />, roles: ['admin'] },
    { label: 'Settings', href: '/settings', icon: <Settings size={20} />, roles: ['admin'] },
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
            const t = setTimeout(() => setFlashMsg(null), 5000);
            return () => clearTimeout(t);
        }
    }, [flashMsg]);

    const visibleNav = navItems.filter(
        (item) => !item.roles || item.roles.includes(userRole)
    );

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#0F172A]">
            {/* Logo Section */}
            <div className={cn(
                'flex items-center border-b border-white/10 h-16 px-4',
                collapsed ? 'justify-center' : 'justify-between'
            )}>
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-white text-sm font-bold">S4T</span>
                        </div>
                        <span className="font-semibold text-white text-base">Start4Truckers</span>
                    </Link>
                )}
                {collapsed && (
                    <Link href="/dashboard">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-white text-sm font-bold">S4T</span>
                        </div>
                    </Link>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="hidden lg:flex h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronLeft size={18} className={cn('transition-transform duration-200', collapsed && 'rotate-180')} />
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <TooltipProvider delayDuration={0}>
                    {visibleNav.map((item) => {
                        const isActive = currentPath.startsWith(item.href);
                        return (
                            <Tooltip key={item.href}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                : 'text-white/70 hover:bg-white/10 hover:text-white',
                                            collapsed && 'justify-center px-2'
                                        )}
                                    >
                                        <span className={cn(isActive ? 'text-white' : '')}>
                                            {item.icon}
                                        </span>
                                        {!collapsed && <span>{item.label}</span>}
                                        {item.label === 'Notifications' && auth?.unread_notifications > 0 && (
                                            <span className={cn(
                                                'absolute flex items-center justify-center',
                                                collapsed 
                                                    ? 'top-1 right-1 h-2 w-2' 
                                                    : 'right-3 h-5 w-5 text-[10px] font-semibold'
                                            )}>
                                                {collapsed ? (
                                                    <span className="h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0F172A]" />
                                                ) : (
                                                    <span className="rounded-full bg-red-500 text-white px-1.5 py-0.5 min-w-[20px] text-center">
                                                        {auth.unread_notifications > 9 ? '9+' : auth.unread_notifications}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </Link>
                                </TooltipTrigger>
                                {collapsed && (
                                    <TooltipContent side="right" className="bg-gray-900 text-white border-gray-800">
                                        {item.label}
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            </nav>

            {/* User Section */}
            <div className={cn('border-t border-white/10 p-3', collapsed && 'flex justify-center')}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            'flex items-center gap-3 w-full rounded-lg p-2.5 hover:bg-white/10 transition-colors text-left',
                            collapsed && 'w-auto justify-center'
                        )}>
                            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-white/20">
                                <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                    {auth?.user ? getInitials(auth.user.name) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            {!collapsed && (
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-white truncate">{auth?.user?.name}</p>
                                    <p className="text-xs text-white/60 truncate capitalize">{auth?.user?.role}</p>
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="w-56 bg-white border-gray-200">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium text-gray-900">{auth?.user?.name}</p>
                                <p className="text-xs text-gray-500">{auth?.user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/logout" method="post" as="button" className="cursor-pointer w-full flex items-center gap-2 text-red-600">
                                <LogOut size={16} />
                                <span>Sign out</span>
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
                'hidden lg:flex flex-col transition-all duration-300 shrink-0 shadow-xl',
                collapsed ? 'w-16' : 'w-64'
            )}>
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="fixed left-0 top-0 z-50 flex flex-col w-64 h-full shadow-2xl lg:hidden animate-in slide-in-from-left duration-300">
                        <SidebarContent />
                    </aside>
                </>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header Bar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden h-9 w-9"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu size={20} />
                        </Button>
                        {title && (
                            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/notifications">
                            <Button variant="ghost" size="icon" className="relative h-9 w-9">
                                <Bell size={20} />
                                {auth?.unread_notifications > 0 && (
                                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                                )}
                            </Button>
                        </Link>
                    </div>
                </header>

                {/* Flash Messages */}
                {flashMsg && (
                    <div className="mx-6 mt-4 animate-in slide-in-from-top duration-300">
                        <div className={cn(
                            'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-sm border',
                            flashMsg.type === 'success'
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                        )}>
                            <span className="flex-1">{flashMsg.msg}</span>
                            <button 
                                onClick={() => setFlashMsg(null)} 
                                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
