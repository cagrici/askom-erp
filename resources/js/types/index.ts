export interface Visitor {
    id: number;
    name: string;
    surname: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    id_number: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    appointments?: VisitorAppointment[];
    visits?: VisitorVisit[];
}

export interface VisitorAppointment {
    id: number;
    visitor_id: number;
    host_id: number;
    appointment_date: string;
    appointment_time: string;
    purpose: string;
    status: 'scheduled' | 'confirmed' | 'canceled' | 'completed';
    notes: string | null;
    created_at: string;
    updated_at: string;
    visitor?: Visitor;
    employee?: User;
}

export interface VisitorVisit {
    id: number;
    visitor_id: number;
    appointment_id: number | null;
    check_in_time: string;
    check_out_time: string | null;
    host_employee_id: number;
    status: 'active' | 'completed' | 'canceled';
    notes: string | null;
    created_at: string;
    updated_at: string;
    visitor?: Visitor;
    appointment?: VisitorAppointment;
    hostEmployee?: User;
}

export interface User {
    id: number;
    name: string;
    email: string;
    // Diğer kullanıcı alanları
}

export interface PaginatedData<T> {
    data: T[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        path: string;
        per_page: number;
        to: number;
        total: number;
    };
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    parent_id: number | null;
    type: string | null;
    is_active: boolean;
    display_order: number | null;
    created_by: number;
    updated_by: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    meta_data: any;
    parent?: Category;
    children?: Category[];
    creator?: User;
    updater?: User;
}

export interface Location {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    phone: string | null;
    email: string | null;
    description: string | null;
    type: string | null;
    is_active: boolean;
    latitude: number | null;
    longitude: number | null;
    meta_data: any;
    created_by: number;
    parent_id: number | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    full_address?: string;
    parent?: Location;
    children?: Location[];
    creator?: User;
}
