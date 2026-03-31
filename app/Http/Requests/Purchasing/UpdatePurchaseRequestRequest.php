<?php

namespace App\Http\Requests\Purchasing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePurchaseRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $purchaseRequestId = $this->route('purchase_request');
        
        return [
            'request_number' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('purchase_requests')->ignore($purchaseRequestId)
            ],
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'department_id' => 'required|exists:departments,id',
            'location_id' => 'required|exists:locations,id',
            'requested_by' => 'required|exists:users,id',
            'required_date' => 'required|date',
            'priority' => 'required|in:low,medium,high,urgent',
            'budget_code' => 'nullable|string|max:255',
            'currency' => 'required|in:TRY,USD,EUR,GBP',
            'total_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            
            // Items validation
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:purchase_request_items,id',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string|max:500',
            'items.*.specification' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'required|string|max:50',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total_price' => 'required|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Talep başlığı zorunludur.',
            'department_id.required' => 'Departman seçimi zorunludur.',
            'location_id.required' => 'Lokasyon seçimi zorunludur.',
            'requested_by.required' => 'Talep eden kişi seçimi zorunludur.',
            'required_date.required' => 'Gerekli tarih zorunludur.',
            'priority.required' => 'Öncelik seçimi zorunludur.',
            'currency.required' => 'Para birimi seçimi zorunludur.',
            'total_amount.required' => 'Toplam tutar zorunludur.',
            'total_amount.min' => 'Toplam tutar 0\'dan büyük olmalıdır.',
            'items.required' => 'En az bir ürün kalemi eklenmesi zorunludur.',
            'items.min' => 'En az bir ürün kalemi eklenmesi zorunludur.',
            'items.*.description.required' => 'Ürün açıklaması zorunludur.',
            'items.*.quantity.required' => 'Miktar zorunludur.',
            'items.*.quantity.min' => 'Miktar 0\'dan büyük olmalıdır.',
            'items.*.unit.required' => 'Birim zorunludur.',
            'items.*.unit_price.required' => 'Birim fiyat zorunludur.',
            'items.*.unit_price.min' => 'Birim fiyat 0\'dan büyük olmalıdır.',
            'items.*.total_price.required' => 'Toplam fiyat zorunludur.',
            'items.*.total_price.min' => 'Toplam fiyat 0\'dan büyük olmalıdır.',
        ];
    }
}
