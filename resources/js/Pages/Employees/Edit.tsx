import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Company, Department, Employee, OrganizationPosition } from '@/types';
import { useTranslation } from 'react-i18next';
import EmployeeForm from './Partials/EmployeeForm';
import Layout from '@/Layouts/index';

interface EmploymentType {
  value: string;
  label: string;
}

interface EmploymentStatus {
  value: string;
  label: string;
}

interface Gender {
  value: string;
  label: string;
}

interface MaritalStatus {
  value: string;
  label: string;
}

interface Props {
  employee: Employee;
  companies: Company[];
  departments: Department[];
  positions: OrganizationPosition[];
  employmentTypes: EmploymentType[];
  employmentStatuses: EmploymentStatus[];
  genders: Gender[];
  maritalStatuses: MaritalStatus[];
}

const EmployeeEdit: React.FC<Props> = ({
  employee,
  companies,
  departments,
  positions,
  employmentTypes,
  employmentStatuses,
  genders,
  maritalStatuses
}) => {
  const { t } = useTranslation();
  const { data, setData, put, processing, errors } = useForm({
    company_id: employee.company_id || '',
    department_id: employee.department_id || '',
    position_id: employee.position_id || '',
    employee_id: employee.employee_id || '',
    hire_date: employee.hire_date || '',

    employment_type: employee.employment_type || 'full_time',
      status: employee.status || 'active',
    termination_date: employee.termination_date || '',
    national_id_number: employee.national_id_number || '',
    birth_date: employee.birth_date || '',
    birth_place: employee.birth_place || '',
    gender: employee.gender || '',
    marital_status: employee.marital_status || '',
    emergency_contact_name: employee.emergency_contact_name || '',
    emergency_contact_phone: employee.emergency_contact_phone || '',
    emergency_contact_relationship: employee.emergency_contact_relationship || '',
    bank_name: employee.bank_name || '',
    bank_account: employee.bank_account || '',
    bank_iban: employee.bank_iban || '',
    notes: employee.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route('employees.update', employee.id));
  };

  return (
    <Layout>
      <Head title={t('Edit Employee')} />
<div className={"page-content"}>
      <div className="container-fluid py-4">
        <div className="d-sm-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0 text-gray-800">
            {t('Edit Employee')}: {employee.user?.name}
          </h1>
        </div>

        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">{t('Employee Information')}</h6>
          </div>
          <div className="card-body">
            <EmployeeForm
              data={data}
              setData={setData}
              errors={errors}
              processing={processing}
              handleSubmit={handleSubmit}
              companies={companies}
              departments={departments}
              positions={positions}
              employmentTypes={employmentTypes}
              employmentStatuses={employmentStatuses}
              genders={genders}
              maritalStatuses={maritalStatuses}
              isEditMode={true}
            />
          </div>
        </div>
      </div>
</div>
    </Layout>
  );
};

export default EmployeeEdit;
