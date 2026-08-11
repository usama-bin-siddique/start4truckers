<?php

namespace App\Services;

use App\Models\Activity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ActivityService
{
    public function log(
        Model  $subject,
        string $action,
        string $description,
        mixed  $oldValue = null,
        mixed  $newValue = null,
        ?int   $causerId  = null
    ): Activity {
        return Activity::create([
            'subject_type' => get_class($subject),
            'subject_id'   => $subject->getKey(),
            'causer_id'    => $causerId ?? Auth::id(),
            'action'       => $action,
            'description'  => $description,
            'old_value'    => $oldValue,
            'new_value'    => $newValue,
        ]);
    }
}
