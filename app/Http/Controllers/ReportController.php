<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\User;
use App\Services\ReportExportService;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(
        private ReportService $reports,
        private ReportExportService $exporter
    ) {}

    public function index(Request $request): Response
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');

        $filters = $this->reports->filtersFromRequest($request);
        $report = $this->reports->compile($filters);

        return Inertia::render('Reports/Index', [
            'revenue'          => $report['revenue'],
            'payments'         => $report['payments'],
            'sales_by_service' => $report['sales_by_service'],
            'lead_conversion'  => $report['lead_conversion'],
            'outstanding'      => $report['outstanding'],
            'employee_perf'    => $report['employee_perf'],
            'monthly_trends'   => $report['monthly_trends'],
            'compliance'       => $report['compliance'],
            'users'            => User::where('is_active', true)->select('id', 'name', 'role')->get(),
            'services'         => Service::where('is_active', true)->orderBy('order')->get(['id', 'name']),
            'filters'          => [
                'dateFrom'  => $filters['dateFrom'],
                'dateTo'    => $filters['dateTo'],
                'userId'    => $filters['userId'],
                'serviceId' => $filters['serviceId'],
            ],
        ]);
    }

    public function exportExcel(Request $request): StreamedResponse
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');

        $report = $this->reports->compile($this->reports->filtersFromRequest($request));

        return $this->exporter->excel($report);
    }

    public function exportPdf(Request $request)
    {
        abort_unless(auth()->user()->role === 'admin', 403, 'Unauthorized');

        $report = $this->reports->compile($this->reports->filtersFromRequest($request));
        $filename = $this->exporter->filename($report, 'pdf');

        return Pdf::loadView('reports.export', $report)
            ->setPaper('a4', 'landscape')
            ->download($filename);
    }
}
