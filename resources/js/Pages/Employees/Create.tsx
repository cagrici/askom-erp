import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Company, Department, User, OrganizationPosition } from '@/types';
import { useTranslation } from 'react-i18next';
import EmployeeForm from './Partials/EmployeeForm';
import Layout from '@/Layouts/index';

interface EmploymentType {
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
  companies: Company[];
  departments: Department[];
  positions: OrganizationPosition[];
  users: User[];
  employmentTypes: EmploymentType[];
  genders: Gender[];
  maritalStatuses: MaritalStatus[];
}

const EmployeeCreate: React.FC<Props> = ({
  companies,
  departments,
  positions,
  users,
  employmentTypes,
  genders,
  maritalStatuses
}) => {
  const { t } = useTranslation();
  const { data, setData, post, processing, errors } = useForm({
    user_id: '',
    company_id: '',
    department_id: '',
    position_id: '',
    employee_id: '',
    hire_date: '',

    employment_type: 'full_time',
    status: 'active',
    termination_date: '',
    national_id_number: '',
    birth_date: '',
    birth_place: '',
    gender: '',
    marital_status: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    bank_name: '',
    bank_account: '',
    bank_iban: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('employees.store'));
  };

  return (
    <Layout>
      <Head title={t('Create Employee')} />
<div className={"page-content"}>
      <div className="container-fluid py-4">
        <div className="d-sm-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0 text-gray-800">{t('Create Employee')}</h1>
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
              users={users}
              employmentTypes={employmentTypes}
              genders={genders}
              maritalStatuses={maritalStatuses}
              isEditMode={false}
            />
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default EmployeeCreate;
