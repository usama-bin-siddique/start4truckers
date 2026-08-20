import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogUser { id: number; name: string; email: string; role: string }
interface QueryItem { query: string; bindings: unknown[]; time_in_ms: number }
interface Props {
    log: {
        id: number;
        action: string;
        method: string;
        url: string;
        path: string;
        ip: string | null;
        user: LogUser | null;
        status_code: number | null;
        duration: number;
        total_queries: number | null;
        created_at: string;
        user_agent: string | null;
        request_payload: unknown;
        response_payload: unknown;
        db_queries: { total_time_ms: number; queries: QueryItem[] };
    };
}

const actionLabel: Record<string, string> = {
    request: 'Request',
    login: 'Login',
    logout: 'Logout',
    failed_login: 'Failed login',
};

function pretty(value: unknown): string {
    if (value == null || value === '') return '—';
    if (typeof value === 'string') {
        try {
            return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
            return value;
        }
    }
    return JSON.stringify(value, null, 2);
}

function statusClass(code: number | null): string {
    if (!code) return 'bg-gray-100 text-gray-600';
    if (code >= 500) return 'bg-red-100 text-red-700';
    if (code >= 400) return 'bg-amber-100 text-amber-700';
    if (code >= 300) return 'bg-sky-100 text-sky-700';
    return 'bg-emerald-100 text-emerald-700';
}

export default function RequestLogShow({ log }: Props) {
    return (
        <>
            <Head title={`Activity log #${log.id}`} />
            <AppLayout title={`Activity log #${log.id}`}>
                <div className="space-y-6">
                    <Link href="/request-logs" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
                        <ChevronLeft size={16} /> Back to logs
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{actionLabel[log.action] ?? log.action}</Badge>
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">{log.method}</span>
                        <span className={cn('rounded px-2 py-0.5 text-[11px] font-semibold', statusClass(log.status_code))}>
                            {log.status_code}
                        </span>
                    </div>
                    <p className="break-all font-mono text-sm text-gray-700">{log.url}</p>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm lg:col-span-1">
                            <h3 className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Overview</h3>
                            <dl className="mt-4 space-y-3 text-sm">
                                <Row label="When" value={log.created_at} />
                                <Row label="User" value={log.user ? `${log.user.name} (${log.user.email})` : 'Guest'} />
                                <Row label="IP" value={log.ip ?? '—'} />
                                <Row label="Duration" value={`${Math.round(log.duration * 1000)} ms`} />
                                <Row label="Queries" value={String(log.total_queries ?? 0)} />
                                <Row label="User agent" value={log.user_agent ?? '—'} />
                            </dl>
                        </section>

                        <div className="space-y-4 lg:col-span-2">
                            <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
                                <h3 className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Request payload</h3>
                                <pre className="mt-3 max-h-[320px] overflow-auto rounded-lg bg-[#12141D] p-4 text-xs text-amber-100">{pretty(log.request_payload)}</pre>
                            </section>
                            <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
                                <h3 className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Response</h3>
                                <pre className="mt-3 max-h-[320px] overflow-auto rounded-lg bg-[#12141D] p-4 text-xs text-amber-100">{pretty(log.response_payload)}</pre>
                            </section>
                        </div>
                    </div>

                    <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-medium tracking-[0.14em] text-gray-400 uppercase">Database queries</h3>
                            <p className="text-xs text-gray-400">{log.db_queries.total_time_ms ?? 0} ms total</p>
                        </div>
                        {(log.db_queries.queries ?? []).length === 0 ? (
                            <p className="mt-4 text-sm text-gray-400">No queries recorded</p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {log.db_queries.queries.map((query, i) => (
                                    <div key={i} className="rounded-xl border border-gray-100 bg-[#F7F7F5] p-4">
                                        <p className="font-mono text-xs text-red-700 break-all">{query.query}</p>
                                        {query.bindings?.length > 0 && (
                                            <p className="mt-2 font-mono text-[11px] text-gray-500">
                                                Bindings: {JSON.stringify(query.bindings)}
                                            </p>
                                        )}
                                        <p className="mt-2 text-[11px] text-gray-400">#{i + 1} · {query.time_in_ms} ms</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </AppLayout>
        </>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[11px] text-gray-400">{label}</dt>
            <dd className="mt-0.5 break-all text-gray-800">{value}</dd>
        </div>
    );
}
