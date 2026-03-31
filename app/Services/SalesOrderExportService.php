<?php

namespace App\Services;

use App\Models\SalesOrder;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class SalesOrderExportService
{
    /**
     * Generate Excel (XLSX) content for a sales order
     */
    public function generateExcel(SalesOrder $order): string
    {
        $order->load(['items.product', 'items.unit', 'customer', 'salesperson', 'createdBy']);

        $currencySymbol = $order->currency ?? 'TRY';

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Siparis');

        // Set column widths
        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(15);
        $sheet->getColumnDimension('C')->setWidth(35);
        $sheet->getColumnDimension('D')->setWidth(12);
        $sheet->getColumnDimension('E')->setWidth(10);
        $sheet->getColumnDimension('F')->setWidth(14);
        $sheet->getColumnDimension('G')->setWidth(10);
        $sheet->getColumnDimension('H')->setWidth(14);
        $sheet->getColumnDimension('I')->setWidth(16);

        $row = 1;

        // Header
        $sheet->mergeCells("A{$row}:I{$row}");
        $sheet->setCellValue("A{$row}", 'SATIS SIPARISI');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 18],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $row += 2;

        // Order info
        $sheet->setCellValue("A{$row}", 'Siparis No:');
        $sheet->setCellValue("B{$row}", $order->order_number);
        $sheet->setCellValue("E{$row}", 'Tarih:');
        $sheet->setCellValue("F{$row}", $order->order_date?->format('d.m.Y') ?? '-');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $sheet->getStyle("E{$row}")->getFont()->setBold(true);
        $row++;

        $sheet->setCellValue("A{$row}", 'Durum:');
        $sheet->setCellValue("B{$row}", $order->status_label ?? $order->status);
        $sheet->setCellValue("E{$row}", 'Teslim Tarihi:');
        $sheet->setCellValue("F{$row}", $order->delivery_date?->format('d.m.Y') ?? $order->requested_delivery_date?->format('d.m.Y') ?? '-');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $sheet->getStyle("E{$row}")->getFont()->setBold(true);
        $row++;

        if ($order->reference_number || $order->external_order_number) {
            $sheet->setCellValue("A{$row}", 'Referans:');
            $sheet->setCellValue("B{$row}", $order->reference_number ?? $order->external_order_number);
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $row++;
        }

        $sheet->setCellValue("A{$row}", 'Para Birimi:');
        $sheet->setCellValue("B{$row}", $currencySymbol);
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row += 2;

        // Customer info header
        $sheet->mergeCells("A{$row}:I{$row}");
        $sheet->setCellValue("A{$row}", 'MUSTERI BILGILERI');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 12],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E0E0E0']],
        ]);
        $row++;

        $sheet->setCellValue("A{$row}", 'Musteri:');
        $sheet->mergeCells("B{$row}:I{$row}");
        $sheet->setCellValue("B{$row}", $order->customer?->title ?? '-');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $row++;

        if ($order->customer?->account_code) {
            $sheet->setCellValue("A{$row}", 'Cari Kod:');
            $sheet->setCellValue("B{$row}", $order->customer->account_code);
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $row++;
        }

        if ($order->salesperson) {
            $sheet->setCellValue("A{$row}", 'Plasiyer:');
            $sheet->setCellValue("B{$row}", $order->salesperson->name ?? $order->salesperson->code ?? '-');
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $row++;
        }

        if ($order->customer?->phone_1) {
            $sheet->setCellValue("A{$row}", 'Telefon:');
            $sheet->setCellValue("B{$row}", $order->customer->phone_1);
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $row++;
        }

        if ($order->customer?->email) {
            $sheet->setCellValue("A{$row}", 'Email:');
            $sheet->setCellValue("B{$row}", $order->customer->email);
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $row++;
        }

        // Shipping address
        $shippingAddr = $order->shipping_address;
        if (is_array($shippingAddr) && !empty($shippingAddr)) {
            $addrParts = array_filter([
                $shippingAddr['address'] ?? $shippingAddr['address_line1'] ?? null,
                $shippingAddr['city'] ?? null,
                $shippingAddr['district'] ?? null,
            ]);
            if (!empty($addrParts)) {
                $sheet->setCellValue("A{$row}", 'Sevk Adresi:');
                $sheet->mergeCells("B{$row}:I{$row}");
                $sheet->setCellValue("B{$row}", implode(', ', $addrParts));
                $sheet->getStyle("A{$row}")->getFont()->setBold(true);
                $sheet->getStyle("B{$row}")->getAlignment()->setWrapText(true);
                $row++;
            }
        }

        $row++;

        // Products header
        $sheet->mergeCells("A{$row}:I{$row}");
        $sheet->setCellValue("A{$row}", 'SIPARIS KALEMLERI');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 12],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E0E0E0']],
        ]);
        $row++;

        // Table header
        $sheet->setCellValue("A{$row}", '#');
        $sheet->setCellValue("B{$row}", 'Urun Kodu');
        $sheet->setCellValue("C{$row}", 'Urun Adi');
        $sheet->setCellValue("D{$row}", 'Miktar');
        $sheet->setCellValue("E{$row}", 'Birim');
        $sheet->setCellValue("F{$row}", 'Birim Fiyat');
        $sheet->setCellValue("G{$row}", 'Isk. %');
        $sheet->setCellValue("H{$row}", 'Isk. Fiyat');
        $sheet->setCellValue("I{$row}", 'Toplam');

        $sheet->getStyle("A{$row}:I{$row}")->applyFromArray([
            'font' => ['bold' => true],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F0F0F0']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $row++;

        // Items
        $itemNum = 1;
        $itemStartRow = $row;
        foreach ($order->items as $item) {
            $qty = (float) $item->quantity;
            $unitPrice = (float) $item->unit_price;

            // Calculate 3-tiered discount
            $d1 = (float) ($item->discount_rate1 ?? 0);
            $d2 = (float) ($item->discount_rate2 ?? 0);
            $d3 = (float) ($item->discount_rate3 ?? 0);

            $afterD1 = $unitPrice * (1 - $d1 / 100);
            $afterD2 = $afterD1 * (1 - $d2 / 100);
            $discountedPrice = $afterD2 * (1 - $d3 / 100);

            $totalDiscount = $d1 + $d2 + $d3;

            // If no 3-tiered, use flat discount
            if ($totalDiscount == 0 && (float) ($item->discount_percentage ?? 0) > 0) {
                $totalDiscount = (float) $item->discount_percentage;
                $discountedPrice = $unitPrice * (1 - $totalDiscount / 100);
            }

            $lineNet = $qty * $discountedPrice;

            $sheet->setCellValue("A{$row}", $itemNum++);
            $sheet->setCellValue("B{$row}", $item->product_code ?? $item->product?->code ?? '-');
            $sheet->setCellValue("C{$row}", $item->product_name ?? $item->product?->name ?? '-');
            $sheet->setCellValue("D{$row}", $qty);
            $sheet->setCellValue("E{$row}", $item->unit?->name ?? $item->unit_of_measure ?? 'Adet');
            $sheet->setCellValue("F{$row}", $unitPrice);
            $sheet->setCellValue("G{$row}", $totalDiscount > 0 ? number_format($totalDiscount, 2, ',', '.') . '%' : '-');
            $sheet->setCellValue("H{$row}", round($discountedPrice, 2));
            $sheet->setCellValue("I{$row}", round($lineNet, 2));

            $sheet->getStyle("D{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
            $row++;
        }
        $itemEndRow = $row - 1;

        // Apply borders to items
        if ($itemStartRow <= $itemEndRow) {
            $sheet->getStyle("A{$itemStartRow}:I{$itemEndRow}")->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ]);
            $sheet->getStyle("A{$itemStartRow}:A{$itemEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("D{$itemStartRow}:I{$itemEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }

        $row++;

        // Totals
        $sheet->setCellValue("H{$row}", 'Ara Toplam:');
        $sheet->setCellValue("I{$row}", (float) $order->subtotal);
        $sheet->getStyle("H{$row}")->getFont()->setBold(true);
        $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
        $sheet->getStyle("H{$row}:I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $row++;

        if ((float) $order->discount_amount > 0) {
            $sheet->setCellValue("H{$row}", 'Iskonto:');
            $sheet->setCellValue("I{$row}", -(float) $order->discount_amount);
            $sheet->getStyle("H{$row}")->getFont()->setBold(true);
            $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("I{$row}")->getFont()->getColor()->setRGB('DC2626');
            $sheet->getStyle("H{$row}:I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $row++;
        }

        $sheet->setCellValue("H{$row}", 'KDV:');
        $sheet->setCellValue("I{$row}", (float) $order->tax_amount);
        $sheet->getStyle("H{$row}")->getFont()->setBold(true);
        $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
        $sheet->getStyle("H{$row}:I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $row++;

        if ((float) $order->shipping_cost > 0) {
            $sheet->setCellValue("H{$row}", 'Nakliye:');
            $sheet->setCellValue("I{$row}", (float) $order->shipping_cost);
            $sheet->getStyle("H{$row}")->getFont()->setBold(true);
            $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("H{$row}:I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $row++;
        }

        // Grand total
        $sheet->setCellValue("H{$row}", 'GENEL TOPLAM:');
        $sheet->setCellValue("I{$row}", (float) $order->total_amount);
        $sheet->getStyle("H{$row}:I{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 12],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D0E0F0']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);
        $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
        $row += 2;

        // Notes
        if ($order->notes) {
            $sheet->mergeCells("A{$row}:I{$row}");
            $sheet->setCellValue("A{$row}", 'NOTLAR');
            $sheet->getStyle("A{$row}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 12],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E0E0E0']],
            ]);
            $row++;

            $sheet->mergeCells("A{$row}:I{$row}");
            $sheet->setCellValue("A{$row}", $order->notes);
            $sheet->getStyle("A{$row}")->getAlignment()->setWrapText(true);
            $row += 2;
        }

        // Terms
        if ($order->terms_and_conditions) {
            $sheet->mergeCells("A{$row}:I{$row}");
            $sheet->setCellValue("A{$row}", 'SARTLAR VE KOSULLAR');
            $sheet->getStyle("A{$row}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 12],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E0E0E0']],
            ]);
            $row++;

            $sheet->mergeCells("A{$row}:I{$row}");
            $sheet->setCellValue("A{$row}", $order->terms_and_conditions);
            $sheet->getStyle("A{$row}")->getAlignment()->setWrapText(true);
            $row += 2;
        }

        // Footer
        $sheet->mergeCells("A{$row}:I{$row}");
        $footerText = 'Siparis No: ' . $order->order_number;
        if ($order->order_date) {
            $footerText .= ' | Tarih: ' . $order->order_date->format('d.m.Y');
        }
        $sheet->setCellValue("A{$row}", $footerText);
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '666666']],
        ]);

        // Generate XLSX content via temp file (avoids output buffering issues)
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'xlsx');
        $writer->save($tempFile);
        $content = file_get_contents($tempFile);
        @unlink($tempFile);
        $spreadsheet->disconnectWorksheets();

        return $content;
    }

    /**
     * Download Excel file for a sales order
     */
    public function download(SalesOrder $order)
    {
        $content = $this->generateExcel($order);
        $filename = 'siparis-' . $order->order_number . '.xlsx';

        return response($content)
            ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Content-Length', strlen($content))
            ->header('Cache-Control', 'max-age=0');
    }
}
