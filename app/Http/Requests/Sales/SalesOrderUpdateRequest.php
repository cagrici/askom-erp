<?php

namespace App\Http\Requests\Sales;

use Illuminate\Foundation\Http\FormRequest;

class SalesOrderUpdateRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_id' => 'required|exists:current_accounts,id',
            'salesperson_id' => 'nullable|exists:employees,id',
            'order_date' => 'required|date',
            'delivery_date' => 'nullable|date|after_or_equal:order_date',
            'requested_delivery_date' => 'nullable|date|after_or_equal:order_date',
            'priority' => 'required|in:low,normal,high,urgent',
            'payment_term_days' => 'required|integer|min:0|max:365',
            'payment_method' => 'required|string|max:50',
            'currency' => 'required|string|size:3',
            'exchange_rate' => 'required|numeric|min:0.0001',
            'shipping_cost' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'billing_address' => 'nullable|array',
            'shipping_address' => 'nullable|array',
            'notes' => 'nullable|string|max:2000',
            'internal_notes' => 'nullable|string|max:2000',
            'terms_and_conditions' => 'nullable|string|max:5000',
            'reference_number' => 'nullable|string|max:100',
            'external_order_number' => 'nullable|string|max:100',
            'items' => 'required|array|min:1',
            'items.*.id' => 'nullable|exists:sales_order_items,id',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.tax_rate' => 'required|numeric|min:0|max:100',
            'items.*.requested_delivery_date' => 'nullable|date|after_or_equal:order_date',
            'items.*.notes' => 'nullable|string|max:500',
            'items.*.special_instructions' => 'nullable|string|max:500',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'customer_id.required' => 'Müşteri seçimi zorunludur.',
            'customer_id.exists' => 'Seçilen müşteri geçerli değil.',
            'order_date.required' => 'Sipariş tarihi zorunludur.',
            'delivery_date.after_or_equal' => 'Teslimat tarihi sipariş tarihinden önce olamaz.',
            'priority.required' => 'Öncelik seçimi zorunludur.',
            'priority.in' => 'Geçersiz öncelik değeri.',
            'payment_term_days.required' => 'Ödeme vade süresi zorunludur.',
            'payment_term_days.max' => 'Ödeme vade süresi 365 günü geçemez.',
            'payment_method.required' => 'Ödeme yöntemi seçimi zorunludur.',
            'currency.required' => 'Para birimi seçimi zorunludur.',
            'exchange_rate.required' => 'Döviz kuru zorunludur.',
            'exchange_rate.min' => 'Döviz kuru 0\'dan büyük olmalıdır.',
            'items.required' => 'En az bir sipariş kalemi eklenmelidir.',
            'items.min' => 'En az bir sipariş kalemi eklenmelidir.',
            'items.*.product_id.required' => 'Ürün seçimi zorunludur.',
            'items.*.product_id.exists' => 'Seçilen ürün geçerli değil.',
            'items.*.quantity.required' => 'Miktar zorunludur.',
            'items.*.quantity.min' => 'Miktar 0\'dan büyük olmalıdır.',
            'items.*.unit_price.required' => 'Birim fiyat zorunludur.',
            'items.*.unit_price.min' => 'Birim fiyat 0 veya daha büyük olmalıdır.',
            'items.*.tax_rate.required' => 'KDV oranı zorunludur.',
        ];
    }
}
