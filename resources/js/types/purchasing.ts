export interface PurchaseRequest {
    id: number;
    request_number: string;
    title: string;
    description?: string;
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'converted' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    request_type: 'regular' | 'urgent' | 'maintenance' | 'project';
    location_id?: number;
    department_id?: number;
    requested_by: number;
    approved_by?: number;
    requested_date: string;
    required_date: string;
    approved_at?: string;
    total_amount: number;
    currency: string;
    exchange_rate: number;
    total_amount_base_currency: number;
    approval_notes?: string;
    rejection_reason?: string;
    budget_code?: string;
    is_urgent: boolean;
    requires_approval: boolean;
    custom_fields?: Record<string, any>;
    created_at: string;
    updated_at: string;
    
    // Relationships
    location?: Location;
    department?: Department;
    requestedBy?: User;
    approvedBy?: User;
    items?: PurchaseRequestItem[];
    purchaseOrders?: PurchaseOrder[];
    
    // Computed attributes
    status_text: string;
    status_badge_color: string;
    priority_text: string;
    priority_badge_color: string;
    formatted_total_amount: string;
    can_be_approved: boolean;
    can_be_rejected: boolean;
    can_be_converted: boolean;
    can_be_edited: boolean;
    can_be_deleted: boolean;
}

export interface PurchaseRequestItem {
    id: number;
    purchase_request_id: number;
    product_id?: number;
    item_code?: string;
    item_name: string;
    description?: string;
    specifications?: string;
    requested_quantity: number;
    approved_quantity?: number;
    unit_id?: number;
    unit_name?: string;
    estimated_unit_price?: number;
    estimated_total_price?: number;
    currency: string;
    preferred_supplier_id?: number;
    preferred_brand?: string;
    preferred_model?: string;
    status: 'pending' | 'approved' | 'rejected' | 'converted' | 'partially_converted';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    required_date?: string;
    notes?: string;
    budget_code?: string;
    gl_account?: string;
    custom_fields?: Record<string, any>;
    converted_quantity: number;
    remaining_quantity: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
    
    // Relationships
    purchaseRequest?: PurchaseRequest;
    product?: Product;
    unit?: Unit;
    preferredSupplier?: CurrentAccount;
}

export interface PurchaseOrder {
    id: number;
    order_number: string;
    title: string;
    description?: string;
    status: 'draft' | 'pending' | 'approved' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'invoiced' | 'completed' | 'cancelled';
    order_type: 'regular' | 'urgent' | 'blanket' | 'framework';
    purchase_request_id?: number;
    supplier_id: number;
    location_id?: number;
    ordered_by: number;
    approved_by?: number;
    order_date: string;
    delivery_date: string;
    approved_at?: string;
    total_amount: number;
    currency: string;
    exchange_rate: number;
    terms_conditions?: string;
    delivery_terms?: string;
    notes?: string;
    reference_number?: string;
    is_urgent: boolean;
    created_at: string;
    updated_at: string;
    
    // Relationships
    purchaseRequest?: PurchaseRequest;
    supplier?: CurrentAccount;
    location?: Location;
    orderedBy?: User;
    approvedBy?: User;
    items?: PurchaseOrderItem[];
    
    // Computed attributes
    status_text: string;
    status_badge_color: string;
    formatted_total_amount: string;
    can_be_approved: boolean;
    can_be_sent: boolean;
    can_be_cancelled: boolean;
    can_be_edited: boolean;
    can_be_deleted: boolean;
}

export interface PurchaseOrderItem {
    id: number;
    purchase_order_id: number;
    purchase_request_item_id?: number;
    product_id?: number;
    item_code?: string;
    item_name: string;
    description?: string;
    specifications?: string;
    ordered_quantity: number;
    received_quantity: number;
    remaining_quantity: number;
    unit_id?: number;
    unit_name?: string;
    unit_price: number;
    total_price: number;
    discount_percentage: number;
    discount_amount: number;
    net_price: number;
    currency: string;
    status: 'pending' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
    delivery_date?: string;
    notes?: string;
    supplier_item_code?: string;
    brand?: string;
    model?: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
    
    // Relationships
    purchaseOrder?: PurchaseOrder;
    purchaseRequestItem?: PurchaseRequestItem;
    product?: Product;
    unit?: Unit;
}

export interface RFQ {
    id: number;
    rfq_number: string;
    title: string;
    description?: string;
    status: 'draft' | 'sent' | 'responded' | 'evaluated' | 'closed' | 'cancelled';
    rfq_type: 'standard' | 'urgent' | 'sealed_bid';
    location_id?: number;
    department_id?: number;
    created_by: number;
    issue_date: string;
    due_date: string;
    opening_date?: string;
    currency: string;
    terms_conditions?: string;
    delivery_terms?: string;
    notes?: string;
    is_urgent: boolean;
    created_at: string;
    updated_at: string;
    
    // Relationships
    location?: Location;
    department?: Department;
    createdBy?: User;
    items?: RFQItem[];
    quotations?: SupplierQuotation[];
    
    // Computed attributes
    status_text: string;
    status_badge_color: string;
    can_be_sent: boolean;
    can_be_cancelled: boolean;
    can_be_edited: boolean;
    days_remaining: number;
    is_overdue: boolean;
}

export interface RFQItem {
    id: number;
    rfq_id: number;
    product_id?: number;
    item_code?: string;
    item_name: string;
    description?: string;
    specifications?: string;
    quantity: number;
    unit_id?: number;
    unit_name?: string;
    delivery_date?: string;
    notes?: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
    
    // Relationships
    rfq?: RFQ;
    product?: Product;
    unit?: Unit;
    quotationItems?: QuotationItem[];
}

export interface SupplierQuotation {
    id: number;
    rfq_id: number;
    supplier_id: number;
    quotation_number: string;
    title?: string;
    status: 'draft' | 'submitted' | 'evaluated' | 'accepted' | 'rejected';
    submitted_date?: string;
    valid_until: string;
    total_amount: number;
    currency: string;
    exchange_rate: number;
    delivery_terms?: string;
    payment_terms?: string;
    notes?: string;
    evaluation_notes?: string;
    evaluation_score?: number;
    is_selected: boolean;
    created_at: string;
    updated_at: string;
    
    // Relationships
    rfq?: RFQ;
    supplier?: CurrentAccount;
    items?: QuotationItem[];
    
    // Computed attributes
    status_text: string;
    status_badge_color: string;
    formatted_total_amount: string;
    can_be_evaluated: boolean;
    can_be_selected: boolean;
    is_valid: boolean;
}

export interface QuotationItem {
    id: number;
    supplier_quotation_id: number;
    rfq_item_id: number;
    product_id?: number;
    item_code?: string;
    item_name: string;
    description?: string;
    specifications?: string;
    quantity: number;
    unit_id?: number;
    unit_name?: string;
    unit_price: number;
    total_price: number;
    delivery_date?: string;
    brand?: string;
    model?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    
    // Relationships
    supplierQuotation?: SupplierQuotation;
    rfqItem?: RFQItem;
    product?: Product;
    unit?: Unit;
}

export interface PurchaseReceipt {
    id: number;
    receipt_number: string;
    purchase_order_id: number;
    supplier_id: number;
    location_id?: number;
    received_by: number;
    receipt_date: string;
    delivery_note?: string;
    reference_number?: string;
    status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
    notes?: string;
    created_at: string;
    updated_at: string;
    
    // Relationships
    purchaseOrder?: PurchaseOrder;
    supplier?: CurrentAccount;
    location?: Location;
    receivedBy?: User;
    items?: ReceiptItem[];
    
    // Computed attributes
    status_text: string;
    status_badge_color: string;
    can_be_confirmed: boolean;
    can_be_cancelled: boolean;
}

export interface ReceiptItem {
    id: number;
    purchase_receipt_id: number;
    purchase_order_item_id: number;
    product_id?: number;
    item_code?: string;
    item_name: string;
    ordered_quantity: number;
    received_quantity: number;
    unit_id?: number;
    unit_name?: string;
    condition: 'good' | 'damaged' | 'partial' | 'rejected';
    notes?: string;
    created_at: string;
    updated_at: string;
    
    // Relationships
    purchaseReceipt?: PurchaseReceipt;
    purchaseOrderItem?: PurchaseOrderItem;
    product?: Product;
    unit?: Unit;
}

export interface SupplierEvaluation {
    id: number;
    supplier_id: number;
    evaluation_period_start: string;
    evaluation_period_end: string;
    evaluator_id: number;
    quality_score: number;
    delivery_score: number;
    service_score: number;
    price_score: number;
    overall_score: number;
    notes?: string;
    recommendations?: string;
    status: 'draft' | 'completed' | 'approved';
    created_at: string;
    updated_at: string;
    
    // Relationships
    supplier?: CurrentAccount;
    evaluator?: User;
    
    // Computed attributes
    grade: string;
    status_text: string;
}

// Filter and Search Types
export interface PurchaseRequestFilters {
    search?: string;
    status?: string;
    priority?: string;
    location_id?: number;
    department_id?: number;
    date_from?: string;
    date_to?: string;
    sort_field?: string;
    sort_direction?: string;
}

export interface PurchaseOrderFilters {
    search?: string;
    status?: string;
    supplier_id?: number;
    location_id?: number;
    order_date_from?: string;
    order_date_to?: string;
    delivery_date_from?: string;
    delivery_date_to?: string;
    sort_field?: string;
    sort_direction?: string;
}

// Common types from other modules
export interface Location {
    id: number;
    name: string;
    address?: string;
    status: number;
}

export interface Department {
    id: number;
    name: string;
    description?: string;
    status: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Product {
    id: number;
    code: string;
    name: string;
    sku?: string;
    description?: string;
    category_id?: number;
    unit_id?: number;
    status: number;
    sale_price?: number;
    cost_price?: number;
    baseUnit?: Unit;
    activeUnits?: Array<{
        id: number;
        unit_id: number;
        conversion_factor: number;
        is_base_unit: boolean;
        unit?: Unit;
    }>;
    tax?: Tax;
    primary_image?: {
        id: number;
        image_path: string;
        thumbnail_path: string;
        image_url: string;
        thumbnail_url: string;
        is_primary: boolean;
        sort_order: number;
    };
}

export interface Unit {
    id: number;
    name: string;
    symbol: string;
    status: number;
}

export interface Tax {
    id: number;
    name: string;
    type: 'percentage' | 'fixed';
    rate: number;
    fixed_amount?: number;
    code: string;
    is_active: boolean;
}

export interface CurrentAccount {
    id: number;
    title: string;
    account_code?: string;
    account_type: 'customer' | 'supplier' | 'both' | 'personnel' | 'shareholder' | 'other';
    person_type?: 'individual' | 'corporate';
    tax_number?: string;
    tax_office?: string;
    contact_person?: string;
    phone_1?: string;
    phone_2?: string;
    mobile?: string;
    email?: string;
    address?: string;
    district?: string;
    city?: string;
    country?: string;
    credit_limit?: number;
    payment_term_days?: number;
    currency?: string;
    is_active: boolean;
}

// Alias for backward compatibility - Supplier is now CurrentAccount with account_type = 'supplier'
export type Supplier = CurrentAccount;

// Pagination helper
export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url?: string;
        label: string;
        active: boolean;
    }>;
    next_page_url?: string;
    path: string;
    per_page: number;
    prev_page_url?: string;
    to: number;
    total: number;
}