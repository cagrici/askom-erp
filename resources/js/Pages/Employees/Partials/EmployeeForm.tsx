import React from 'react';
import { Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import { Company, Department, OrganizationPosition, User } from '@/types';
import { useTranslation } from 'react-i18next';

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

interface EmployeeFormProps {
  data: {
    user_id?: string;
    company_id: string;
    department_id: string;
    position_id: string;
    employee_id: string;
    hire_date: string;

    employment_type: string;
      status: string;
    termination_date: string;
    national_id_number: string;
    birth_date: string;
    birth_place: string;
    gender: string;
    marital_status: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relationship: string;
    bank_name: string;
    bank_account: string;
    bank_iban: string;
    notes: string;
  };
  setData: (key: string, value: any) => void;
  errors: Record<string, string>;
  processing: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  companies: Company[];
  departments: Department[];
  positions: OrganizationPosition[];
  users?: User[];
  employmentTypes: EmploymentType[];
  employmentStatuses?: EmploymentStatus[];
  genders: Gender[];
  maritalStatuses: MaritalStatus[];
  isEditMode: boolean;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  data,
  setData,
  errors,
  processing,
  handleSubmit,
  companies,
  departments,
  positions,
  users,
  employmentTypes,
  employmentStatuses,
  genders,
  maritalStatuses,
  isEditMode,
}) => {
  const { t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(name, value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        {/* Basic Information Section */}
        <div className="col-12">
          <h5 className="text-primary mb-3">{t('Basic Information')}</h5>
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                {!isEditMode && (
                  <div className="col-md-6 mb-3">
                    <label htmlFor="user_id" className="form-label">
                      {t('User')} <span className="text-danger">*</span>
                    </label>
                    <select
                      id="user_id"
                      name="user_id"
                      className={`form-select ${errors.user_id ? 'is-invalid' : ''}`}
                      value={data.user_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">{t('Select User')}</option>
                      {users?.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                    {errors.user_id && <div className="invalid-feedback">{errors.user_id}</div>}
                  </div>
                )}

                <div className="col-md-6 mb-3">
                  <label htmlFor="employee_id" className="form-label">
                    {t('Employee ID')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="employee_id"
                    name="employee_id"
                    className={`form-control ${errors.employee_id ? 'is-invalid' : ''}`}
                    value={data.employee_id}
                    onChange={handleChange}
                    required
                  />
                  {errors.employee_id && <div className="invalid-feedback">{errors.employee_id}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="company_id" className="form-label">
                    {t('Company')} <span className="text-danger">*</span>
                  </label>
                  <select
                    id="company_id"
                    name="company_id"
                    className={`form-select ${errors.company_id ? 'is-invalid' : ''}`}
                    value={data.company_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t('Select Company')}</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  {errors.company_id && <div className="invalid-feedback">{errors.company_id}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="department_id" className="form-label">
                    {t('Department')}
                  </label>
                  <select
                    id="department_id"
                    name="department_id"
                    className={`form-select ${errors.department_id ? 'is-invalid' : ''}`}
                    value={data.department_id}
                    onChange={handleChange}
                  >
                    <option value="">{t('Select Department')}</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                  {errors.department_id && <div className="invalid-feedback">{errors.department_id}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="position_id" className="form-label">
                    {t('Position')}
                  </label>
                  <select
                    id="position_id"
                    name="position_id"
                    className={`form-select ${errors.position_id ? 'is-invalid' : ''}`}
                    value={data.position_id}
                    onChange={handleChange}
                  >
                    <option value="">{t('Select Position')}</option>
                    {positions.map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.name}
                      </option>
                    ))}
                  </select>
                  {errors.position_id && <div className="invalid-feedback">{errors.position_id}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employment Details Section */}
        <div className="col-12">
          <h5 className="text-primary mb-3">{t('Employment Details')}</h5>
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="hire_date" className="form-label">
                    {t('Hire Date')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    id="hire_date"
                    name="hire_date"
                    className={`form-control ${errors.hire_date ? 'is-invalid' : ''}`}
                    value={data.hire_date}
                    onChange={handleChange}
                    required
                  />
                  {errors.hire_date && <div className="invalid-feedback">{errors.hire_date}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="termination_date" className="form-label">
                    {t('Contract End Date')}
                  </label>
                  <input
                    type="date"
                    id="termination_date"
                    name="termination_date"
                    className={`form-control ${errors.termination_date ? 'is-invalid' : ''}`}
                    value={data.termination_date}
                    onChange={handleChange}
                  />
                  {errors.termination_date && <div className="invalid-feedback">{errors.termination_date}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="employment_type" className="form-label">
                    {t('Employment Type')} <span className="text-danger">*</span>
                  </label>
                  <select
                    id="employment_type"
                    name="employment_type"
                    className={`form-select ${errors.employment_type ? 'is-invalid' : ''}`}
                    value={data.employment_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t('Select Type')}</option>
                    {employmentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.employment_type && <div className="invalid-feedback">{errors.employment_type}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="status" className="form-label">
                    {t('Employment Status')} <span className="text-danger">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                    value={data.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t('Select Status')}</option>
                    {isEditMode && employmentStatuses
                      ? employmentStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))
                      : [
                          { value: 'active', label: t('Active') },
                          { value: 'on_leave', label: t('On Leave') },
                          { value: 'suspended', label: t('Suspended') },
                          { value: 'terminated', label: t('Terminated') },
                          { value: 'retired', label: t('Retired') },
                        ].map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                  </select>
                  {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                </div>

                {(isEditMode || data.status === 'terminated' || data.status === 'retired') && (
                  <div className="col-md-6 mb-3">
                    <label htmlFor="termination_date" className="form-label">
                      {data.status === 'retired' ? t('Retirement Date') : t('Termination Date')}
                    </label>
                    <input
                      type="date"
                      id="termination_date"
                      name="termination_date"
                      className={`form-control ${errors.termination_date ? 'is-invalid' : ''}`}
                      value={data.termination_date}
                      onChange={handleChange}
                    />
                    {errors.termination_date && <div className="invalid-feedback">{errors.termination_date}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="col-12">
          <h5 className="text-primary mb-3">{t('Personal Information')}</h5>
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="national_id_number" className="form-label">
                    {t('National ID Number')}
                  </label>
                  <input
                    type="text"
                    id="national_id_number"
                    name="national_id_number"
                    className={`form-control ${errors.national_id_number ? 'is-invalid' : ''}`}
                    value={data.national_id_number}
                    onChange={handleChange}
                  />
                  {errors.national_id_number && <div className="invalid-feedback">{errors.national_id_number}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="birth_date" className="form-label">
                    {t('Date of Birth')}
                  </label>
                  <input
                    type="date"
                    id="birth_date"
                    name="birth_date"
                    className={`form-control ${errors.birth_date ? 'is-invalid' : ''}`}
                    value={data.birth_date}
                    onChange={handleChange}
                  />
                  {errors.birth_date && <div className="invalid-feedback">{errors.birth_date}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="birth_place" className="form-label">
                    {t('Place of Birth')}
                  </label>
                  <input
                    type="text"
                    id="birth_place"
                    name="birth_place"
                    className={`form-control ${errors.birth_place ? 'is-invalid' : ''}`}
                    value={data.birth_place}
                    onChange={handleChange}
                  />
                  {errors.birth_place && <div className="invalid-feedback">{errors.birth_place}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="gender" className="form-label">
                    {t('Gender')}
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className={`form-select ${errors.gender ? 'is-invalid' : ''}`}
                    value={data.gender}
                    onChange={handleChange}
                  >
                    <option value="">{t('Select Gender')}</option>
                    {genders.map((gender) => (
                      <option key={gender.value} value={gender.value}>
                        {gender.label}
                      </option>
                    ))}
                  </select>
                  {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="marital_status" className="form-label">
                    {t('Marital Status')}
                  </label>
                  <select
                    id="marital_status"
                    name="marital_status"
                    className={`form-select ${errors.marital_status ? 'is-invalid' : ''}`}
                    value={data.marital_status}
                    onChange={handleChange}
                  >
                    <option value="">{t('Select Marital Status')}</option>
                    {maritalStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  {errors.marital_status && <div className="invalid-feedback">{errors.marital_status}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="col-12">
          <h5 className="text-primary mb-3">{t('Emergency Contact')}</h5>
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="emergency_contact_name" className="form-label">
                    {t('Contact Name')}
                  </label>
                  <input
                    type="text"
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    className={`form-control ${errors.emergency_contact_name ? 'is-invalid' : ''}`}
                    value={data.emergency_contact_name}
                    onChange={handleChange}
                  />
                  {errors.emergency_contact_name && <div className="invalid-feedback">{errors.emergency_contact_name}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="emergency_contact_phone" className="form-label">
                    {t('Contact Phone')}
                  </label>
                  <input
                    type="text"
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    className={`form-control ${errors.emergency_contact_phone ? 'is-invalid' : ''}`}
                    value={data.emergency_contact_phone}
                    onChange={handleChange}
                  />
                  {errors.emergency_contact_phone && <div className="invalid-feedback">{errors.emergency_contact_phone}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="emergency_contact_relationship" className="form-label">
                    {t('Relationship')}
                  </label>
                  <input
                    type="text"
                    id="emergency_contact_relationship"
                    name="emergency_contact_relationship"
                    className={`form-control ${errors.emergency_contact_relationship ? 'is-invalid' : ''}`}
                    value={data.emergency_contact_relationship}
                    onChange={handleChange}
                  />
                  {errors.emergency_contact_relationship && <div className="invalid-feedback">{errors.emergency_contact_relationship}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Banking Information Section */}
        <div className="col-12">
          <h5 className="text-primary mb-3">{t('Banking Information')}</h5>
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="bank_name" className="form-label">
                    {t('Bank Name')}
                  </label>
                  <input
                    type="text"
                    id="bank_name"
                    name="bank_name"
                    className={`form-control ${errors.bank_name ? 'is-invalid' : ''}`}
                    value={data.bank_name}
                    onChange={handleChange}
                  />
                  {errors.bank_name && <div className="invalid-feedback">{errors.bank_name}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="bank_account" className="form-label">
                    {t('Account Number')}
                  </label>
                  <input
                    type="text"
                    id="bank_account"
                    name="bank_account"
                    className={`form-control ${errors.bank_account ? 'is-invalid' : ''}`}
                    value={data.bank_account}
                    onChange={handleChange}
                  />
                  {errors.bank_account && <div className="invalid-feedback">{errors.bank_account}</div>}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="bank_iban" className="form-label">
                    {t('IBAN')}
                  </label>
                  <input
                    type="text"
                    id="bank_iban"
                    name="bank_iban"
                    className={`form-control ${errors.bank_iban ? 'is-invalid' : ''}`}
                    value={data.bank_iban}
                    onChange={handleChange}
                  />
                  {errors.bank_iban && <div className="invalid-feedback">{errors.bank_iban}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="col-12">
          <h5 className="text-primary mb-3">{t('Additional Notes')}</h5>
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-12 mb-3">
                  <label htmlFor="notes" className="form-label">
                    {t('Notes')}
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    className={`form-control ${errors.notes ? 'is-invalid' : ''}`}
                    value={data.notes}
                    onChange={handleChange}
                    rows={4}
                  />
                  {errors.notes && <div className="invalid-feedback">{errors.notes}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4">
        <Link
          href={route('employees.index')}
          className="btn btn-secondary"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          {t('Cancel')}
        </Link>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={processing}
        >
          <FontAwesomeIcon icon={faSave} className="me-2" />
          {isEditMode ? t('Update Employee') : t('Create Employee')}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
