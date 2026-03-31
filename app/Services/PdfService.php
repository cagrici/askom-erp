<?php

namespace App\Services;

use App\Models\SalesOrder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Response;

class PdfService
{
    /**
     * Generate sales order PDF
     */
    public function generateSalesOrderPdf(SalesOrder $salesOrder, array $options = []): \Barryvdh\DomPDF\PDF
    {
        // Load required relationships
        $salesOrder->load([
            'customer',
            'salesperson',
            'createdBy',
            'items.product.category',
            'items.product.brand',
            'items.product.baseUnit',
            'items.product.tax',
            'items.product.images'
        ]);

        // Set default options
        $defaultOptions = [
            'paper' => 'a4',
            'orientation' => 'portrait',
            'margin-top' => '15mm',
            'margin-bottom' => '15mm',
            'margin-left' => '15mm',
            'margin-right' => '15mm',
            'show-header' => false,
            'show-footer' => false,
        ];

        $options = array_merge($defaultOptions, $options);

        // Generate PDF
        $pdf = Pdf::loadView('pdf.sales-order', compact('salesOrder'))
            ->setPaper($options['paper'], $options['orientation'])
            ->setOptions([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
                'margin-top' => $options['margin-top'],
                'margin-bottom' => $options['margin-bottom'], 
                'margin-left' => $options['margin-left'],
                'margin-right' => $options['margin-right'],
            ]);

        return $pdf;
    }

    /**
     * Download sales order PDF
     */
    public function downloadSalesOrderPdf(SalesOrder $salesOrder, array $options = []): Response
    {
        $pdf = $this->generateSalesOrderPdf($salesOrder, $options);
        $filename = $this->generateSalesOrderFilename($salesOrder);
        
        return $pdf->download($filename);
    }

    /**
     * Stream sales order PDF (view in browser)
     */
    public function streamSalesOrderPdf(SalesOrder $salesOrder, array $options = []): Response
    {
        $pdf = $this->generateSalesOrderPdf($salesOrder, $options);
        $filename = $this->generateSalesOrderFilename($salesOrder);
        
        return $pdf->stream($filename);
    }

    /**
     * Save sales order PDF to storage
     */
    public function saveSalesOrderPdf(SalesOrder $salesOrder, string $disk = 'local', string $directory = 'pdfs/sales-orders', array $options = []): string
    {
        $pdf = $this->generateSalesOrderPdf($salesOrder, $options);
        $filename = $this->generateSalesOrderFilename($salesOrder);
        $filePath = $directory . '/' . $filename;

        // Save to storage
        Storage::disk($disk)->put($filePath, $pdf->output());

        return $filePath;
    }

    /**
     * Generate sales order PDF content as string (for email attachment)
     */
    public function generateSalesOrderPdfContent(SalesOrder $salesOrder, array $options = []): string
    {
        $pdf = $this->generateSalesOrderPdf($salesOrder, $options);
        return $pdf->output();
    }

    /**
     * Generate sales order filename
     */
    private function generateSalesOrderFilename(SalesOrder $salesOrder): string
    {
        $orderNumber = str_replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], '-', $salesOrder->order_number);
        $date = $salesOrder->order_date->format('Y-m-d');
        
        return "Satis-Siparisi-{$orderNumber}-{$date}.pdf";
    }

    /**
     * Get PDF options for different use cases
     */
    public function getPresetOptions(string $preset = 'default'): array
    {
        switch ($preset) {
            case 'email':
                return [
                    'paper' => 'a4',
                    'orientation' => 'portrait',
                    'margin-top' => '10mm',
                    'margin-bottom' => '10mm',
                    'margin-left' => '10mm', 
                    'margin-right' => '10mm',
                ];

            case 'archive':
                return [
                    'paper' => 'a4',
                    'orientation' => 'portrait',
                    'margin-top' => '20mm',
                    'margin-bottom' => '20mm',
                    'margin-left' => '20mm',
                    'margin-right' => '20mm',
                ];

            case 'thermal':
                return [
                    'paper' => [0, 0, 226.77, 566.93], // 80mm thermal printer
                    'orientation' => 'portrait',
                    'margin-top' => '2mm',
                    'margin-bottom' => '2mm',
                    'margin-left' => '2mm',
                    'margin-right' => '2mm',
                ];

            default:
                return [];
        }
    }

    /**
     * Batch generate PDFs for multiple sales orders
     */
    public function batchGenerateSalesOrderPdfs(array $salesOrderIds, string $disk = 'local', string $directory = 'pdfs/sales-orders'): array
    {
        $results = [];
        
        foreach ($salesOrderIds as $id) {
            try {
                $salesOrder = SalesOrder::findOrFail($id);
                $filePath = $this->saveSalesOrderPdf($salesOrder, $disk, $directory);
                
                $results[] = [
                    'success' => true,
                    'order_id' => $id,
                    'order_number' => $salesOrder->order_number,
                    'file_path' => $filePath,
                    'message' => 'PDF generated successfully'
                ];
            } catch (\Exception $e) {
                $results[] = [
                    'success' => false,
                    'order_id' => $id,
                    'error' => $e->getMessage(),
                    'message' => 'Failed to generate PDF'
                ];
            }
        }

        return $results;
    }

    /**
     * Generate PDF with custom company info
     */
    public function generateSalesOrderPdfWithCompanyInfo(SalesOrder $salesOrder, array $companyInfo, array $options = []): \Barryvdh\DomPDF\PDF
    {
        // Load required relationships
        $salesOrder->load([
            'customer',
            'salesperson',
            'createdBy',
            'items.product.category',
            'items.product.brand',
            'items.product.baseUnit',
            'items.product.tax',
            'items.product.images'
        ]);

        $defaultOptions = [
            'paper' => 'a4',
            'orientation' => 'portrait',
            'margin-top' => '15mm',
            'margin-bottom' => '15mm',
            'margin-left' => '15mm',
            'margin-right' => '15mm',
        ];

        $options = array_merge($defaultOptions, $options);

        // Generate PDF with custom company info
        $pdf = Pdf::loadView('pdf.sales-order-custom', compact('salesOrder', 'companyInfo'))
            ->setPaper($options['paper'], $options['orientation'])
            ->setOptions([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'isPhpEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
                'margin-top' => $options['margin-top'],
                'margin-bottom' => $options['margin-bottom'],
                'margin-left' => $options['margin-left'],
                'margin-right' => $options['margin-right'],
            ]);

        return $pdf;
    }
}