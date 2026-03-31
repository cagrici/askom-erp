<?php

namespace App\Http\Requests\Announcement;

use Illuminate\Foundation\Http\FormRequest;

class StoreAnnouncementRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Yetki kontrolü policy üzerinden yapılacak
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
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'location_id' => 'nullable|exists:locations,id',
            'recipient_roles' => 'nullable|array',
            'recipient_roles.*' => 'exists:roles,id',
            'recipient_departments' => 'nullable|array',
            'recipient_departments.*' => 'exists:departments,id',
            'is_featured' => 'boolean',
            'is_pinned' => 'boolean',
            'show_on_login' => 'boolean',
            'status' => 'required|in:draft,published',
            'publish_at' => 'nullable|date',
            'expire_at' => 'nullable|date|after_or_equal:publish_at',
            'cover_image' => 'nullable|image|max:2048', // 2MB max
            'files' => 'nullable|array',
            'files.*' => 'file|max:10240', // 10MB max
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'title' => 'başlık',
            'content' => 'içerik',
            'category_id' => 'kategori',
            'department_id' => 'departman',
            'location_id' => 'lokasyon',
            'recipient_roles' => 'alıcı roller',
            'recipient_departments' => 'alıcı departmanlar',
            'is_featured' => 'öne çıkan',
            'is_pinned' => 'sabitlenmiş',
            'show_on_login' => 'girişte göster',
            'status' => 'durum',
            'publish_at' => 'yayın tarihi',
            'expire_at' => 'bitiş tarihi',
            'cover_image' => 'kapak resmi',
            'files' => 'dosyalar',
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'required' => ':attribute alanı zorunludur.',
            'string' => ':attribute metin olmalıdır.',
            'max' => ':attribute en fazla :max karakter olabilir.',
            'exists' => 'Seçilen :attribute geçersiz.',
            'array' => ':attribute dizi olmalıdır.',
            'boolean' => ':attribute doğru veya yanlış olmalıdır.',
            'in' => ':attribute geçersiz.',
            'date' => ':attribute geçerli bir tarih olmalıdır.',
            'after_or_equal' => ':attribute, :date tarihinden sonra veya aynı olmalıdır.',
            'image' => ':attribute bir resim dosyası olmalıdır.',
            'file' => ':attribute bir dosya olmalıdır.',
            'files.*.max' => 'Dosya boyutu en fazla 10MB olabilir.',
            'cover_image.max' => 'Kapak resmi boyutu en fazla 2MB olabilir.',
        ];
    }
}
