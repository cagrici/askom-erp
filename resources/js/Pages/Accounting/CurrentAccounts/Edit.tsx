import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Layout from '../../../Layouts';
import CurrentAccountForm from '../../../Components/CurrentAccountForm';

interface CurrentAccount {
    id: number;
    account_code: string;
    title: string;
    account_type: string;
    person_type: string;
    tax_number?: string;
    tax_office?: string;
    tax_office_id?: string;
    mersys_no?: string;
    trade_registry_no?: string;
    employee_count?: number;
    annual_revenue?: number;
    establishment_year?: number;
    address?: string;
    district?: string;
    district_id?: string;
    city?: string;
    city_id?: string;
    postal_code?: string;
    country?: string;
    country_id?: string;
    phone_1?: string;
    phone_2?: string;
    mobile?: string;
    fax?: string;
    email?: string;
    website?: string;
    contact_person?: string;
    contact_title?: string;
    contact_phone?: string;
    contact_email?: string;
    additional_contacts?: any[];
    credit_limit: number;
    payment_term_id?: string;
    payment_method_id?: string;
    payment_term_days: number;
    discount_rate: number;
    currency: string;
    risk_limit: number;
    e_invoice_enabled: boolean;
    e_invoice_address?: string;
    e_archive_enabled: boolean;
    gib_alias?: string;
    category?: string;
    sector?: string;
    region?: string;
    sales_representative_id?: string;
    lead_source?: string;
    customer_segment?: string;
    preferred_language?: string;
    communication_preferences?: any;
    crm_notes?: string;
    current_balance: number;
    total_receivables: number;
    total_payables: number;
    overdue_amount: number;
    overdue_days: number;
    is_active: boolean;
    is_blocked: boolean;
    block_reason?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    creator?: {
        id: number;
        name: string;
    };
    updater?: {
        id: number;
        name: string;
    };
    account_type_text: string;
    person_type_text: string;
    status_text: string;
    status_color: string;
    balance_color: string;
    formatted_balance: string;
    risk_status: string;
    risk_status_color: string;
    available_credit: number;
}

interface Props {
    account: CurrentAccount;
}

export default function CurrentAccountEdit({ account }: Props) {
    const { errors } = usePage<any>().props;
    
    const [formData, setFormData] = useState({
        title: account.title,
        account_type: account.account_type,
        person_type: account.person_type,
        account_code: account.account_code,
        tax_number: account.tax_number || '',
        tax_office: account.tax_office || '',
        tax_office_id: account.tax_office_id ? account.tax_office_id.toString() : '',
        mersys_no: account.mersys_no || '',
        trade_registry_no: account.trade_registry_no || '',
        employee_count: account.employee_count || 0,
        annual_revenue: account.annual_revenue || 0,
        establishment_year: account.establishment_year || 0,
        address: account.address || '',
        district: account.district || '',
        district_id: account.district_id ? account.district_id.toString() : '',
        city: account.city || '',
        city_id: account.city_id ? account.city_id.toString() : '',
        postal_code: account.postal_code || '',
        country: account.country || 'Türkiye',
        country_id: account.country_id ? account.country_id.toString() : '1',
        phone_1: account.phone_1 || '',
        phone_2: account.phone_2 || '',
        mobile: account.mobile || '',
        fax: account.fax || '',
        email: account.email || '',
        website: account.website || '',
        contact_person: account.contact_person || '',
        contact_title: account.contact_title || '',
        contact_phone: account.contact_phone || '',
        contact_email: account.contact_email || '',
        additional_contacts: account.additional_contacts || [],
        credit_limit: account.credit_limit,
        payment_term_id: account.payment_term_id || '',
        payment_method_id: account.payment_method_id || '',
        discount_rate: account.discount_rate || 0,
        currency: account.currency,
        risk_limit: account.risk_limit || 0,
        e_invoice_enabled: account.e_invoice_enabled || false,
        e_invoice_address: account.e_invoice_address || '',
        e_archive_enabled: account.e_archive_enabled || false,
        gib_alias: account.gib_alias || '',
        category: account.category || '',
        sector: account.sector || '',
        region: account.region || '',
        sales_representative_id: account.sales_representative_id || '',
        lead_source: account.lead_source || '',
        customer_segment: account.customer_segment || '',
        preferred_language: account.preferred_language || 'tr',
        communication_preferences: account.communication_preferences || {},
        is_active: account.is_active,
        notes: account.notes || '',
        crm_notes: account.crm_notes || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        router.patch(route('accounting.current-accounts.update', account.id), formData, {
            onSuccess: () => {
                router.visit(route('accounting.current-accounts.show', account.id));
            }
        });
    };

    return (
        <Layout>
            <Head title={`Cari Kart Düzenle - ${account.title}`} />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Cari Kart Düzenle</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href="/accounting/current-accounts">Cari Kartlar</Link>
                                        </li>
                                        <li className="breadcrumb-item">
                                            <Link href={route('accounting.current-accounts.show', account.id)}>
                                                {account.title}
                                            </Link>
                                        </li>
                                        <li className="breadcrumb-item active">Düzenle</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-edit-line me-2"></i>
                                        {account.title} - Düzenle
                                    </h5>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="card-body">
                                        <CurrentAccountForm 
                                            formData={formData}
                                            setFormData={setFormData}
                                            errors={errors}
                                        />
                                    </div>
                                    <div className="card-footer">
                                        <div className="d-flex justify-content-end gap-2">
                                            <Link 
                                                href={route('accounting.current-accounts.show', account.id)}
                                                className="btn btn-secondary"
                                            >
                                                <i className="ri-close-line me-1"></i>
                                                İptal
                                            </Link>
                                            <button type="submit" className="btn btn-primary">
                                                <i className="ri-save-line me-1"></i>
                                                Güncelle
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}