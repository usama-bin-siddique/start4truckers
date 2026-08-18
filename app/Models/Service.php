<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Service extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function clientServices(): HasMany
    {
        return $this->hasMany(ClientService::class);
    }

    public function pricing(): HasOne
    {
        return $this->hasOne(Pricing::class);
    }

    /**
     * @return \Illuminate\Support\Collection<int, self>
     */
    public static function matchingRequirement(?string $requirement)
    {
        if (! filled($requirement)) {
            return collect();
        }

        $catalog = static::query()->where('is_active', true)->get();
        $matched = collect();

        foreach (preg_split('/[,\/|;]+/', $requirement) as $part) {
            $part = trim($part);
            if ($part === '') {
                continue;
            }

            $needle = self::normalizeLabel($part);
            $service = $catalog->first(function (self $service) use ($needle, $part) {
                return strcasecmp($service->name, $part) === 0
                    || self::normalizeLabel($service->name) === $needle
                    || self::normalizeLabel($service->slug) === $needle;
            });

            if ($service) {
                $matched->push($service);
            }
        }

        return $matched->unique('id')->values();
    }

    public static function normalizeLabel(string $value): string
    {
        return strtolower((string) preg_replace('/[^a-z0-9]/i', '', $value));
    }
}
