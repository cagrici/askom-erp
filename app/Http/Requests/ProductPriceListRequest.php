<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductPriceListRequest extends FormRequest
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
        $priceListId = $this->route('priceList')?->id;

        return [
            'name' => 'required|string|max:255',
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('product_price_lists', 'code')->ignore($priceListId)
            ],
            'description' => 'nullable|string|max:1000',
            'type' => 'required|in:sale,purchase,special',
            'currency' => 'required|string|size:3|in:TRY,USD,EUR',
            'valid_from' => 'nullable|date|after_or_equal:today',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'customer_groups' => 'nullable|array',
            'customer_groups.*' => 'integer|exists:customer_groups,id'
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => 'fiyat listesi adı',
            'code' => 'fiyat listesi kodu',
            'description' => 'açıklama',
            'type' => 'fiyat listesi tipi',
            'currency' => 'para birimi',
            'valid_from' => 'geçerlilik başlangıcı',
            'valid_until' => 'geçerlilik bitişi',
            'is_active' => 'aktif durumu',
            'is_default' => 'varsayılan durumu',
            'customer_groups' => 'müşteri grupları'
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Fiyat listesi adı zorunludur.',
            'name.max' => 'Fiyat listesi adı en fazla 255 karakter olabilir.',
            'code.unique' => 'Bu fiyat listesi kodu zaten kullanılıyor.',
            'code.max' => 'Fiyat listesi kodu en fazla 50 karakter olabilir.',
            'type.required' => 'Fiyat listesi tipi seçmelisiniz.',
            'type.in' => 'Geçersiz fiyat listesi tipi.',
            'currency.required' => 'Para birimi seçmelisiniz.',
            'currency.size' => 'Para birimi 3 karakter olmalıdır.',
            'currency.in' => 'Desteklenen para birimleri: TRY, USD, EUR',
            'valid_from.date' => 'Geçerli bir başlangıç tarihi giriniz.',
            'valid_from.after_or_equal' => 'Başlangıç tarihi bugünden önce olamaz.',
            'valid_until.date' => 'Geçerli bir bitiş tarihi giriniz.',
            'valid_until.after_or_equal' => 'Bitiş tarihi başlangıç tarihinden önce olamaz.',
            'customer_groups.*.exists' => 'Seçilen müşteri grubu geçersiz.'
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Auto-generate code if not provided
        if (empty($this->code)) {
            $this->merge([
                'code' => 'PL-' . strtoupper(uniqid())
            ]);
        }

        // Convert checkboxes to boolean
        $this->merge([
            'is_active' => $this->boolean('is_active', true),
            'is_default' => $this->boolean('is_default', false)
        ]);
    }
}