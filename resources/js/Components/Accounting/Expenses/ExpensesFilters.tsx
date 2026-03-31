import React, { useState } from 'react';
import { ExpenseFilters } from '@/types/expense';

interface Props {
    filters: ExpenseFilters;
    filterOptions: {
        categories: any[];
        locations: any[];
        employees: any[];
    };
    onFilterChange: (filters: Partial<ExpenseFilters>) => void;
}

export default function ExpensesFilters({ filters, filterOptions, onFilterChange }: Props) {
    const [localFilters, setLocalFilters] = useState<ExpenseFilters>(filters);

    const handleInputChange = (field: string, value: any) => {
        const newFilters = { ...localFilters, [field]: value };
        setLocalFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleClearFilters = () => {
        const clearedFilters: ExpenseFilters = {
            sort_field: filters.sort_field || 'created_at',
            sort_direction: filters.sort_direction || 'desc'
        };
        setLocalFilters(clearedFilters);
        onFilterChange(clearedFilters);
    };

    return (
        <div className="row g-3">
            {/* Search */}
            <div className="col-xl-3 col-lg-4 col-md-6">
                <label className="form-label small text-muted">Arama</label>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Gider No, Başlık, Açıklama..."
                    value={localFilters.search || ''}
                    onChange={(e) => handleInputChange('search', e.target.value)}
                />
            </div>

            {/* Status */}
            <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label small text-muted">Durum</label>
                <select
                    className="form-select form-select-sm"
                    value={localFilters.status || ''}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                >
                    <option value="">Tümü</option>
                    <option value="draft">Taslak</option>
                    <option value="pending">Beklemede</option>
                    <option value="approved">Onaylandı</option>
                    <option value="paid">Ödendi</option>
                    <option value="cancelled">İptal Edildi</option>
                </select>
            </div>

            {/* Approval Status */}
            <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label small text-muted">Onay Durumu</label>
                <select
                    className="form-select form-select-sm"
                    value={localFilters.approval_status || ''}
                    onChange={(e) => handleInputChange('approval_status', e.target.value)}
                >
                    <option value="">Tümü</option>
                    <option value="pending">Onay Bekliyor</option>
                    <option value="approved">Onaylandı</option>
                    <option value="rejected">Reddedildi</option>
                </select>
            </div>

            {/* Payment Status */}
            <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label small text-muted">Ödeme Durumu</label>
                <select
                    className="form-select form-select-sm"
                    value={localFilters.payment_status || ''}
                    onChange={(e) => handleInputChange('payment_status', e.target.value)}
                >
                    <option value="">Tümü</option>
                    <option value="unpaid">Ödenmedi</option>
                    <option value="partial">Kısmi Ödendi</option>
                    <option value="paid">Ödendi</option>
                </select>
            </div>

            {/* Category */}
            <div className="col-xl-3 col-lg-4 col-md-6">
                <label className="form-label small text-muted">Kategori</label>
                <select
                    className="form-select form-select-sm"
                    value={localFilters.category_id || ''}
                    onChange={(e) => handleInputChange('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
                >
                    <option value="">Tümü</option>
                    {filterOptions.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Currency */}
            <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label small text-muted">Para Birimi</label>
                <select
                    className="form-select form-select-sm"
                    value={localFilters.currency || ''}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                >
                    <option value="">Tümü</option>
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                </select>
            </div>

            {/* Date From */}
            <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label small text-muted">Başlangıç Tarihi</label>
                <input
                    type="date"
                    className="form-control form-control-sm"
                    value={localFilters.date_from || ''}
                    onChange={(e) => handleInputChange('date_from', e.target.value)}
                />
            </div>

            {/* Date To */}
            <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label small text-muted">Bitiş Tarihi</label>
                <input
                    type="date"
                    className="form-control form-control-sm"
                    value={localFilters.date_to || ''}
                    onChange={(e) => handleInputChange('date_to', e.target.value)}
                />
            </div>

            {/* Amount Min */}
            <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label small text-muted">Min Tutar</label>
                <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="0.00"
                    step="0.01"
                    value={localFilters.amount_min || ''}
                    onChange={(e) => handleInputChange('amount_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
            </div>

            {/* Amount Max */}
            <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label small text-muted">Max Tutar</label>
                <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="0.00"
                    step="0.01"
                    value={localFilters.amount_max || ''}
                    onChange={(e) => handleInputChange('amount_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
            </div>

            {/* Employee */}
            <div className="col-xl-3 col-lg-4 col-md-6">
                <label className="form-label small text-muted">Sorumlu Çalışan</label>
                <select
                    className="form-select form-select-sm"
                    value={localFilters.employee_id || ''}
                    onChange={(e) => handleInputChange('employee_id', e.target.value ? parseInt(e.target.value) : undefined)}
                >
                    <option value="">Tümü</option>
                    {filterOptions.employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                            {employee.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Location */}
            <div className="col-xl-3 col-lg-4 col-md-6">
                <label className="form-label small text-muted">Lokasyon</label>
                <select
                    className="form-select form-select-sm"
                    value={localFilters.location_id || ''}
                    onChange={(e) => handleInputChange('location_id', e.target.value ? parseInt(e.target.value) : undefined)}
                >
                    <option value="">Tümü</option>
                    {filterOptions.locations.map((location) => (
                        <option key={location.id} value={location.id}>
                            {location.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Special Filters */}
            <div className="col-xl-2 col-lg-3 col-md-6">
                <label className="form-label small text-muted">Özel Filtreler</label>
                <div className="d-flex flex-column gap-1">
                    <div className="form-check form-check-sm">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="filter-overdue"
                            checked={localFilters.is_overdue || false}
                            onChange={(e) => handleInputChange('is_overdue', e.target.checked)}
                        />
                        <label className="form-check-label small" htmlFor="filter-overdue">
                            Vadesi Geçenler
                        </label>
                    </div>
                    <div className="form-check form-check-sm">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="filter-recurring"
                            checked={localFilters.is_recurring || false}
                            onChange={(e) => handleInputChange('is_recurring', e.target.checked)}
                        />
                        <label className="form-check-label small" htmlFor="filter-recurring">
                            Tekrarlayan Giderler
                        </label>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="col-xl-2 col-lg-3 col-md-6 d-flex align-items-end">
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm w-100"
                    onClick={handleClearFilters}
                >
                    <i className="fas fa-times me-1"></i>
                    Temizle
                </button>
            </div>
        </div>
    );
}