import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Layouts';
import { Expense, ExpenseFilters, ExpenseStats, PaginatedData } from '@/types/expense';
import DataTable from '@/Components/DataTable';
import ExpensesDashboard from '@/Components/Accounting/Expenses/ExpensesDashboard';
import ExpensesFilters from '@/Components/Accounting/Expenses/ExpensesFilters';

interface Props {
    expenses: PaginatedData<Expense>;
    stats: ExpenseStats;
    charts: {
        categoryDistribution: any[];
        statusDistribution: any;
        monthlyData: any[];
    };
    filters: ExpenseFilters;
    filterOptions: {
        categories: any[];
        locations: any[];
        employees: any[];
    };
}

export default function Index({ expenses, stats, charts, filters, filterOptions }: Props) {
    const [showFilters, setShowFilters] = useState(false);

    const columns = [
        {
            key: 'expense_number',
            label: 'Gider No',
            sortable: true,
            render: (expense: Expense) => (
                <Link
                    href={route('accounting.expenses.show', expense.id)}
                    className="text-primary fw-bold text-decoration-none"
                >
                    {expense.expense_number}
                </Link>
            )
        },
        {
            key: 'expense_date',
            label: 'Tarih',
            sortable: true,
            render: (expense: Expense) => new Date(expense.expense_date).toLocaleDateString('tr-TR')
        },
        {
            key: 'category',
            label: 'Kategori',
            sortable: true,
            render: (expense: Expense) => (
                <span
                    className="badge rounded-pill px-2 py-1"
                    style={{ backgroundColor: expense.category?.color + '20', color: expense.category?.color }}
                >
                    {expense.category?.name || 'Kategorisiz'}
                </span>
            )
        },
        {
            key: 'title',
            label: 'Başlık',
            sortable: true,
            render: (expense: Expense) => (
                <div>
                    <div className="fw-medium">{expense.title}</div>
                    {expense.current_account && (
                        <small className="text-muted">{expense.current_account.title}</small>
                    )}
                </div>
            )
        },
        {
            key: 'amount',
            label: 'Tutar',
            sortable: true,
            className: 'text-end',
            render: (expense: Expense) => (
                <div className="text-end">
                    <div className="fw-bold">{expense.formatted_amount}</div>
                    {expense.net_amount !== expense.amount && (
                        <small className="text-muted">Net: {expense.formatted_net_amount}</small>
                    )}
                </div>
            )
        },
        {
            key: 'status',
            label: 'Durum',
            render: (expense: Expense) => (
                <div>
                    <span className={`badge bg-${expense.status_badge_color} mb-1`}>
                        {expense.status_text}
                    </span>
                    <div>
                        <small className="text-muted">{expense.payment_status_text}</small>
                    </div>
                </div>
            )
        },
        {
            key: 'due_date',
            label: 'Vade',
            render: (expense: Expense) => (
                <div>
                    {expense.due_date ? (
                        <>
                            <div>{new Date(expense.due_date).toLocaleDateString('tr-TR')}</div>
                            {expense.is_overdue && (
                                <small className="text-danger">
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    {expense.days_overdue} gün gecikme
                                </small>
                            )}
                        </>
                    ) : (
                        <span className="text-muted">-</span>
                    )}
                </div>
            )
        },
        {
            key: 'actions',
            label: 'İşlemler',
            render: (expense: Expense) => (
                <div className="dropdown">
                    <button
                        className="btn btn-outline-secondary btn-sm dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                    >
                        <i className="fas fa-ellipsis-v"></i>
                    </button>
                    <ul className="dropdown-menu">
                        <li>
                            <Link
                                href={route('accounting.expenses.show', expense.id)}
                                className="dropdown-item"
                            >
                                <i className="fas fa-eye me-2"></i>Görüntüle
                            </Link>
                        </li>
                        {expense.can_edit && (
                            <li>
                                <Link
                                    href={route('accounting.expenses.edit', expense.id)}
                                    className="dropdown-item"
                                >
                                    <i className="fas fa-edit me-2"></i>Düzenle
                                </Link>
                            </li>
                        )}
                        {expense.can_approve && (
                            <li>
                                <button
                                    className="dropdown-item"
                                    onClick={() => handleApprove(expense.id)}
                                >
                                    <i className="fas fa-check me-2"></i>Onayla
                                </button>
                            </li>
                        )}
                        {expense.can_pay && (
                            <li>
                                <button
                                    className="dropdown-item"
                                    onClick={() => handleMarkAsPaid(expense.id)}
                                >
                                    <i className="fas fa-money-bill me-2"></i>Ödendi İşaretle
                                </button>
                            </li>
                        )}
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                            <button
                                className="dropdown-item"
                                onClick={() => handleDuplicate(expense.id)}
                            >
                                <i className="fas fa-copy me-2"></i>Kopyala
                            </button>
                        </li>
                        {expense.can_delete && (
                            <>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button
                                        className="dropdown-item text-danger"
                                        onClick={() => handleDelete(expense.id)}
                                    >
                                        <i className="fas fa-trash me-2"></i>Sil
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            )
        }
    ];

    const handleApprove = (expenseId: number) => {
        if (confirm('Bu gideri onaylamak istediğinizden emin misiniz?')) {
            router.patch(route('accounting.expenses.approve', expenseId), {}, {
                onSuccess: () => {
                    // Success message will be shown by the backend
                }
            });
        }
    };

    const handleMarkAsPaid = (expenseId: number) => {
        if (confirm('Bu gideri ödenmiş olarak işaretlemek istediğinizden emin misiniz?')) {
            router.patch(route('accounting.expenses.mark-paid', expenseId), {}, {
                onSuccess: () => {
                    // Success message will be shown by the backend
                }
            });
        }
    };

    const handleDuplicate = (expenseId: number) => {
        router.post(route('accounting.expenses.duplicate', expenseId), {}, {
            onSuccess: () => {
                // Success message will be shown by the backend
            }
        });
    };

    const handleDelete = (expenseId: number) => {
        if (confirm('Bu gideri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            router.delete(route('accounting.expenses.destroy', expenseId), {
                onSuccess: () => {
                    // Success message will be shown by the backend
                }
            });
        }
    };

    const handleFilterChange = (newFilters: Partial<ExpenseFilters>) => {
        router.get(route('accounting.expenses.index'),
            { ...filters, ...newFilters, page: 1 },
            { preserveState: true, replace: true }
        );
    };

    const handleExport = () => {
        router.post(route('accounting.expenses.export'), filters);
    };

    return (
        <Layout>
            <Head title="Gider Yönetimi" />
            <div className="page-content">
            <div className="container-fluid">
                {/* Dashboard */}
                <ExpensesDashboard stats={stats} charts={charts} />

                {/* Main Content */}
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">
                                    <i className="fas fa-receipt me-2"></i>
                                    Giderler
                                </h5>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => setShowFilters(!showFilters)}
                                    >
                                        <i className="fas fa-filter me-1"></i>
                                        Filtreler
                                    </button>
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={handleExport}
                                    >
                                        <i className="fas fa-download me-1"></i>
                                        Dışa Aktar
                                    </button>
                                    <Link
                                        href={route('accounting.expenses.analytics')}
                                        className="btn btn-outline-info btn-sm"
                                    >
                                        <i className="fas fa-chart-bar me-1"></i>
                                        Analitik
                                    </Link>
                                    <Link
                                        href={route('accounting.expenses.create')}
                                        className="btn btn-primary btn-sm"
                                    >
                                        <i className="fas fa-plus me-1"></i>
                                        Yeni Gider
                                    </Link>
                                </div>
                            </div>

                            {/* Filters */}
                            {showFilters && (
                                <div className="card-body border-bottom">
                                    <ExpensesFilters
                                        filters={filters}
                                        filterOptions={filterOptions}
                                        onFilterChange={handleFilterChange}
                                    />
                                </div>
                            )}

                            <div className="card-body">
                                <DataTable
                                    data={expenses}
                                    columns={columns}
                                    onSort={(field, direction) =>
                                        handleFilterChange({ sort_field: field, sort_direction: direction })
                                    }
                                    currentSort={{
                                        field: filters.sort_field || 'created_at',
                                        direction: filters.sort_direction || 'desc'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </Layout>
    );
}
