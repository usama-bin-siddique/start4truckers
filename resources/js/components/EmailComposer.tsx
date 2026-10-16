import React, { useRef } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Mail, Paperclip, Send, X } from 'lucide-react';

export interface EmailTemplate { id: number; name: string; slug: string; subject: string; body: string }

export interface EmailOption { name: string; label: string; defaultChecked?: boolean }
export interface EmailRecipient { label: string; email: string }

interface Props {
    title: string;
    recipient: string | null;
    postUrl: string;
    backHref: string;
    backLabel: string;
    templates: EmailTemplate[];
    placeholders: Record<string, string>;
    defaultTemplate?: string;
    options?: EmailOption[];
    recipients?: EmailRecipient[];
    missingRecipientMessage: string;
}

type FormData = Record<string, string | boolean | File[]> & {
    subject: string; body: string; attachments: File[];
};

const MAX_FILE_MB = 10;
const MAX_FILES = 10;

export default function EmailComposer({
    title, recipient, postUrl, backHref, backLabel, templates, placeholders,
    defaultTemplate, options = [], recipients = [], missingRecipientMessage,
}: Props) {
    const fileInput = useRef<HTMLInputElement>(null);

    function fill(text: string) {
        return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => placeholders[key] ?? match);
    }

    const initialTemplate = templates.find((t) => t.slug === defaultTemplate);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        subject: initialTemplate ? fill(initialTemplate.subject) : '',
        body: initialTemplate ? fill(initialTemplate.body) : '',
        attachments: [],
        to: recipient ?? '',
        ...Object.fromEntries(options.map((o) => [o.name, o.defaultChecked ?? true])),
    });

    const attachmentError = Object.entries(errors as Record<string, string>)
        .find(([key]) => key.startsWith('attachments'))?.[1];

    function applyTemplate(id: string) {
        const template = templates.find((t) => String(t.id) === id);
        if (!template) return;
        setData((d) => ({ ...d, subject: fill(template.subject), body: fill(template.body) }));
    }

    function addFiles(list: FileList | null) {
        if (!list) return;
        const limit = MAX_FILE_MB * 1024 * 1024;
        const tooBig = Array.from(list).filter((f) => f.size > limit);
        if (tooBig.length) {
            alert(`These files are larger than ${MAX_FILE_MB} MB: ${tooBig.map((f) => f.name).join(', ')}`);
        }
        const accepted = Array.from(list).filter((f) => f.size <= limit);
        setData('attachments', [...data.attachments, ...accepted].slice(0, MAX_FILES));
        if (fileInput.current) fileInput.current.value = '';
    }

    function removeFile(index: number) {
        setData('attachments', data.attachments.filter((_, i) => i !== index));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(postUrl, { forceFormData: true });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-700">
                    <ChevronLeft size={14} /> {backLabel}
                </Link>
                <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-blue-600">
                        <Mail className="h-3 w-3" />
                        EMAIL
                    </span>
                </div>
                <h2 className="mt-3 text-[32px] leading-none font-semibold tracking-tight text-gray-950">
                    {title}
                </h2>
                {recipients.length > 0 && <Field label="Send to *"><Select value={String(data.to ?? '')} onValueChange={(v) => setData('to', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{recipients.map((r) => <SelectItem key={r.email} value={r.email}>{r.label}: {r.email}</SelectItem>)}</SelectContent></Select></Field>}
                {recipient && <p className="mt-2 text-sm text-gray-500">{recipient}</p>}
            </div>

            {!recipient && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {missingRecipientMessage}
                </div>
            )}

            <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
                <div className="grid grid-cols-1 gap-5">
                    {templates.length > 0 && (
                        <Field label="Template">
                            <Select defaultValue={initialTemplate ? String(initialTemplate.id) : undefined} onValueChange={applyTemplate}>
                                <SelectTrigger><SelectValue placeholder="Start from a template (optional)" /></SelectTrigger>
                                <SelectContent>
                                    {templates.map((t) => (
                                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    )}
                    <Field label="Subject *" error={errors.subject}>
                        <Input
                            placeholder="Subject"
                            value={data.subject}
                            onChange={(e) => setData('subject', e.target.value)}
                        />
                    </Field>
                    <Field label="Message *" error={errors.body}>
                        <Textarea
                            rows={14}
                            placeholder="Write your message…"
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                        />
                    </Field>
                    <Field label="Attachments" error={attachmentError}>
                        <div className="space-y-2">
                            {options.map((o) => (
                                <label key={o.name} className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300"
                                        checked={Boolean(data[o.name])}
                                        onChange={(e) => setData(o.name, e.target.checked)}
                                    />
                                    {o.label}
                                </label>
                            ))}
                            {data.attachments.map((file, i) => (
                                <div key={`${file.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
                                    <Paperclip size={14} className="shrink-0 text-gray-400" />
                                    <span className="min-w-0 flex-1 truncate text-gray-800">{file.name}</span>
                                    <span className="shrink-0 text-xs text-gray-400">{formatSize(file.size)}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(i)}
                                        className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                        aria-label={`Remove ${file.name}`}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <input
                                ref={fileInput}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => addFiles(e.target.files)}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={data.attachments.length >= MAX_FILES}
                                onClick={() => fileInput.current?.click()}
                            >
                                <Paperclip size={13} /> Add files
                            </Button>
                            <p className="text-xs text-gray-400">Up to {MAX_FILES} files, {MAX_FILE_MB} MB each.</p>
                        </div>
                    </Field>
                </div>
            </section>

            <div className="flex justify-end gap-2.5">
                <Button type="button" variant="outline" className="h-10 rounded-lg" asChild>
                    <Link href={backHref}>Cancel</Link>
                </Button>
                <button
                    type="submit"
                    disabled={processing || !recipient}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#12141D] px-5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-70"
                >
                    <Send size={14} />
                    {processing ? 'Sending…' : 'Send email'}
                </button>
            </div>
        </form>
    );
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-gray-600">{label}</Label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
