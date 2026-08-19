import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    UserCheck,
    CreditCard,
    Settings,
    CheckSquare,
    BarChart3,
    Bell,
    LogOut,
    Menu,
    Briefcase,
    FolderOpen,
    X,
    Columns2,
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

interface NavGroup {
    label: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        label: 'Overview',
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
        ],
    },
    {
        label: 'Pipeline',
        items: [
            { label: 'Leads', href: '/leads', icon: <Users size={18} />, roles: ['admin', 'sales', 'manager'] },
            { label: 'Clients', href: '/clients', icon: <UserCheck size={18} /> },
            { label: 'Payments', href: '/payments', icon: <CreditCard size={18} />, roles: ['admin', 'sales'] },
        ],
    },
    {
        label: 'Work',
        items: [
            { label: 'Operations', href: '/operations', icon: <Briefcase size={18} />, roles: ['admin', 'processing'] },
            { label: 'Documents', href: '/documents', icon: <FolderOpen size={18} /> },
            { label: 'Tasks', href: '/tasks', icon: <CheckSquare size={18} /> },
        ],
    },
    {
        label: 'System',
        items: [
            { label: 'Notifications', href: '/notifications', icon: <Bell size={18} /> },
            { label: 'Reports', href: '/reports', icon: <BarChart3 size={18} />, roles: ['admin'] },
            { label: 'Settings', href: '/settings', icon: <Settings size={18} />, roles: ['admin'] },
        ],
    },
];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function formatHeaderDate(): string {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
    const page = usePage<PageProps>();
    const { auth, flash } = page.props;
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [flashMsg, setFlashMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const currentPath = window.location.pathname;
    const userRole = auth?.user?.role || 'admin';

    useEffect(() => {
        const success = flash?.success ?? (typeof page.flash?.success === 'string' ? page.flash.success : undefined);
        const error = flash?.error ?? (typeof page.flash?.error === 'string' ? page.flash.error : undefined);
        if (success) setFlashMsg({ type: 'success', msg: success });
        else if (error) setFlashMsg({ type: 'error', msg: error });
    }, [flash?.success, flash?.error, page.flash]);

    useEffect(() => {
        return router.on('flash', (event) => {
            const data = event.detail.flash as { success?: unknown; error?: unknown };
            if (typeof data?.success === 'string') setFlashMsg({ type: 'success', msg: data.success });
            else if (typeof data?.error === 'string') setFlashMsg({ type: 'error', msg: data.error });
        });
    }, []);

    useEffect(() => {
        if (flashMsg) {
            const t = setTimeout(() => setFlashMsg(null), 5000);
            return () => clearTimeout(t);
        }
    }, [flashMsg]);

    const isItemVisible = (item: NavItem) => !item.roles || item.roles.includes(userRole);

    const isActive = (href: string) => {
        if (href === '/dashboard') return currentPath === '/dashboard' || currentPath === '/';
        return currentPath === href || currentPath.startsWith(`${href}/`);
    };

    const SidebarContent = ({ compact }: { compact: boolean }) => (
        <div className="flex h-full flex-col overflow-hidden rounded-[20px] bg-[#12141D]">
            <div className={cn('flex h-[72px] items-center px-4', compact ? 'justify-center' : 'gap-3')}>
                <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]">
                        <span className="text-[11px] font-bold tracking-wide text-white">S4T</span>
                    </div>
                    {!compact && (
                        <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-white">Start4Truckers</p>
                            <p className="text-[11px] text-white/45">Fleet CRM</p>
                        </div>
                    )}
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 pb-4">
                <TooltipProvider delayDuration={0}>
                    {navGroups.map((group) => {
                        const items = group.items.filter(isItemVisible);
                        if (items.length === 0) return null;

                        return (
                            <div key={group.label} className="mb-5">
                                {!compact && (
                                    <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
                                        {group.label}
                                    </p>
                                )}
                                <div className="space-y-0.5">
                                    {items.map((item) => {
                                        const active = isActive(item.href);
                                        return (
                                            <Tooltip key={item.href}>
                                                <TooltipTrigger asChild>
                                                    <Link
                                                        href={item.href}
                                                        onClick={() => setMobileOpen(false)}
                                                        className={cn(
                                                            'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
                                                            active
                                                                ? 'border border-[#C4A035] border-l-[3px] bg-[#2A2416] text-[#E0B63C]'
                                                                : 'border border-transparent text-white/55 hover:bg-white/[0.06] hover:text-white',
                                                            compact && 'justify-center px-2'
                                                        )}
                                                    >
                                                        <span className={cn(active ? 'text-[#E0B63C]' : 'text-current')}>
                                                            {item.icon}
                                                        </span>
                                                        {!compact && <span>{item.label}</span>}
                                                        {item.label === 'Notifications' && auth?.unread_notifications > 0 && (
                                                            compact ? (
                                                                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-[#12141D]" />
                                                            ) : (
                                                                <span className="ml-auto min-w-[20px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white">
                                                                    {auth.unread_notifications > 9 ? '9+' : auth.unread_notifications}
                                                                </span>
                                                            )
                                                        )}
                                                    </Link>
                                                </TooltipTrigger>
                                                {compact && (
                                                    <TooltipContent side="right" className="border-gray-800 bg-gray-900 text-white">
                                                        {item.label}
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </TooltipProvider>
            </nav>

            <div className={cn('border-t border-white/8 p-3', compact && 'flex justify-center')}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                'flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/[0.06]',
                                compact && 'w-auto justify-center'
                            )}
                        >
                            <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback className="bg-amber-500 text-xs font-semibold text-white">
                                    {auth?.user ? getInitials(auth.user.name) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            {!compact && (
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">{auth?.user?.name}</p>
                                    <p className="truncate text-xs capitalize text-white/45">{auth?.user?.role}</p>
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="w-56 border-gray-200 bg-white">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium text-gray-900">{auth?.user?.name}</p>
                                <p className="text-xs text-gray-500">{auth?.user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/logout" method="post" as="button" className="flex w-full cursor-pointer items-center gap-2 text-red-600">
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
        <div className="flex h-screen gap-3 overflow-hidden bg-[#EFEFEA] p-3">
            <aside
                className={cn(
                    'hidden shrink-0 flex-col transition-all duration-300 lg:flex',
                    collapsed ? 'w-[72px]' : 'w-[248px]'
                )}
            >
                <SidebarContent compact={collapsed} />
            </aside>

            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="fixed top-3 left-3 z-50 flex h-[calc(100%-24px)] w-[248px] flex-col shadow-2xl lg:hidden animate-in slide-in-from-left duration-300">
                        <SidebarContent compact={false} />
                    </aside>
                </>
            )}

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-[#F6F6F4]">
                <header className="flex shrink-0 items-start justify-between px-6 pt-6 pb-2 sm:px-8">
                    <div className="flex items-start gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="mt-0.5 h-9 w-9 text-gray-500 lg:hidden"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu size={20} />
                        </Button>
                        <div>
                            {title && (
                                <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-gray-950">
                                    {title}
                                </h1>
                            )}
                            <p className="mt-0.5 text-sm text-gray-400">{formatHeaderDate()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden h-9 w-9 text-gray-400 hover:text-gray-700 lg:flex"
                            onClick={() => setCollapsed(!collapsed)}
                            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <Columns2 size={18} />
                        </Button>
                        <Link href="/notifications">
                            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-gray-400 hover:text-gray-700">
                                <Bell size={18} />
                                {auth?.unread_notifications > 0 && (
                                    <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-[#F6F6F4]" />
                                )}
                            </Button>
                        </Link>
                    </div>
                </header>

                {flashMsg && (
                    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
                        <div
                            className={cn(
                                'pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg',
                                flashMsg.type === 'success'
                                    ? 'border-green-200 bg-green-50 text-green-800'
                                    : 'border-red-200 bg-red-50 text-red-800'
                            )}
                        >
                            <span className="flex-1">{flashMsg.msg}</span>
                            <button
                                onClick={() => setFlashMsg(null)}
                                className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto">
                    <div className="px-6 pt-4 pb-8 sm:px-8">{children}</div>
                </main>
            </div>
        </div>
    );
}
