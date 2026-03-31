<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Barcode extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'barcode', 'barcode_type', 'entity_type', 'entity_id', 'entity_data',
        'width', 'height', 'dpi', 'format',
        'is_primary', 'is_active', 'purpose',
        'label_template', 'print_settings', 'times_printed', 'last_printed_at',
        'scan_count', 'last_scanned_at', 'last_scanned_by',
        'check_digit', 'validation_algorithm', 'requires_validation',
        'image_path', 'pdf_path', 'svg_path',
        'valid_from', 'valid_until', 'status', 'notes',
        'replaced_by_id', 'replaces_id',
        'custom_attributes',
        'created_by', 'updated_by'
    ];

    protected $casts = [
        'entity_data' => 'array',
        'print_settings' => 'array',
        'custom_attributes' => 'array',
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
        'requires_validation' => 'boolean',
        'valid_from' => 'date',
        'valid_until' => 'date',
        'last_printed_at' => 'datetime',
        'last_scanned_at' => 'datetime',
    ];

    // Relationships
    public function entity()
    {
        return $this->morphTo();
    }

    public function replacedBy()
    {
        return $this->belongsTo(Barcode::class, 'replaced_by_id');
    }

    public function replaces()
    {
        return $this->belongsTo(Barcode::class, 'replaces_id');
    }

    public function lastScannedBy()
    {
        return $this->belongsTo(User::class, 'last_scanned_by');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true)->where('status', 'active');
    }

    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('barcode_type', $type);
    }

    public function scopeValid($query)
    {
        return $query->where(function($q) {
            $q->whereNull('valid_from')->orWhere('valid_from', '<=', now());
        })->where(function($q) {
            $q->whereNull('valid_until')->orWhere('valid_until', '>=', now());
        });
    }

    // Accessors
    public function getStatusTextAttribute()
    {
        return match($this->status) {
            'active' => 'Aktif',
            'inactive' => 'Pasif',
            'expired' => 'Süresi Dolmuş',
            'damaged' => 'Hasarlı',
            'replaced' => 'Değiştirilmiş',
            default => ucfirst($this->status)
        };
    }

    public function getBarcodeTypeTextAttribute()
    {
        return match($this->barcode_type) {
            'CODE128' => 'Code 128',
            'EAN13' => 'EAN-13',
            'QR' => 'QR Code',
            'PDF417' => 'PDF417',
            'DATAMATRIX' => 'Data Matrix',
            default => $this->barcode_type
        };
    }

    public function getIsValidAttribute()
    {
        if ($this->status !== 'active' || !$this->is_active) {
            return false;
        }

        if ($this->valid_from && $this->valid_from->isFuture()) {
            return false;
        }

        if ($this->valid_until && $this->valid_until->isPast()) {
            return false;
        }

        return true;
    }

    public function getIsExpiredAttribute()
    {
        return $this->valid_until && $this->valid_until->isPast();
    }

    // Methods
    public function scan($userId = null, $deviceInfo = null)
    {
        $this->increment('scan_count');
        $this->update([
            'last_scanned_at' => now(),
            'last_scanned_by' => $userId ?? auth()->id(),
        ]);

        return $this;
    }

    public function print($userId = null)
    {
        $this->increment('times_printed');
        $this->update([
            'last_printed_at' => now(),
        ]);

        return $this;
    }

    public function generateImage($width = null, $height = null)
    {
        // This would integrate with a barcode generation library
        // For now, return placeholder path
        $width = $width ?? $this->width ?? 300;
        $height = $height ?? $this->height ?? 100;
        
        $filename = "barcode_{$this->id}_{$width}x{$height}.png";
        $path = "barcodes/images/{$filename}";
        
        // Here you would integrate with libraries like:
        // - picqer/php-barcode-generator
        // - milon/barcode
        // - tecnickcom/tcpdf
        
        $this->update(['image_path' => $path]);
        
        return $path;
    }

    public function generatePDF()
    {
        $filename = "barcode_{$this->id}.pdf";
        $path = "barcodes/pdf/{$filename}";
        
        // PDF generation logic would go here
        
        $this->update(['pdf_path' => $path]);
        
        return $path;
    }

    public function validate()
    {
        if (!$this->requires_validation) {
            return true;
        }

        // Implement validation logic based on validation_algorithm
        switch ($this->validation_algorithm) {
            case 'checksum':
                return $this->validateChecksum();
            case 'luhn':
                return $this->validateLuhn();
            default:
                return true;
        }
    }

    protected function validateChecksum()
    {
        // Implement checksum validation
        return true;
    }

    protected function validateLuhn()
    {
        // Implement Luhn algorithm validation
        $barcode = preg_replace('/\D/', '', $this->barcode);
        $sum = 0;
        $alternate = false;

        for ($i = strlen($barcode) - 1; $i >= 0; $i--) {
            $n = intval($barcode[$i]);
            if ($alternate) {
                $n *= 2;
                if ($n > 9) {
                    $n = ($n % 10) + 1;
                }
            }
            $sum += $n;
            $alternate = !$alternate;
        }

        return ($sum % 10) == 0;
    }

    public function replace($newBarcodeData = [], $reason = null)
    {
        // Create new barcode
        $newBarcode = static::create(array_merge([
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'barcode_type' => $this->barcode_type,
            'is_primary' => $this->is_primary,
            'is_active' => true,
            'purpose' => $this->purpose,
            'replaces_id' => $this->id,
            'created_by' => auth()->id(),
        ], $newBarcodeData));

        // Update this barcode
        $this->update([
            'status' => 'replaced',
            'is_active' => false,
            'replaced_by_id' => $newBarcode->id,
            'notes' => ($this->notes ? $this->notes . ' | ' : '') . "Replaced: {$reason}",
        ]);

        return $newBarcode;
    }

    public function deactivate($reason = null)
    {
        $this->update([
            'is_active' => false,
            'status' => 'inactive',
            'notes' => ($this->notes ? $this->notes . ' | ' : '') . "Deactivated: {$reason}",
        ]);

        return $this;
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($barcode) {
            if (!$barcode->barcode_type) {
                $barcode->barcode_type = 'CODE128';
            }
            
            if (!$barcode->format) {
                $barcode->format = 'PNG';
            }
            
            if (!$barcode->dpi) {
                $barcode->dpi = 300;
            }
        });
    }
}