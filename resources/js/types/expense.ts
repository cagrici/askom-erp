export interface Expense {
    id: number;
    expense_number: string;
    title: string;
    description?: string;
    amount: number;
    currency: string;
    exchange_rate: number;
    amount_in_base_currency: number;
    vat_rate: number;
    vat_amount: number;
    withholding_tax_rate: number;
    withholding_tax_amount: number;
    net_amount: number;
    expense_date: string;
    invoice_date?: string;
    due_date?: string;
    payment_date?: string;
    invoice_number?: string;
    reference_number?: string;
    receipt_number?: string;
    status: 'draft' | 'pending' | 'approved' | 'paid' | 'cancelled';
    approval_status: 'pending' | 'approved' | 'rejected';
    payment_status: 'unpaid' | 'partial' | 'paid';
    is_recurring: boolean;
    recurring_frequency?: 'monthly' | 'quarterly' | 'yearly';
    next_occurrence_date?: string;
    attachments?: string[];
    created_at: string;
    updated_at: string;
    
    // Relationships
    category?: ExpenseCategory;
    current_account?: CurrentAccount;
    bank_account?: BankAccount;
    payment_method?: PaymentMethod;
    employee?: Employee;
    location?: Location;
    items?: ExpenseItem[];
    created_by?: User;
    updated_by?: User;
    approved_by?: User;
    paid_by?: User;
    
    // Computed attributes
    status_text: string;
    approval_status_text: string;
    payment_status_text: string;
    status_badge_color: string;
    formatted_amount: string;
    formatted_net_amount: string;
    is_overdue: boolean;
    days_overdue: number;
    can_edit: boolean;
    can_delete: boolean;
    can_approve: boolean;
    can_pay: boolean;
}

export interface ExpenseCategory {
    id: number;
    name: string;
    code: string;
    description?: string;
    parent_id?: number;
    account_code?: string;
    cost_center_id?: number;
    is_active: boolean;
    requires_approval: boolean;
    approval_limit?: number;
    color: string;
    icon?: string;
    monthly_budget?: number;
    yearly_budget?: number;
    
    // Relationships
    parent?: ExpenseCategory;
    children?: ExpenseCategory[];
    expenses?: Expense[];
    
    // Computed attributes
    full_name?: string;
    budget_usage?: number;
}

export interface ExpenseItem {
    id: number;
    expense_id: number;
    description: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    vat_rate: number;
    vat_amount: number;
    account_code?: string;
    cost_center_id?: number;
    
    // Computed attributes
    formatted_total_amount?: string;
    formatted_unit_price?: string;
}

export interface CurrentAccount {
    id: number;
    title: string;
    account_code?: string;
    account_type: string;
}

export interface BankAccount {
    id: number;
    account_name: string;
    bank_name: string;
    currency: string;
    is_default: boolean;
}

export interface PaymentMethod {
    id: number;
    name: string;
    requires_bank_account: boolean;
}

export interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    name?: string;
}

export interface Location {
    id: number;
    name: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
}

export interface ExpenseFilters {
    search?: string;
    status?: string;
    approval_status?: string;
    payment_status?: string;
    category_id?: number;
    currency?: string;
    current_account_id?: number;
    employee_id?: number;
    location_id?: number;
    date_from?: string;
    date_to?: string;
    amount_min?: number;
    amount_max?: number;
    is_overdue?: boolean;
    is_recurring?: boolean;
    sort_field?: string;
    sort_direction?: string;
}

export interface ExpenseStats {
    total_expenses: number;
    current_month_expenses: number;
    current_month_amount: number;
    last_month_amount: number;
    draft_expenses: number;
    pending_expenses: number;
    approved_expenses: number;
    paid_expenses: number;
    overdue_expenses: number;
    unpaid_expenses: number;
    total_amount_try: number;
    total_amount_usd: number;
    total_amount_eur: number;
    pending_amount_try: number;
    overdue_amount: number;
    recurring_expenses: number;
    monthly_growth_rate: number;
}

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