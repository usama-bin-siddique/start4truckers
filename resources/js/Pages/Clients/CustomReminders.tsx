import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Bell, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MAX_REMINDERS_PER_BATCH = 10;

export type ClientReminder = {
    id: number;
    remind_at: string | null;
    date: string | null;
    time: string | null;
    description: string;
    created_by: string | null;
    notified_at: string | null;
    is_due: boolean;
};

type ReminderRow = {
    date: string;
    time: string;
    description: string;
};

export function emptyReminderRow(): ReminderRow {
    return { date: '', time: '', description: '' };
}

function formatWhen(reminder: ClientReminder): string {
    if (!reminder.remind_at) {
        return 'No date';
    }

    const parsed = new Date(reminder.remind_at);

    if (Number.isNaN(parsed.getTime())) {
        return reminder.remind_at.replace('T', ' ');
    }

    return parsed.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function CustomReminderDialog({
    clientId,
    open,
    onOpenChange,
}: {
    clientId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm<{ reminders: ReminderRow[] }>({
        reminders: [emptyReminderRow()],
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(`/clients/${clientId}/reminders`, {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
                form.setData('reminders', [emptyReminderRow()]);
            },
        });
    }

    function addRow() {
        if (form.data.reminders.length >= MAX_REMINDERS_PER_BATCH) {
            return;
        }

        form.setData('reminders', [...form.data.reminders, emptyReminderRow()]);
    }

    function removeRow(index: number) {
        if (form.data.reminders.length === 1) {
            form.setData('reminders', [emptyReminderRow()]);
            return;
        }

        form.setData('reminders', form.data.reminders.filter((_, i) => i !== index));
    }

    function updateRow(index: number, field: keyof ReminderRow, value: string) {
        form.setData(
            'reminders',
            form.data.reminders.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
        );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                onOpenChange(next);
                if (!next) {
                    form.reset();
                    form.setData('reminders', [emptyReminderRow()]);
                    form.clearErrors();
                }
            }}
        >
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Custom reminders</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-gray-500">
                    Create up to {MAX_REMINDERS_PER_BATCH} reminders for this client. Each reminder needs a date, time, and what needs to be done.
                </p>
                <form onSubmit={submit} className="space-y-4">
                    {form.data.reminders.map((row, index) => (
                        <div key={index} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">Reminder {index + 1}</p>
                                {form.data.reminders.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeRow(index)}
                                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600"
                                    >
                                        <X className="h-3.5 w-3.5" /> Remove
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Reminder date</Label>
                                    <Input
                                        type="date"
                                        value={row.date}
                                        onChange={(e) => updateRow(index, 'date', e.target.value)}
                                    />
                                    {form.errors[`reminders.${index}.date`] && (
                                        <p className="text-xs text-red-500">{form.errors[`reminders.${index}.date`]}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Reminder time</Label>
                                    <Input
                                        type="time"
                                        value={row.time}
                                        onChange={(e) => updateRow(index, 'time', e.target.value)}
                                    />
                                    {form.errors[`reminders.${index}.time`] && (
                                        <p className="text-xs text-red-500">{form.errors[`reminders.${index}.time`]}</p>
                                    )}
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Description / purpose</Label>
                                    <Textarea
                                        rows={2}
                                        value={row.description}
                                        onChange={(e) => updateRow(index, 'description', e.target.value)}
                                        placeholder="What we need to do"
                                    />
                                    {form.errors[`reminders.${index}.description`] && (
                                        <p className="text-xs text-red-500">{form.errors[`reminders.${index}.description`]}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {form.errors.reminders && <p className="text-xs text-red-500">{form.errors.reminders}</p>}
                    {form.data.reminders.length < MAX_REMINDERS_PER_BATCH && (
                        <Button type="button" variant="outline" size="sm" onClick={addRow}>
                            <Plus className="h-4 w-4" /> Add another reminder
                        </Button>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={form.processing} className="bg-[#12141D] hover:bg-black">
                            Save reminders
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function ClientRemindersList({
    clientId,
    reminders,
    canEdit,
    onAdd,
}: {
    clientId: number;
    reminders: ClientReminder[];
    canEdit: boolean;
    onAdd?: () => void;
}) {
    const [deleteId, setDeleteId] = useState<number | null>(null);

    return (
        <section className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-gray-950">Custom reminders</h3>
                    <p className="mt-1 text-sm text-gray-500">Client-specific follow-ups for dates, times, and tasks.</p>
                </div>
                {canEdit && onAdd && (
                    <Button type="button" size="sm" variant="outline" onClick={onAdd}>
                        <Bell className="h-4 w-4" /> Custom reminder
                    </Button>
                )}
            </div>
            <div className="mt-4 space-y-2">
                {reminders.length === 0 ? (
                    <p className="text-sm text-gray-400">No custom reminders yet.</p>
                ) : reminders.map((reminder) => (
                    <div
                        key={reminder.id}
                        className={cn(
                            'flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3',
                            reminder.notified_at
                                ? 'border-gray-100 bg-gray-50'
                                : reminder.is_due
                                    ? 'border-amber-200 bg-amber-50/60'
                                    : 'border-gray-200 bg-white',
                        )}
                    >
                        <div>
                            <p className="text-sm font-medium text-gray-900">{formatWhen(reminder)}</p>
                            <p className="mt-0.5 text-sm text-gray-600">{reminder.description}</p>
                            <p className="mt-0.5 text-xs text-gray-400">
                                {reminder.notified_at ? 'Sent' : reminder.is_due ? 'Due now' : 'Scheduled'}
                                {reminder.created_by ? ` · ${reminder.created_by}` : ''}
                            </p>
                        </div>
                        {canEdit && (
                            <Button type="button" size="sm" variant="ghost" className="text-gray-500 hover:text-red-600" onClick={() => setDeleteId(reminder.id)}>
                                Remove
                            </Button>
                        )}
                    </div>
                ))}
            </div>
            <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove this reminder?</AlertDialogTitle>
                        <AlertDialogDescription>This reminder will be deleted for this client.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteId) {
                                    router.delete(`/clients/${clientId}/reminders/${deleteId}`, { preserveScroll: true });
                                }
                                setDeleteId(null);
                            }}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}
