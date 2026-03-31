import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Layout from '../../../Layouts';
import CurrentAccountForm from '../../../Components/CurrentAccountForm';
import { PageProps } from '@/types';

interface CreateProps extends PageProps {
    defaultType?: string;
}

export default function CurrentAccountCreate() {
    const { errors, defaultType } = usePage<CreateProps>().props;
    
    const [formData, setFormData] = useState({
        title: '',
        account_type: defaultType || 'customer',
        person_type: 'corporate',
        account_code: '',
        tax_number: '',
        tax_office: '',
        tax_office_id: '',
        mersys_no: '',
        trade_registry_no: '',
        employee_count: 0,
        annual_revenue: 0,
        establishment_year: 0,
        address: '',
        district: '',
        district_id: '',
        city: '',
        city_id: '',
        postal_code: '',
        country: 'Türkiye',
        country_id: '1',
        phone_1: '',
        phone_2: '',
        mobile: '',
        fax: '',
        email: '',
        website: '',
        contact_person: '',
        contact_title: '',
        contact_phone: '',
        contact_email: '',
        additional_contacts: [],
        credit_limit: 0,
        payment_term_id: '',
        payment_method_id: '',
        discount_rate: 0,
        currency: 'TRY',
        risk_limit: 0,
        e_invoice_enabled: false,
        e_invoice_address: '',
        e_archive_enabled: false,
        gib_alias: '',
        category: '',
        sector: '',
        region: '',
        sales_representative_id: '',
        lead_source: '',
        customer_segment: '',
        preferred_language: 'tr',
        communication_preferences: {},
        is_active: true,
        notes: '',
        crm_notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        router.post(route('accounting.current-accounts.store'), formData, {
            onSuccess: () => {
                router.visit(route('accounting.current-accounts.index'));
            }
        });
    };

    return (
        <Layout>
            <Head title="Yeni Cari Kart" />
            
            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">Yeni Cari Kart</h4>
                                <div className="page-title-right">
                                    <ol className="breadcrumb m-0">
                                        <li className="breadcrumb-item">
                                            <Link href="/accounting/current-accounts">Cari Kartlar</Link>
                                        </li>
                                        <li className="breadcrumb-item active">Yeni Kart</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Create Form */}
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="card-title mb-0">
                                        <i className="ri-add-line me-2"></i>
                                        Yeni Cari Kart Oluştur
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
                                                href={route('accounting.current-accounts.index')}
                                                className="btn btn-secondary"
                                            >
                                                <i className="ri-close-line me-1"></i>
                                                İptal
                                            </Link>
                                            <button type="submit" className="btn btn-primary">
                                                <i className="ri-save-line me-1"></i>
                                                Kaydet
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