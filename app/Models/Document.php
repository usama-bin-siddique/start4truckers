<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'client_id',
        'category',
        'original_filename',
        'stored_path',
        'mime_type',
        'file_size',
        'uploaded_by',
    ];

    // Category constants
    const CATEGORIES = [
        'driver_license'    => 'Driver License',
        'passport'          => 'Passport',
        'llc_articles'      => 'LLC Articles',
        'ein_letter'        => 'EIN Letter',
        'utility_bill'      => 'Utility Bill',
        'insurance'         => 'Insurance',
        'truck_registration'=> 'Truck Registration',
        'other'             => 'Other',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getCategoryLabelAttribute(): string
    {
        return self::CATEGORIES[$this->category] ?? $this->category;
    }

    public function getFileSizeFormattedAttribute(): string
    {
        if (!$this->file_size) return '—';
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        $size = $this->file_size;
        while ($size >= 1024 && $i < count($units) - 1) {
            $size /= 1024;
            $i++;
        }
        return round($size, 1) . ' ' . $units[$i];
    }
}
