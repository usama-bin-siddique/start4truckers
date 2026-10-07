<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Services\LeadIntakeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class WebsiteLeadController extends Controller
{
    public function store(Request $request, LeadIntakeService $intake): JsonResponse
    {
        // Accept the field names used by the Starter Package HTML form as well
        // as the normalized API field names.
        $request->merge([
            'name' => $request->input('name', $request->input('full_name')),
            'date_of_birth' => $request->input('date_of_birth', $request->input('dob')),
            'state' => $request->input('state', $request->input('address_state')),
            'state_of_formation' => $request->input('state_of_formation', $request->input('formation_state')),
            'service_required' => $request->input('service_required', 'Starter Package'),
            'address' => $request->input('address', implode(', ', array_filter([
                $request->input('address_street'),
                $request->input('address_city'),
                $request->input('address_state'),
                $request->input('address_zip'),
            ]))),
        ]);

        $categoryKeys = array_keys(Document::CATEGORIES);

        $rules = [
            'name'             => ['required', 'string', 'max:255'],
            'date_of_birth'    => ['nullable', 'date'],
            'email'            => ['nullable', 'email', 'max:255', 'required_without:phone'],
            'phone'            => ['nullable', 'string', 'max:30', 'required_without:email'],
            'state'            => ['nullable', 'string', 'max:100'],
            'address'          => ['nullable', 'string', 'max:2000'],
            'ssn_itin'         => ['nullable', 'string', 'max:50'],
            'company'          => ['nullable', 'string', 'max:255'],
            'business_name_1'  => ['nullable', 'string', 'max:255'],
            'business_name_2'  => ['nullable', 'string', 'max:255'],
            'business_name_3'  => ['nullable', 'string', 'max:255'],
            'state_of_formation'=> ['nullable', 'string', 'max:10'],
            'business_purpose' => ['nullable', 'string', 'max:2000'],
            'truck_type'       => ['nullable', 'string', 'max:100'],
            'truck_vin'        => ['nullable', 'string', 'max:30'],
            'operation_area'   => ['nullable', 'string', 'max:255'],
            'operation_type'   => ['nullable', 'string', 'max:50'],
            'hear_about_us'    => ['nullable', 'string', 'max:100'],
            'reference_id'     => ['nullable', 'string', 'max:100'],
            'service_required' => ['nullable', 'string', 'max:255'],
            'notes'            => ['nullable', 'string', 'max:5000'],
            'files'            => ['nullable', 'array'],
        ];

        foreach ($categoryKeys as $category) {
            $rules["files.{$category}"]   = ['nullable', 'array'];
            $rules["files.{$category}.*"] = ['file', 'max:20480', 'mimes:jpg,jpeg,png,pdf,doc,docx,xls,xlsx'];
        }

        $data = $request->validate($rules);

        $uploads = $request->file('files', []) ?? [];
        $files   = [];

        foreach ($uploads as $category => $fileList) {
            if (! in_array($category, $categoryKeys, true)) {
                throw ValidationException::withMessages([
                    'files' => "Invalid document category: {$category}.",
                ]);
            }

            $fileList = is_array($fileList) ? $fileList : [$fileList];

            foreach ($fileList as $file) {
                if ($file instanceof UploadedFile) {
                    $files[$category][] = $file;
                }
            }
        }

        unset($data['files']);
        $lead = $intake->createFromWebsite($data, $files);

        return response()->json([
            'message' => 'Lead received.',
            'data'    => [
                'id'              => $lead->id,
                'status'          => $lead->status,
                'documents_count' => $lead->documents()->count(),
            ],
        ], 201);
    }
}
