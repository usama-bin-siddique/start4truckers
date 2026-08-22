<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientVehicle extends Model
{
    protected $fillable = [
        'client_id',
        'truck_type',
        'vin',
        'year',
        'make',
        'model',
        'gvwr',
        'license_plate',
        'plate_state',
        'title_number',
        'purchase_date',
        'form_2290_status',
        'eld_provider',
        'eld_status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'year'          => 'integer',
            'purchase_date' => 'date',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
