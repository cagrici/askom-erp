<?php

namespace App\Http\Requests\Purchasing;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseOrderRequest extends FormRequest
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
        return [
            'order_number' => 'nullable|string|max:255|unique:purchase_orders',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'purchase_request_id' => 'nullable|exists:purchase_requests,id',
            'supplier_id' => 'required|exists:current_accounts,id',
            'department_id' => 'required|exists:departments,id',
            'location_id' => 'required|exists:locations,id',
            'ordered_by' => 'required|exists:users,id',
            'delivery_date' => 'required|date|after_or_equal:today',
            'delivery_address' => 'required|string',
            'delivery_contact' => 'nullable|string|max:255',
            'delivery_phone' => 'nullable|string|max:50',
            'priority' => 'required|in:low,medium,high,urgent',
            'payment_terms' => 'nullable|string|max:255',
            'currency' => 'required|in:TRY,USD,EUR,GBP',
            'exchange_rate' => 'nullable|numeric|min:0',
            'subtotal' => 'required|numeric|min:0',
            'tax_amount' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            
            // Items validation
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.description' => 'required|string|max:500',
            'items.*.specification' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit' => 'required|string|max:50',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_amount' => 'nullable|numeric|min:0',
            'items.*.discount_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.total_price' => 'required|numeric|min:0',
            'items.*.delivery_date' => 'nullable|date',
            'items.*.notes' => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Sipariş başlığı zorunludur.',
            'supplier_id.required' => 'Tedarikçi seçimi zorunludur.',
            'supplier_id.exists' => 'Seçilen tedarikçi bulunamadı.',
            'department_id.required' => 'Departman seçimi zorunludur.',
            'location_id.required' => 'Lokasyon seçimi zorunludur.',
            'ordered_by.required' => 'Sipariş veren kişi seçimi zorunludur.',
            'delivery_date.required' => 'Teslimat tarihi zorunludur.',
            'delivery_date.after_or_equal' => 'Teslimat tarihi bugün veya daha sonra olmalıdır.',
            'delivery_address.required' => 'Teslimat adresi zorunludur.',
            'priority.required' => 'Öncelik seçimi zorunludur.',
            'currency.required' => 'Para birimi seçimi zorunludur.',
            'subtotal.required' => 'Ara toplam zorunludur.',
            'subtotal.min' => 'Ara toplam 0\'dan büyük olmalıdır.',
            'tax_amount.required' => 'Vergi tutarı zorunludur.',
            'tax_amount.min' => 'Vergi tutarı 0 veya daha büyük olmalıdır.',
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
            'items.*.tax_rate.max' => 'Vergi oranı %100\'den büyük olamaz.',
            'items.*.discount_rate.max' => 'İndirim oranı %100\'den büyük olamaz.',
        ];
    }
}
