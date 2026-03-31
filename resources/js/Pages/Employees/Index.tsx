import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faEye, faPlus, faSearch, faFilter, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { Employee, Department, Company } from '@/types';
import Pagination from '../../Components/Pagination';
import AlertSuccess from '../../Components/AlertSuccess';
import ConfirmModal from '../../Components/ConfirmModal';
import { useTranslation } from 'react-i18next';
import Layout from '@/Layouts/index';

interface Status {
  value: string;
  label: string;
}

interface Props {
  employees: {
    data: Employee[];
    links: any[];
    current_page: number;
    last_page: number;
  };
  filters: {
    search?: string;
    department_id?: number;
    status?: string;
    company_id?: number;
    sort_field?: string;
    sort_direction?: 'asc' | 'desc';
  };
  departments: Department[];
  companies: Company[];
  statuses: Status[];
  success?: string;
}

const EmployeeIndex: React.FC<Props> = ({ employees, filters, departments, companies, statuses, success }) => {
  const { t } = useTranslation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [currentFilters, setCurrentFilters] = useState(filters);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedFilters = { ...currentFilters, [name]: value || undefined };
    setCurrentFilters(updatedFilters);

    // Remove empty values
    Object.keys(updatedFilters).forEach(key => {
      if (!updatedFilters[key]) {
        delete updatedFilters[key];
      }
    });

    router.get(route('employees.index'), updatedFilters, {
      preserveState: true,
      replace: true,
    });
  };

  const handleSortChange = (field: string) => {
    let direction: 'asc' | 'desc' = 'asc';

    if (filters.sort_field === field) {
      direction = filters.sort_direction === 'asc' ? 'desc' : 'asc';
    }

    const updatedFilters = {
      ...currentFilters,
      sort_field: field,
      sort_direction: direction
    };

    setCurrentFilters(updatedFilters);

    router.get(route('employees.index'), updatedFilters, {
      preserveState: true,
      replace: true,
    });
  };

  const confirmDelete = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setEmployeeToDelete(null);
  };

  const deleteEmployee = () => {
    if (employeeToDelete) {
      router.delete(route('employees.destroy', employeeToDelete.id), {
        onSuccess: () => {
          setShowDeleteModal(false);
          setEmployeeToDelete(null);
        },
      });
    }
  };

  const renderSortIcon = (field: string) => {
    if (filters.sort_field !== field) {
      return null;
    }

    return filters.sort_direction === 'asc'
      ? <FontAwesomeIcon icon={faSortUp} className="ms-1" />
      : <FontAwesomeIcon icon={faSortDown} className="ms-1" />;
  };

  return (
    <Layout>
      <Head title={t('Employees')} />
<div className={"page-content"}>
      <div className="container-fluid py-4">
        <div className="d-sm-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0 text-gray-800">{t('Employees')}</h1>
          <Link
            href={route('employees.create')}
            className="btn btn-sm btn-primary shadow-sm"
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            {t('Add Employee')}
          </Link>
        </div>

        {success && <AlertSuccess message={success} />}

        <div className="card shadow mb-4">
          <div className="card-header py-3">
            <h6 className="m-0 font-weight-bold text-primary">{t('Employee List')}</h6>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-3 mb-2">
                <div className="input-group">
                  <span className="input-group-text">
                    <FontAwesomeIcon icon={faSearch} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('Search by name, email, or ID')}
                    name="search"
                    value={currentFilters.search || ''}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              <div className="col-md-3 mb-2">
                <div className="input-group">
                  <span className="input-group-text">
                    <FontAwesomeIcon icon={faFilter} />
                  </span>
                  <select
                    className="form-select"
                    name="department_id"
                    value={currentFilters.department_id || ''}
                    onChange={handleFilterChange}
                  >
                    <option value="">{t('All Departments')}</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-3 mb-2">
                <div className="input-group">
                  <span className="input-group-text">
                    <FontAwesomeIcon icon={faFilter} />
                  </span>
                  <select
                    className="form-select"
                    name="status"
                    value={currentFilters.status || ''}
                    onChange={handleFilterChange}
                  >
                    <option value="">{t('All Statuses')}</option>
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-3 mb-2">
                <div className="input-group">
                  <span className="input-group-text">
                    <FontAwesomeIcon icon={faFilter} />
                  </span>
                  <select
                    className="form-select"
                    name="company_id"
                    value={currentFilters.company_id || ''}
                    onChange={handleFilterChange}
                  >
                    <option value="">{t('All Companies')}</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="bg-light">
                  <tr>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSortChange('employee_id')}
                    >
                      {t('Employee ID')} {renderSortIcon('employee_id')}
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSortChange('user.name')}
                    >
                      {t('Name')} {renderSortIcon('user.name')}
                    </th>
                    <th>{t('Department')}</th>
                    <th>{t('Position')}</th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSortChange('hire_date')}
                    >
                      {t('Hire Date')} {renderSortIcon('hire_date')}
                    </th>
                    <th>{t('Employment Type')}</th>
                    <th>{t('Status')}</th>
                    <th>{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.data.length > 0 ? (
                    employees.data.map((employee) => (
                      <tr key={employee.id}>
                        <td>{employee.employee_id}</td>
                        <td>
                          {employee.user?.name}
                          <div className="small text-muted">{employee.user?.email}</div>
                        </td>
                        <td>{employee.department?.name || '-'}</td>
                        <td>{employee.position?.name || '-'}</td>
                        <td>{new Date(employee.hire_date).toLocaleDateString()}</td>
                        <td>
                          {employee.employment_type === 'full_time' && t('Full Time')}
                          {employee.employment_type === 'part_time' && t('Part Time')}
                          {employee.employment_type === 'contract' && t('Contract')}
                          {employee.employment_type === 'intern' && t('Intern')}
                          {employee.employment_type === 'consultant' && t('Consultant')}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              employee.status === 'active' ? 'bg-success' :
                              employee.status === 'on_leave' ? 'bg-warning' :
                              employee.status === 'suspended' ? 'bg-danger' :
                              employee.status === 'terminated' ? 'bg-dark' :
                              'bg-secondary'
                            }`}
                          >
                            {employee.status === 'active' && t('Active')}
                            {employee.status === 'on_leave' && t('On Leave')}
                            {employee.status === 'suspended' && t('Suspended')}
                            {employee.status === 'terminated' && t('Terminated')}
                            {employee.status === 'retired' && t('Retired')}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <Link
                              href={route('employees.show', employee.id)}
                              className="btn btn-sm btn-info"
                              title={t('View')}
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </Link>
                            <Link
                              href={route('employees.edit', employee.id)}
                              className="btn btn-sm btn-primary"
                              title={t('Edit')}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Link>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => confirmDelete(employee)}
                              title={t('Delete')}
                            >
                              <FontAwesomeIcon icon={faTrashAlt} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-3">
                        {t('No employees found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination links={employees.links} />
          </div>
        </div>
      </div>
</div>
      <ConfirmModal
        show={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={deleteEmployee}
        title={t('Delete Employee')}
        message={
          employeeToDelete
            ? t('Are you sure you want to delete employee {{name}}? This action cannot be undone.', {
                name: employeeToDelete.user?.name,
              })
            : ''
        }
        confirmText={t('Delete')}
        confirmButtonClass="btn-danger"
      />
    </Layout>
  );
};

export default EmployeeIndex;
