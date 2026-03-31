<?php

namespace App\Services;

use App\Models\SalesOffer;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;

class SalesOfferExportService
{
    private string $brandColor = '8B0000';
    private string $headerBg = 'F8F9FA';
    private string $grandTotalBg = 'D0E0F0';

    /**
     * Generate Excel (XLSX) content for a sales offer
     */
    public function generateExcel(SalesOffer $offer): string
    {
        $offer->load(['items.product', 'items.unit', 'entity', 'currency', 'creator', 'salesPerson', 'convertedOrder']);

        $currencySymbol = $offer->currency?->cur_symbol ?? $offer->currency?->cur_code ?? 'TL';

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Teklif');

        // Set column widths: A=#, B=Ürün Kodu, C=Ürün Adı, D=Miktar, E=Birim, F=Birim Fiyat, G=İskonto %, H=Toplam
        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(16);
        $sheet->getColumnDimension('C')->setWidth(38);
        $sheet->getColumnDimension('D')->setWidth(12);
        $sheet->getColumnDimension('E')->setWidth(10);
        $sheet->getColumnDimension('F')->setWidth(14);
        $sheet->getColumnDimension('G')->setWidth(12);
        $sheet->getColumnDimension('H')->setWidth(16);

        $row = 1;

        // === HEADER: Logo text + Document info ===
        $sheet->mergeCells("A{$row}:C{$row}");
        $sheet->setCellValue("A{$row}", 'ASKOM');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 22, 'color' => ['rgb' => $this->brandColor]],
        ]);

        $sheet->mergeCells("F{$row}:H{$row}");
        $sheet->setCellValue("F{$row}", 'SATIŞ TEKLİFİ');
        $sheet->getStyle("F{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => $this->brandColor]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);
        $row++;

        $sheet->mergeCells("A{$row}:C{$row}");
        $sheet->setCellValue("A{$row}", 'OTEL - RESTAURANT CAFE EKİPMANLARI');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['italic' => true, 'size' => 8, 'color' => ['rgb' => '666666']],
        ]);
        $row++;

        // Separator line
        $sheet->getStyle("A{$row}:H{$row}")->applyFromArray([
            'borders' => ['bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => $this->brandColor]]],
        ]);
        $row += 2;

        // === DOCUMENT INFO (right side) ===
        $docInfoStart = $row;
        $docFields = [
            ['Teklif No:', $offer->offer_no],
            ['Tarih:', $offer->offer_date->format('d.m.Y')],
            ['Geçerlilik:', $offer->valid_until_date->format('d.m.Y')],
            ['Para Birimi:', $offer->currency?->cur_code ?? 'TRY'],
        ];
        if ($offer->convertedOrder?->logo_ficheno) {
            $docFields[] = ['Sipariş No:', $offer->convertedOrder->logo_ficheno];
        }

        // === CUSTOMER INFO (left side) ===
        $sheet->mergeCells("A{$row}:D{$row}");
        $sheet->setCellValue("A{$row}", 'MÜŞTERİ BİLGİLERİ');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => $this->brandColor]],
            'borders' => ['bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => $this->brandColor]]],
        ]);

        // Document info on the right
        foreach ($docFields as $i => $field) {
            $r = $docInfoStart + $i;
            $sheet->setCellValue("G{$r}", $field[0]);
            $sheet->setCellValue("H{$r}", $field[1]);
            $sheet->getStyle("G{$r}")->getFont()->setBold(true);
            $sheet->getStyle("G{$r}:H{$r}")->getFont()->setSize(10);
            $sheet->getStyle("H{$r}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }
        $row++;

        $customerFields = [];
        if ($offer->entity) {
            if ($offer->entity->title) $customerFields[] = ['Müşteri Ünvanı:', $offer->entity->title];
            if ($offer->entity->account_code) $customerFields[] = ['Cari Kod:', $offer->entity->account_code];
            if ($offer->entity->address) $customerFields[] = ['Adres:', $offer->entity->address];
            if ($offer->entity->tax_office) $customerFields[] = ['Vergi Dairesi:', $offer->entity->tax_office];
            if ($offer->entity->tax_number) $customerFields[] = ['V. Numarası:', $offer->entity->tax_number];
            if ($offer->entity->phone_1) $customerFields[] = ['Telefon:', $offer->entity->phone_1];
            if ($offer->entity->email) $customerFields[] = ['Email:', $offer->entity->email];
        } else {
            if ($offer->customer_name) $customerFields[] = ['Müşteri Adı:', $offer->customer_name];
            if ($offer->customer_phone) $customerFields[] = ['Telefon:', $offer->customer_phone];
            if ($offer->customer_email) $customerFields[] = ['Email:', $offer->customer_email];
        }

        foreach ($customerFields as $field) {
            $sheet->setCellValue("A{$row}", $field[0]);
            $sheet->mergeCells("B{$row}:D{$row}");
            $sheet->setCellValue("B{$row}", $field[1]);
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $sheet->getStyle("A{$row}:D{$row}")->getFont()->setSize(10);
            $row++;
        }

        $row = max($row, $docInfoStart + count($docFields)) + 1;

        // === PRODUCTS TABLE ===
        $sheet->mergeCells("A{$row}:H{$row}");
        $sheet->setCellValue("A{$row}", 'ÜRÜN BİLGİLERİ');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $this->brandColor]],
        ]);
        $row++;

        // Table header
        $headers = ['#', 'Ürün Kodu', 'Ürün Adı', 'Miktar', 'Birim', 'Birim Fiyat', 'İskonto %', 'Toplam'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        foreach ($headers as $i => $header) {
            $sheet->setCellValue("{$cols[$i]}{$row}", $header);
        }
        $sheet->getStyle("A{$row}:H{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 9, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $this->brandColor]],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $row++;

        // Items
        $itemNum = 1;
        $itemStartRow = $row;
        foreach ($offer->items as $item) {
            // 3 kademeli iskonto hesabı
            $qty = (float) $item->quantity;
            $originalPrice = (float) $item->unit_price;
            $d1 = (float) ($item->discount_rate1 ?? $item->discount_rate ?? 0);
            $d2 = (float) ($item->discount_rate2 ?? 0);
            $d3 = (float) ($item->discount_rate3 ?? 0);

            $afterD1 = $originalPrice * (1 - $d1 / 100);
            $afterD2 = $afterD1 * (1 - $d2 / 100);
            $discountedUnitPrice = $afterD2 * (1 - $d3 / 100);
            $lineTotal = $qty * $discountedUnitPrice;

            // İskonto yüzdesi gösterimi
            $discountDisplay = '';
            if ($d1 > 0) {
                $discountDisplay = number_format($d1, 0);
                if ($d2 > 0) $discountDisplay .= '+' . number_format($d2, 0);
                if ($d3 > 0) $discountDisplay .= '+' . number_format($d3, 0);
                $discountDisplay .= '%';
            }

            $productCode = $item->product->code ?? $item->product_code ?? '-';
            $unitName = $item->unit?->symbol ?? $item->unit?->name ?? 'Adet';

            $sheet->setCellValue("A{$row}", $itemNum++);
            $sheet->setCellValue("B{$row}", $productCode);
            $sheet->setCellValue("C{$row}", $item->product_name ?? $item->product?->name ?? '-');
            $sheet->setCellValue("D{$row}", $qty);
            $sheet->setCellValue("E{$row}", $unitName);
            $sheet->setCellValue("F{$row}", $discountedUnitPrice);
            $sheet->setCellValue("G{$row}", $discountDisplay);
            $sheet->setCellValue("H{$row}", $lineTotal);

            // Number formats
            $sheet->getStyle("D{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('#,##0.00');

            // Zebra striping
            if ($itemNum % 2 === 0) {
                $sheet->getStyle("A{$row}:H{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $this->headerBg]],
                ]);
            }

            $row++;
        }
        $itemEndRow = $row - 1;

        // Apply borders and alignment to items
        if ($itemStartRow <= $itemEndRow) {
            $sheet->getStyle("A{$itemStartRow}:H{$itemEndRow}")->applyFromArray([
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'DEE2E6']]],
                'font' => ['size' => 9],
            ]);
            $sheet->getStyle("A{$itemStartRow}:A{$itemEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("B{$itemStartRow}:B{$itemEndRow}")->getFont()->setBold(true);
            $sheet->getStyle("D{$itemStartRow}:D{$itemEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("E{$itemStartRow}:E{$itemEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("F{$itemStartRow}:H{$itemEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("G{$itemStartRow}:G{$itemEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        $row += 1;

        // === TOTALS ===
        // Calculate from items (same as PDF logic)
        $discountedSubtotal = $offer->items->sum(function ($item) {
            $qty = (float) $item->quantity;
            $originalPrice = (float) $item->unit_price;
            $d1 = (float) ($item->discount_rate1 ?? $item->discount_rate ?? 0);
            $d2 = (float) ($item->discount_rate2 ?? 0);
            $d3 = (float) ($item->discount_rate3 ?? 0);
            $afterD1 = $originalPrice * (1 - $d1 / 100);
            $afterD2 = $afterD1 * (1 - $d2 / 100);
            $discountedUnitPrice = $afterD2 * (1 - $d3 / 100);
            return $qty * $discountedUnitPrice;
        });

        $generalDiscountRate = (float) ($offer->discount_rate ?? 0);
        $generalDiscountAmount = $discountedSubtotal * ($generalDiscountRate / 100);
        $afterGeneralDiscount = $discountedSubtotal - $generalDiscountAmount;

        $calculatedTax = $offer->items->sum(function ($item) use ($generalDiscountRate) {
            $qty = (float) $item->quantity;
            $originalPrice = (float) $item->unit_price;
            $d1 = (float) ($item->discount_rate1 ?? $item->discount_rate ?? 0);
            $d2 = (float) ($item->discount_rate2 ?? 0);
            $d3 = (float) ($item->discount_rate3 ?? 0);
            $taxRate = (float) ($item->tax_rate ?? 20);
            $afterD1 = $originalPrice * (1 - $d1 / 100);
            $afterD2 = $afterD1 * (1 - $d2 / 100);
            $discountedUnitPrice = $afterD2 * (1 - $d3 / 100);
            $lineTotal = $qty * $discountedUnitPrice;
            $afterGeneralDisc = $lineTotal * (1 - $generalDiscountRate / 100);
            return $afterGeneralDisc * ($taxRate / 100);
        });

        $calculatedTotal = $afterGeneralDiscount + $calculatedTax;

        $totalsStyle = [
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'DEE2E6']]],
            'font' => ['bold' => true, 'size' => 10],
        ];

        // Ara Toplam
        $sheet->mergeCells("F{$row}:G{$row}");
        $sheet->setCellValue("F{$row}", 'Ara Toplam:');
        $sheet->setCellValue("H{$row}", $discountedSubtotal);
        $sheet->getStyle("F{$row}:H{$row}")->applyFromArray($totalsStyle);
        $sheet->getStyle("F{$row}")->applyFromArray([
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $this->headerBg]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);
        $sheet->getStyle("G{$row}")->applyFromArray([
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $this->headerBg]],
        ]);
        $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
        $sheet->getStyle("H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $row++;

        // İskonto
        if ($generalDiscountAmount > 0) {
            $sheet->mergeCells("F{$row}:G{$row}");
            $sheet->setCellValue("F{$row}", "İskonto ({$generalDiscountRate}%):");
            $sheet->setCellValue("H{$row}", -$generalDiscountAmount);
            $sheet->getStyle("F{$row}:H{$row}")->applyFromArray($totalsStyle);
            $sheet->getStyle("F{$row}")->applyFromArray([
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $this->headerBg]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
            ]);
            $sheet->getStyle("G{$row}")->applyFromArray([
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $this->headerBg]],
            ]);
            $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("H{$row}")->getFont()->getColor()->setRGB('DC2626');
            $sheet->getStyle("H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $row++;
        }

        // KDV'siz Toplam
        if ($generalDiscountAmount > 0) {
            $sheet->mergeCells("F{$row}:G{$row}");
            $sheet->setCellValue("F{$row}", "KDV'siz Toplam:");
            $sheet->setCellValue("H{$row}", $afterGeneralDiscount);
            $sheet->getStyle("F{$row}:H{$row}")->applyFromArray($totalsStyle);
            $sheet->getStyle("F{$row}")->applyFromArray([
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $this->headerBg]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
            ]);
            $sheet->getStyle("G{$row}")->applyFromArray([
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $this->headerBg]],
            ]);
            $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $row++;
        }

        // KDV
        $taxRate = (float) ($offer->tax_rate ?? 20);
        $sheet->mergeCells("F{$row}:G{$row}");
        $sheet->setCellValue("F{$row}", "KDV (" . number_format($taxRate, 0) . "%):");
        $sheet->setCellValue("H{$row}", $calculatedTax);
        $sheet->getStyle("F{$row}:H{$row}")->applyFromArray($totalsStyle);
        $sheet->getStyle("F{$row}")->applyFromArray([
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $this->headerBg]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);
        $sheet->getStyle("G{$row}")->applyFromArray([
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $this->headerBg]],
        ]);
        $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
        $sheet->getStyle("H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $row++;

        // GENEL TOPLAM
        $sheet->mergeCells("F{$row}:G{$row}");
        $sheet->setCellValue("F{$row}", 'GENEL TOPLAM:');
        $sheet->setCellValue("H{$row}", $calculatedTotal);
        $sheet->getStyle("F{$row}:H{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $this->brandColor]],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
        ]);
        $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
        $row += 2;

        // === NOTES ===
        if ($offer->customer_notes || $offer->notes) {
            $notes = $offer->customer_notes ?? $offer->notes;
            $sheet->mergeCells("A{$row}:H{$row}");
            $sheet->setCellValue("A{$row}", 'TEKLİF NOTLARI');
            $sheet->getStyle("A{$row}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => $this->brandColor]],
                'borders' => ['bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => $this->brandColor]]],
            ]);
            $row++;
            $sheet->mergeCells("A{$row}:H{$row}");
            $sheet->setCellValue("A{$row}", $notes);
            $sheet->getStyle("A{$row}")->getAlignment()->setWrapText(true);
            $row += 2;
        }

        // === TERMS ===
        if ($offer->terms_conditions) {
            $sheet->mergeCells("A{$row}:H{$row}");
            $sheet->setCellValue("A{$row}", 'ŞARTLAR VE KOŞULLAR');
            $sheet->getStyle("A{$row}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => $this->brandColor]],
                'borders' => ['bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => $this->brandColor]]],
            ]);
            $row++;
            $sheet->mergeCells("A{$row}:H{$row}");
            $sheet->setCellValue("A{$row}", $offer->terms_conditions);
            $sheet->getStyle("A{$row}")->getAlignment()->setWrapText(true);
            $row += 2;
        }

        // === BANK INFO ===
        $sheet->mergeCells("A{$row}:D{$row}");
        $sheet->setCellValue("A{$row}", 'BANKA BİLGİLERİ');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 9, 'color' => ['rgb' => $this->brandColor]],
            'borders' => ['bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => $this->brandColor]]],
        ]);

        $sheet->mergeCells("F{$row}:H{$row}");
        $sheet->setCellValue("F{$row}", 'İLETİŞİM BİLGİLERİ');
        $sheet->getStyle("F{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 9, 'color' => ['rgb' => $this->brandColor]],
            'borders' => ['bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => $this->brandColor]]],
        ]);
        $row++;

        $bankInfo = [
            'ASKOM OTEL RESTAURANT EKİPMANLARI SAN. TİC. LTD. ŞTİ.',
            'GARANTİ BANKASI - BAKIRKÖY TİCARİ-1674',
            'IBAN: TR38 0006 2001 6740 0006 2978 31',
        ];
        $contactInfo = [
            'ASKOM OTEL RESTAURANT EKİPMANLARI SAN. TİC. LTD. ŞTİ.',
            'Tel: ' . ($offer->creator?->mobile_phone ?? '+90 (212) 659 9233'),
            'Email: ' . ($offer->creator?->email ?? 'info@askom.com.tr'),
        ];

        for ($i = 0; $i < max(count($bankInfo), count($contactInfo)); $i++) {
            if (isset($bankInfo[$i])) {
                $sheet->mergeCells("A{$row}:D{$row}");
                $sheet->setCellValue("A{$row}", $bankInfo[$i]);
                $sheet->getStyle("A{$row}")->getFont()->setSize(8);
            }
            if (isset($contactInfo[$i])) {
                $sheet->mergeCells("F{$row}:H{$row}");
                $sheet->setCellValue("F{$row}", $contactInfo[$i]);
                $sheet->getStyle("F{$row}")->getFont()->setSize(8);
                $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            }
            $row++;
        }

        if ($offer->creator) {
            $sheet->mergeCells("F{$row}:H{$row}");
            $sheet->setCellValue("F{$row}", 'Satış Temsilcisi: ' . $offer->creator->name);
            $sheet->getStyle("F{$row}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 8],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
            ]);
            $row++;
        }

        $row++;

        // === FOOTER ===
        $sheet->mergeCells("A{$row}:H{$row}");
        $sheet->setCellValue("A{$row}", 'Bu teklif ' . $offer->valid_until_date->format('d.m.Y') . ' tarihine kadar geçerlidir.');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '666666']],
            'borders' => ['top' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => $this->brandColor]]],
        ]);

        // Print settings
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);
        $sheet->getPageMargins()->setTop(0.5);
        $sheet->getPageMargins()->setBottom(0.5);
        $sheet->getPageMargins()->setLeft(0.5);
        $sheet->getPageMargins()->setRight(0.5);

        // Generate XLSX content
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'xlsx');
        $writer->save($tempFile);
        $content = file_get_contents($tempFile);
        @unlink($tempFile);
        $spreadsheet->disconnectWorksheets();

        return $content;
    }

    /**
     * Download Excel file for a sales offer
     */
    public function download(SalesOffer $offer)
    {
        $content = $this->generateExcel($offer);
        $filename = 'teklif-' . $offer->offer_no . '.xlsx';

        return response($content)
            ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Content-Length', strlen($content))
            ->header('Cache-Control', 'max-age=0');
    }
}
