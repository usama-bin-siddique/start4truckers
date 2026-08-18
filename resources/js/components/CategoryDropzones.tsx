import React, { useRef, useState } from 'react';
import {
    BookUser, Building2, FileBadge, FileText, FolderOpen, IdCard,
    Receipt, Shield, Truck, Upload, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPT = '.jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx';
const ACCEPT_EXT = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
const MAX_BYTES = 20 * 1024 * 1024;

const categoryIcons: Record<string, React.ReactNode> = {
    driver_license:     <IdCard className="h-4 w-4" />,
    passport:           <BookUser className="h-4 w-4" />,
    llc_articles:       <Building2 className="h-4 w-4" />,
    ein_letter:         <FileBadge className="h-4 w-4" />,
    utility_bill:       <Receipt className="h-4 w-4" />,
    insurance:          <Shield className="h-4 w-4" />,
    truck_registration: <Truck className="h-4 w-4" />,
    other:              <FolderOpen className="h-4 w-4" />,
};

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAccepted(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    return ACCEPT_EXT.includes(ext) && file.size <= MAX_BYTES;
}

export default function CategoryDropzones({
    categories,
    files,
    onChange,
    error,
}: {
    categories: Record<string, string>;
    files: Record<string, File[]>;
    onChange: (files: Record<string, File[]>) => void;
    error?: string;
}) {
    function addFiles(category: string, incoming: File[]) {
        const valid = incoming.filter(isAccepted);
        if (valid.length === 0) return;
        const current = files[category] ?? [];
        onChange({ ...files, [category]: [...current, ...valid] });
    }

    function removeFile(category: string, index: number) {
        const next = (files[category] ?? []).filter((_, i) => i !== index);
        const updated = { ...files };
        if (next.length === 0) {
            delete updated[category];
        } else {
            updated[category] = next;
        }
        onChange(updated);
    }

    return (
        <div className="space-y-3">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(categories).map(([key, label]) => (
                    <DropzoneCard
                        key={key}
                        category={key}
                        label={label}
                        icon={categoryIcons[key] ?? <FileText className="h-4 w-4" />}
                        files={files[key] ?? []}
                        onAdd={(incoming) => addFiles(key, incoming)}
                        onRemove={(index) => removeFile(key, index)}
                    />
                ))}
            </div>
            <p className="text-xs text-gray-400">PDF, Word, Excel, or images · max 20 MB each</p>
        </div>
    );
}

function DropzoneCard({
    category,
    label,
    icon,
    files,
    onAdd,
    onRemove,
}: {
    category: string;
    label: string;
    icon: React.ReactNode;
    files: File[];
    onAdd: (files: File[]) => void;
    onRemove: (index: number) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [over, setOver] = useState(false);

    return (
        <section className="rounded-2xl border border-gray-200/80 bg-[#FAFAF8] p-3.5">
            <div className="mb-2.5 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#12141D] text-[#E0B63C]">
                    {icon}
                </span>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-950">{label}</p>
                    <p className="text-[11px] text-gray-400">
                        {files.length === 0 ? 'No files yet' : `${files.length} file${files.length === 1 ? '' : 's'} ready`}
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setOver(false);
                    onAdd(Array.from(e.dataTransfer.files));
                }}
                className={cn(
                    'flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 py-6 text-center transition-colors',
                    over
                        ? 'border-[#C4A035] bg-amber-50'
                        : 'border-gray-200 bg-white hover:border-[#C4A035]/60 hover:bg-amber-50/40',
                )}
            >
                <Upload className={cn('mb-1.5 h-4 w-4', over ? 'text-amber-700' : 'text-gray-400')} />
                <span className="text-xs font-medium text-gray-600">Drop files or click to browse</span>
            </button>

            <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                    onAdd(Array.from(e.target.files ?? []));
                    e.target.value = '';
                }}
            />

            {files.length > 0 && (
                <ul className="mt-2.5 space-y-1.5">
                    {files.map((file, index) => (
                        <li
                            key={`${category}-${file.name}-${file.size}-${index}`}
                            className="flex items-center gap-2 rounded-lg border border-gray-200/80 bg-white px-2.5 py-1.5"
                        >
                            <FileText className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                            <span className="min-w-0 flex-1 truncate text-xs text-gray-800">{file.name}</span>
                            <span className="shrink-0 text-[10px] text-gray-400">{formatSize(file.size)}</span>
                            <button
                                type="button"
                                onClick={() => onRemove(index)}
                                className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
                                aria-label={`Remove ${file.name}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export function queuedFileCount(files: Record<string, File[]>) {
    return Object.values(files).reduce((sum, list) => sum + list.length, 0);
}
