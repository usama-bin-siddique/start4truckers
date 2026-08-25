import React, { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPT = '.jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx';
const ACCEPT_EXT = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
const MAX_BYTES = 20 * 1024 * 1024;
const CUSTOM_TYPE = '__custom__';

export type DocumentUploadRow = {
    id: string;
    file: File | null;
    category: string;
    customCategory: string;
};

export function emptyDocumentRow(): DocumentUploadRow {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return { id, file: null, category: '', customCategory: '' };
}

export function resolvedDocumentCategory(row: DocumentUploadRow): string {
    if (row.category === CUSTOM_TYPE) {
        return row.customCategory.trim();
    }

    return row.category.trim();
}

export function toDocumentPayload(rows: DocumentUploadRow[]): { category: string; file: File }[] {
    return rows.flatMap((row) => {
        if (!row.file) {
            return [];
        }

        return [{ category: resolvedDocumentCategory(row), file: row.file }];
    });
}

export function queuedDocumentCount(rows: DocumentUploadRow[]): number {
    return rows.filter((row) => row.file).length;
}

function isAccepted(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    return ACCEPT_EXT.includes(ext) && file.size <= MAX_BYTES;
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUploadRows({
    categories,
    rows,
    onChange,
    errors = {},
}: {
    categories: Record<string, string>;
    rows: DocumentUploadRow[];
    onChange: (rows: DocumentUploadRow[]) => void;
    errors?: Record<string, string>;
}) {
    const payloadIndexByRowId = new Map<string, number>();
    let payloadIndex = 0;
    rows.forEach((row) => {
        if (row.file) {
            payloadIndexByRowId.set(row.id, payloadIndex);
            payloadIndex += 1;
        }
    });

    function update(id: string, patch: Partial<DocumentUploadRow>) {
        onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    }

    function addRow() {
        onChange([...rows, emptyDocumentRow()]);
    }

    function removeRow(id: string) {
        if (rows.length <= 1) {
            onChange([emptyDocumentRow()]);
            return;
        }
        onChange(rows.filter((row) => row.id !== id));
    }

    return (
        <div className="space-y-3">
            {rows.map((row, index) => {
                const submittedIndex = payloadIndexByRowId.get(row.id);
                const fileError = submittedIndex !== undefined
                    ? errors[`documents.${submittedIndex}.file`]
                    : undefined;
                const typeError = submittedIndex !== undefined
                    ? errors[`documents.${submittedIndex}.category`]
                    : errors.documents && index === 0 ? errors.documents : undefined;
                const showCustom = row.category === CUSTOM_TYPE;

                return (
                    <div
                        key={row.id}
                        className="rounded-xl border border-gray-200/80 bg-[#FAFAF8] p-3 sm:p-3.5"
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="min-w-0 flex-1">
                                <Label className="mb-1.5 block text-[13px] font-medium text-gray-600">
                                    Document upload
                                </Label>
                                <FilePick
                                    file={row.file}
                                    error={fileError}
                                    onChange={(file) => update(row.id, { file })}
                                />
                            </div>
                            <div className="min-w-0 sm:w-[240px] sm:shrink-0">
                                <Label className="mb-1.5 block text-[13px] font-medium text-gray-600">
                                    Document type
                                </Label>
                                <Select
                                    value={row.category || undefined}
                                    onValueChange={(category) => update(row.id, {
                                        category,
                                        customCategory: category === CUSTOM_TYPE ? row.customCategory : '',
                                    })}
                                >
                                    <SelectTrigger className={cn(typeError && 'border-red-300')}>
                                        <SelectValue placeholder="Select or enter type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(categories).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                        <SelectItem value={CUSTOM_TYPE}>Custom type…</SelectItem>
                                    </SelectContent>
                                </Select>
                                {showCustom && (
                                    <Input
                                        className="mt-2"
                                        placeholder="Enter document type"
                                        value={row.customCategory}
                                        onChange={(e) => update(row.id, { customCategory: e.target.value })}
                                    />
                                )}
                                {typeError && <p className="mt-1 text-xs text-red-500">{typeError}</p>}
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5 sm:pb-0.5">
                                {index === rows.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={addRow}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#12141D] text-white transition-colors hover:bg-black"
                                        aria-label="Add another document"
                                        title="Add another document"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                )}
                                {rows.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeRow(row.id)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                        aria-label="Remove document row"
                                        title="Remove this row"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            <p className="text-xs text-gray-400">PDF, Word, Excel, or images · max 20 MB each · optional</p>
        </div>
    );
}

function FilePick({
    file,
    onChange,
    error,
}: {
    file: File | null;
    onChange: (file: File | null) => void;
    error?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [over, setOver] = useState(false);

    function take(incoming?: File) {
        if (!incoming || !isAccepted(incoming)) return;
        onChange(incoming);
    }

    return (
        <div>
            {file ? (
                <div className="flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{file.name}</span>
                    <span className="shrink-0 text-[10px] text-gray-400">{formatSize(file.size)}</span>
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${file.name}`}
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                    onDragLeave={() => setOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setOver(false);
                        take(e.dataTransfer.files[0]);
                    }}
                    className={cn(
                        'flex h-9 w-full items-center justify-center gap-2 rounded-md border-2 border-dashed px-3 text-sm transition-colors',
                        over
                            ? 'border-[#C4A035] bg-amber-50 text-amber-800'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-[#C4A035]/60 hover:bg-amber-50/40',
                        error && 'border-red-300',
                    )}
                >
                    <Upload className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Drop a file or click to browse</span>
                </button>
            )}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                    take(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />
        </div>
    );
}
