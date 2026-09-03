<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportExportService
{
    public function excel(array $report): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()
            ->setCreator($report['company']['name'] ?? 'Start4Truckers')
            ->setTitle('CRM Reports')
            ->setSubject($this->periodLabel($report));

        $this->summarySheet($spreadsheet, $report);
        $this->revenueSheet($spreadsheet, $report);
        $this->paymentsSheet($spreadsheet, $report);
        $this->servicesSheet($spreadsheet, $report);
        $this->leadsSheet($spreadsheet, $report);
        $this->outstandingSheet($spreadsheet, $report);
        $this->employeesSheet($spreadsheet, $report);
        $this->trendsSheet($spreadsheet, $report);
        $this->complianceSheet($spreadsheet, $report);

        $spreadsheet->setActiveSheetIndex(0);

        $filename = $this->filename($report, 'xlsx');

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function filename(array $report, string $extension): string
    {
        $from = $report['filters']['dateFrom'] ?? now()->toDateString();
        $to = $report['filters']['dateTo'] ?? now()->toDateString();

        return "start4truckers-reports-{$from}-to-{$to}.{$extension}";
    }

    public function periodLabel(array $report): string
    {
        $from = $report['filters']['dateFrom'] ?? '';
        $to = $report['filters']['dateTo'] ?? '';
        $employee = $report['filters']['employeeName'] ?? null;

        $label = "{$from} to {$to}";
        if ($employee) {
            $label .= " · {$employee}";
        }

        return $label;
    }

    private function summarySheet(Spreadsheet $spreadsheet, array $report): void
    {
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Summary');

        $this->titleBlock($sheet, $report, 'CRM Reports');

        $rows = [
            ['Metric', 'Value'],
            ['Invoiced', $report['revenue']['total_invoiced']],
            ['Received', $report['revenue']['total_received']],
            ['Outstanding (period)', $report['revenue']['total_balance']],
            ['Payments', $report['revenue']['payment_count']],
            ['Total leads', $report['lead_conversion']['total']],
            ['Leads won', $report['lead_conversion']['won']],
            ['Leads lost', $report['lead_conversion']['lost']],
            ['Conversion rate %', $report['lead_conversion']['rate']],
            ['Clients with balance', $report['outstanding']['client_count']],
            ['Outstanding balances', $report['outstanding']['total_balance']],
            ['One-Time clients', $report['compliance']['one_time']],
            ['Monthly clients', $report['compliance']['monthly']],
            ['Compliance due in 7 days', $report['compliance']['due_soon']],
        ];

        $this->writeTable($sheet, $rows, 6);
        $sheet->getStyle('B7:B9')->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_CURRENCY_USD);
        $sheet->getStyle('B16')->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_CURRENCY_USD);
        $sheet->getColumnDimension('A')->setWidth(32);
        $sheet->getColumnDimension('B')->setWidth(22);
    }

    private function revenueSheet(Spreadsheet $spreadsheet, array $report): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Revenue');
        $this->titleBlock($sheet, $report, 'Revenue');

        $summary = [
            ['Metric', 'Amount'],
            ['Invoiced', $report['revenue']['total_invoiced']],
            ['Received', $report['revenue']['total_received']],
            ['Outstanding', $report['revenue']['total_balance']],
            ['Payment count', $report['revenue']['payment_count']],
        ];
        $this->writeTable($sheet, $summary, 6);
        $sheet->getStyle('B7:B9')->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_CURRENCY_USD);

        $daily = [['Date', 'Revenue']];
        foreach ($report['revenue']['daily'] as $row) {
            $daily[] = [$row['date'], $row['revenue']];
        }
        $this->writeTable($sheet, $daily, 13, moneyColumns: [2]);
        $sheet->getColumnDimension('A')->setWidth(28);
        $sheet->getColumnDimension('B')->setWidth(18);
    }

    private function paymentsSheet(Spreadsheet $spreadsheet, array $report): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Payments');
        $this->titleBlock($sheet, $report, 'Payments received');

        $summary = [
            ['Metric', 'Value'],
            ['Total received', $report['payments']['total_received'] ?? 0],
            ['Payments', $report['payments']['count'] ?? 0],
        ];
        $this->writeTable($sheet, $summary, 6);
        $sheet->getStyle('B7')->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_CURRENCY_USD);

        $rows = [[
            'Payment date',
            'Client',
            'Company',
            'Client #',
            'Invoice #',
            'Invoice amount',
            'Amount received',
            'Balance',
            'Method',
            'Status',
            'Reference',
        ]];

        foreach ($report['payments']['payments'] ?? [] as $row) {
            $rows[] = [
                $row['paid_at'],
                $row['client_name'],
                $row['company_name'] ?: '—',
                $row['client_number'],
                $row['invoice_number'],
                $row['invoice_amount'],
                $row['amount_received'],
                $row['balance_due'],
                $row['payment_method'] ?: '—',
                $row['status'],
                $row['transaction_reference'] ?: '—',
            ];
        }

        $this->writeTable($sheet, $rows, 11, moneyColumns: [6, 7, 8]);
        foreach (range(1, 11) as $col) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($col))->setAutoSize(true);
        }
    }

    private function servicesSheet(Spreadsheet $spreadsheet, array $report): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Sales by Service');
        $this->titleBlock($sheet, $report, 'Sales by Service');

        $rows = [['Service', 'Completed']];
        foreach ($report['sales_by_service'] as $row) {
            $rows[] = [$row['service'], $row['count']];
        }
        $this->writeTable($sheet, $rows, 6);
        $sheet->getColumnDimension('A')->setWidth(36);
        $sheet->getColumnDimension('B')->setWidth(16);
    }

    private function leadsSheet(Spreadsheet $spreadsheet, array $report): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Lead Conversion');
        $this->titleBlock($sheet, $report, 'Lead Conversion');

        $kpis = [
            ['Metric', 'Value'],
            ['Total leads', $report['lead_conversion']['total']],
            ['Won', $report['lead_conversion']['won']],
            ['Lost', $report['lead_conversion']['lost']],
            ['Open', $report['lead_conversion']['open']],
            ['Follow-up', $report['lead_conversion']['follow_up']],
            ['Quote sent', $report['lead_conversion']['quote_sent']],
            ['Conversion rate %', $report['lead_conversion']['rate']],
        ];
        $this->writeTable($sheet, $kpis, 6);

        $funnel = [['Stage', 'Count']];
        foreach ($report['lead_conversion']['funnel'] as $row) {
            $funnel[] = [$row['stage'], $row['count']];
        }
        $this->writeTable($sheet, $funnel, 16);

        $sources = [['Source', 'Count']];
        foreach ($report['lead_conversion']['by_source'] as $row) {
            $sources[] = [$row['source'], $row['count']];
        }
        $this->writeTable($sheet, $sources, 16 + count($funnel) + 2);

        $sheet->getColumnDimension('A')->setWidth(28);
        $sheet->getColumnDimension('B')->setWidth(16);
    }

    private function outstandingSheet(Spreadsheet $spreadsheet, array $report): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Outstanding');
        $this->titleBlock($sheet, $report, 'Outstanding Balances');

        $rows = [['Client #', 'Name', 'Assigned', 'Invoiced', 'Received', 'Balance Due']];
        foreach ($report['outstanding']['clients'] as $row) {
            $rows[] = [
                $row['client_number'],
                $row['client_name'],
                $row['assigned_to'],
                $row['total_invoiced'],
                $row['total_received'],
                $row['balance_due'],
            ];
        }
        $this->writeTable($sheet, $rows, 6, moneyColumns: [4, 5, 6]);
        foreach (range(1, 6) as $col) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($col))->setAutoSize(true);
        }
    }

    private function employeesSheet(Spreadsheet $spreadsheet, array $report): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Employees');
        $this->titleBlock($sheet, $report, 'Employee Performance');

        $rows = [['Employee', 'Role', 'Leads', 'Won', 'Rate %', 'Clients', 'Revenue', 'Tasks Done', 'Services Done']];
        foreach ($report['employee_perf'] as $row) {
            $rows[] = [
                $row['name'],
                $row['role'],
                $row['leads_assigned'],
                $row['leads_won'],
                $row['conversion_rate'],
                $row['clients_managed'],
                $row['revenue_generated'],
                $row['tasks_completed'],
                $row['services_completed'],
            ];
        }
        $this->writeTable($sheet, $rows, 6, moneyColumns: [7]);
        foreach (range(1, 9) as $col) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($col))->setAutoSize(true);
        }
    }

    private function trendsSheet(Spreadsheet $spreadsheet, array $report): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Monthly Trends');
        $this->titleBlock($sheet, $report, 'Monthly Trends (last 12 months)');

        $rows = [['Month', 'Revenue', 'Leads', 'New Clients', 'Services Completed']];
        foreach ($report['monthly_trends'] as $row) {
            $rows[] = [$row['month'], $row['revenue'], $row['leads'], $row['clients'], $row['services']];
        }
        $this->writeTable($sheet, $rows, 6, moneyColumns: [2]);
        foreach (range(1, 5) as $col) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($col))->setAutoSize(true);
        }
    }

    private function complianceSheet(Spreadsheet $spreadsheet, array $report): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Compliance');
        $this->titleBlock($sheet, $report, 'Compliance');

        $rows = [
            ['Type', 'Clients'],
            ['One-Time', $report['compliance']['one_time']],
            ['Monthly', $report['compliance']['monthly']],
            ['Not set', $report['compliance']['unset']],
            ['Due within 7 days', $report['compliance']['due_soon']],
        ];
        $this->writeTable($sheet, $rows, 6);
        $sheet->getColumnDimension('A')->setWidth(28);
        $sheet->getColumnDimension('B')->setWidth(16);
    }

    private function titleBlock($sheet, array $report, string $title): void
    {
        $sheet->mergeCells('A1:F1');
        $sheet->setCellValue('A1', $report['company']['name'] ?? 'Start4Truckers');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => '12141D']],
        ]);

        $sheet->mergeCells('A2:F2');
        $sheet->setCellValue('A2', $title);
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 13, 'color' => ['rgb' => 'C4A035']],
        ]);

        $sheet->mergeCells('A3:F3');
        $sheet->setCellValue('A3', 'Period: '.$this->periodLabel($report));
        $sheet->getStyle('A3')->applyFromArray([
            'font' => ['size' => 10, 'color' => ['rgb' => '6B7280']],
        ]);

        $sheet->mergeCells('A4:F4');
        $sheet->setCellValue('A4', 'Generated: '.($report['generated_at'] ?? now()->toDateTimeString()));
        $sheet->getStyle('A4')->applyFromArray([
            'font' => ['size' => 10, 'color' => ['rgb' => '6B7280']],
        ]);
    }

    /**
     * @param  list<list<mixed>>  $rows
     * @param  list<int>  $moneyColumns  1-based column indexes
     */
    private function writeTable($sheet, array $rows, int $startRow, array $moneyColumns = [], bool $startRowIsHeader = true): void
    {
        if ($rows === []) {
            return;
        }

        foreach ($rows as $r => $row) {
            foreach (array_values($row) as $c => $value) {
                $sheet->setCellValue([$c + 1, $startRow + $r], $value);
            }
        }

        $lastCol = count($rows[0]);
        $lastRow = $startRow + count($rows) - 1;
        $range = 'A'.$startRow.':'.Coordinate::stringFromColumnIndex($lastCol).$lastRow;

        $sheet->getStyle($range)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'E5E7EB'],
                ],
            ],
            'font' => ['size' => 10, 'color' => ['rgb' => '12141D']],
        ]);

        if ($startRowIsHeader) {
            $headerRange = 'A'.$startRow.':'.Coordinate::stringFromColumnIndex($lastCol).$startRow;
            $sheet->getStyle($headerRange)->applyFromArray([
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '12141D'],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
            ]);
        }

        foreach ($moneyColumns as $col) {
            $colLetter = Coordinate::stringFromColumnIndex($col);
            $dataStart = $startRowIsHeader ? $startRow + 1 : $startRow;
            if ($dataStart <= $lastRow) {
                $sheet->getStyle($colLetter.$dataStart.':'.$colLetter.$lastRow)
                    ->getNumberFormat()
                    ->setFormatCode(NumberFormat::FORMAT_CURRENCY_USD);
            }
        }
    }
}
