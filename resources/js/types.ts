export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  roles?: Role[];
  permissions?: Permission[];
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
}

export interface Company {
  id: number;
  name: string;
  legal_name?: string;
  tax_id?: string;
  registration_number?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  logo?: string;
  is_active: boolean;
  type?: CompanyType;
  type_id?: number;
}

export interface CompanyType {
  id: number;
  name: string;
  description?: string;
}

export interface Department {
  id: number;
  name: string;
  code?: string;
  description?: string;
  manager_id?: number;
  manager?: User;
  parent_id?: number;
  parent?: Department;
  company_id: number;
  company?: Company;
}

export interface OrganizationPosition {
  id: number;
  name: string;
  code?: string;
  description?: string;
  department_id?: number;
  department?: Department;
  parent_id?: number;
  parent?: OrganizationPosition;
  level?: number;
}

export interface Employee {
  id: number;
  user_id: number;
  user?: User;
  company_id: number;
  company?: Company;
  department_id?: number;
  department?: Department;
  position_id?: number;
  position?: OrganizationPosition;
  employee_id: string;
  hire_date: string;
  termination_date?: date;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'intern' | 'consultant';
    status: 'active' | 'on_leave' | 'suspended' | 'terminated' | 'retired';

  national_id_number?: string;
  birth_date?: string;
  birth_place?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  bank_name?: string;
  bank_account?: string;
  bank_iban?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  documents?: EmployeeDocument[];
}

export interface EmployeeDocument {
  id: number;
  employee_id: number;
  document_type_id: number;
  documentType?: EmployeeDocumentType;
  file_id: number;
  file?: File;
  issue_date?: string;
  expiry_date?: string;
  document_number?: string;
  is_verified: boolean;
  verified_by?: number;
  verified_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface EmployeeDocumentType {
  id: number;
  name: string;
  name_tr: string;
  description?: string;
  description_tr?: string;
  is_required: boolean;
  is_confidential: boolean;
}

export interface File {
  id: number;
  name: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  thumbnail_path?: string;
  user_id: number;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSalary {
  id: number;
  employee_id: number;
  employee?: Employee;
  salary_type_id: number;
  salaryType?: SalaryType;
  amount: number;
  currency: string;
  effective_date: string;
  end_date?: string;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface SalaryType {
  id: number;
  name: string;
  name_tr: string;
  description?: string;
  description_tr?: string;
}

export interface LeaveType {
  id: number;
  name: string;
  name_tr: string;
  description?: string;
  description_tr?: string;
  requires_approval: boolean;
  is_paid: boolean;
  default_days_per_year?: number;
  color?: string;
}

export interface EmployeeLeaveBalance {
  id: number;
  employee_id: number;
  employee?: Employee;
  leave_type_id: number;
  leaveType?: LeaveType;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  expiry_date?: string;
  notes?: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  employee?: Employee;
  leave_type_id: number;
  leaveType?: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason?: string;
  rejection_reason?: string;
  approved_by?: number;
  approver?: User;
  approved_at?: string;
  created_by: number;
  creator?: User;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
