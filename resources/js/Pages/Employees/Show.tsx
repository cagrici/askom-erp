import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faArrowLeft, faIdCard, faUser, faBuilding, faBriefcase, faCalendarAlt, faInfo, faAddressCard, faPhone, faEnvelope, faIdBadge, faBirthdayCake, faMapMarkerAlt, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { Employee } from '@/types';
import Layout from '@/Layouts/index';
import { useTranslation } from 'react-i18next';

interface Props {
  employee: Employee;
  employmentTypes: Record<string, string>;
  employmentStatuses: Record<string, string>;
  genders: Record<string, string>;
  maritalStatuses: Record<string, string>;
}

const EmployeeShow: React.FC<Props> = ({
  employee,
  employmentTypes,
  employmentStatuses,
  genders,
  maritalStatuses
}) => {
  const { t } = useTranslation();

  return (
    <Layout>
      <Head title={`${t('View Employee')}: ${employee.user?.name}`} />
<div className={"page-content"}>
      <div className="container-fluid py-4">
        <div className="d-sm-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0 text-gray-800">{t('Employee Details')}</h1>
          <div>
            <Link
              href={route('employees.index')}
              className="btn btn-sm btn-secondary me-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              {t('Back to List')}
            </Link>
            <Link
              href={route('employees.edit', employee.id)}
              className="btn btn-sm btn-primary"
            >
              <FontAwesomeIcon icon={faEdit} className="me-2" />
              {t('Edit')}
            </Link>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-4 mb-4">
            {/* Personal Information */}
            <div className="card shadow mb-4">
              <div className="card-header py-3">
                <h6 className="m-0 font-weight-bold text-primary">
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  {t('Personal Information')}
                </h6>
              </div>
              <div className="card-body">
                <div className="text-center mb-4">
                  <div className="avatar-placeholder mb-3">
                    {employee.user?.name.charAt(0).toUpperCase()}
                  </div>
                  <h5 className="font-weight-bold text-primary">{employee.user?.name}</h5>
                  <p className="mb-0">{employee.position?.name || '-'}</p>
                  <p className="text-muted small">{employee.department?.name || '-'}</p>
                </div>

                <div className="mb-3">
                  <div className="fw-bold mb-1">
                    <FontAwesomeIcon icon={faIdBadge} className="me-2 text-primary" />
                    {t('Employee ID')}
                  </div>
                  <p className="text-muted">{employee.employee_id}</p>
                </div>

                <div className="mb-3">
                  <div className="fw-bold mb-1">
                    <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />
                    {t('Email')}
                  </div>
                  <p className="text-muted">{employee.user?.email}</p>
                </div>

                {employee.national_id_number && (
                  <div className="mb-3">
                    <div className="fw-bold mb-1">
                      <FontAwesomeIcon icon={faIdCard} className="me-2 text-primary" />
                      {t('National ID')}
                    </div>
                    <p className="text-muted">{employee.national_id_number}</p>
                  </div>
                )}

                {employee.birth_date && (
                  <div className="mb-3">
                    <div className="fw-bold mb-1">
                      <FontAwesomeIcon icon={faBirthdayCake} className="me-2 text-primary" />
                      {t('Date of Birth')}
                    </div>
                    <p className="text-muted">{new Date(employee.birth_date).toLocaleDateString()}</p>
                  </div>
                )}

                {employee.birth_place && (
                  <div className="mb-3">
                    <div className="fw-bold mb-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-primary" />
                      {t('Place of Birth')}
                    </div>
                    <p className="text-muted">{employee.birth_place}</p>
                  </div>
                )}

                {employee.gender && (
                  <div className="mb-3">
                    <div className="fw-bold mb-1">
                      <FontAwesomeIcon icon={faInfo} className="me-2 text-primary" />
                      {t('Gender')}
                    </div>
                    <p className="text-muted">{genders[employee.gender]}</p>
                  </div>
                )}

                {employee.marital_status && (
                  <div className="mb-3">
                    <div className="fw-bold mb-1">
                      <FontAwesomeIcon icon={faInfo} className="me-2 text-primary" />
                      {t('Marital Status')}
                    </div>
                    <p className="text-muted">{maritalStatuses[employee.marital_status]}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="row">
              {/* Employment Information */}
              <div className="col-12 mb-4">
                <div className="card shadow">
                  <div className="card-header py-3">
                    <h6 className="m-0 font-weight-bold text-primary">
                      <FontAwesomeIcon icon={faBuilding} className="me-2" />
                      {t('Employment Information')}
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="fw-bold mb-1">
                          <FontAwesomeIcon icon={faBuilding} className="me-2 text-primary" />
                          {t('Company')}
                        </div>
                        <p className="text-muted">{employee.company?.name}</p>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="fw-bold mb-1">
                          <FontAwesomeIcon icon={faBriefcase} className="me-2 text-primary" />
                          {t('Department')}
                        </div>
                        <p className="text-muted">{employee.department?.name || '-'}</p>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="fw-bold mb-1">
                          <FontAwesomeIcon icon={faBriefcase} className="me-2 text-primary" />
                          {t('Position')}
                        </div>
                        <p className="text-muted">{employee.position?.name || '-'}</p>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="fw-bold mb-1">
                          <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                          {t('Hire Date')}
                        </div>
                        <p className="text-muted">{new Date(employee.hire_date).toLocaleDateString()}</p>
                      </div>

                      {employee.termination_date && (
                        <div className="col-md-6 mb-3">
                          <div className="fw-bold mb-1">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                            {t('Contract End Date')}
                          </div>
                          <p className="text-muted">{new Date(employee.termination_date).toLocaleDateString()}</p>
                        </div>
                      )}

                      <div className="col-md-6 mb-3">
                        <div className="fw-bold mb-1">
                          <FontAwesomeIcon icon={faInfo} className="me-2 text-primary" />
                          {t('Employment Type')}
                        </div>
                        <p className="text-muted">{employmentTypes[employee.employment_type]}</p>
                      </div>

                      <div className="col-md-6 mb-3">
                        <div className="fw-bold mb-1">
                          <FontAwesomeIcon icon={faInfo} className="me-2 text-primary" />
                          {t('Status')}
                        </div>
                        <p>
                          <span
                            className={`badge ${
                              employee.status === 'active' ? 'bg-success' :
                              employee.status === 'on_leave' ? 'bg-warning' :
                              employee.status === 'suspended' ? 'bg-danger' :
                              employee.status === 'terminated' ? 'bg-dark' :
                              'bg-secondary'
                            }`}
                          >
                            {employmentStatuses[employee.status]}
                          </span>
                        </p>
                      </div>

                      {employee.termination_date && (
                        <div className="col-md-6 mb-3">
                          <div className="fw-bold mb-1">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                            {t('Termination Date')}
                          </div>
                          <p className="text-muted">{new Date(employee.termination_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {(employee.emergency_contact_name || employee.emergency_contact_phone) && (
                <div className="col-md-6 mb-4">
                  <div className="card shadow h-100">
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">
                        <FontAwesomeIcon icon={faPhone} className="me-2" />
                        {t('Emergency Contact')}
                      </h6>
                    </div>
                    <div className="card-body">
                      {employee.emergency_contact_name && (
                        <div className="mb-3">
                          <div className="fw-bold mb-1">
                            <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                            {t('Name')}
                          </div>
                          <p className="text-muted">{employee.emergency_contact_name}</p>
                        </div>
                      )}

                      {employee.emergency_contact_phone && (
                        <div className="mb-3">
                          <div className="fw-bold mb-1">
                            <FontAwesomeIcon icon={faPhone} className="me-2 text-primary" />
                            {t('Phone')}
                          </div>
                          <p className="text-muted">{employee.emergency_contact_phone}</p>
                        </div>
                      )}

                      {employee.emergency_contact_relationship && (
                        <div className="mb-3">
                          <div className="fw-bold mb-1">
                            <FontAwesomeIcon icon={faInfo} className="me-2 text-primary" />
                            {t('Relationship')}
                          </div>
                          <p className="text-muted">{employee.emergency_contact_relationship}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Banking Information */}
              {(employee.bank_name || employee.bank_account || employee.bank_iban) && (
                <div className="col-md-6 mb-4">
                  <div className="card shadow h-100">
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">
                        <FontAwesomeIcon icon={faAddressCard} className="me-2" />
                        {t('Banking Information')}
                      </h6>
                    </div>
                    <div className="card-body">
                      {employee.bank_name && (
                        <div className="mb-3">
                          <div className="fw-bold mb-1">
                            <FontAwesomeIcon icon={faBuilding} className="me-2 text-primary" />
                            {t('Bank Name')}
                          </div>
                          <p className="text-muted">{employee.bank_name}</p>
                        </div>
                      )}

                      {employee.bank_account && (
                        <div className="mb-3">
                          <div className="fw-bold mb-1">
                            <FontAwesomeIcon icon={faIdCard} className="me-2 text-primary" />
                            {t('Account Number')}
                          </div>
                          <p className="text-muted">{employee.bank_account}</p>
                        </div>
                      )}

                      {employee.bank_iban && (
                        <div className="mb-3">
                          <div className="fw-bold mb-1">
                            <FontAwesomeIcon icon={faIdCard} className="me-2 text-primary" />
                            {t('IBAN')}
                          </div>
                          <p className="text-muted">{employee.bank_iban}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {employee.notes && (
                <div className="col-12 mb-4">
                  <div className="card shadow">
                    <div className="card-header py-3">
                      <h6 className="m-0 font-weight-bold text-primary">
                        <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                        {t('Notes')}
                      </h6>
                    </div>
                    <div className="card-body">
                      <p className="text-muted">{employee.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
</div>
    </Layout>
  );
};

export default EmployeeShow;
