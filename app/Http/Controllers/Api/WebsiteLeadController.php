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
        $categoryKeys = array_keys(Document::CATEGORIES);

        $rules = [
            'name'             => ['required', 'string', 'max:255'],
            'email'            => ['nullable', 'email', 'max:255', 'required_without:phone'],
            'phone'            => ['nullable', 'string', 'max:30', 'required_without:email'],
            'state'            => ['nullable', 'string', 'max:100'],
            'company'          => ['nullable', 'string', 'max:255'],
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
