import React from 'react';
import { Link } from '@inertiajs/react';
import { PaginatedData } from '@/types/expense';

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    className?: string;
    render?: (item: any) => React.ReactNode;
}

interface SortState {
    field: string;
    direction: 'asc' | 'desc';
}

interface Props {
    data: PaginatedData<any>;
    columns: Column[];
    onSort?: (field: string, direction: 'asc' | 'desc') => void;
    currentSort?: SortState;
    className?: string;
}

export default function DataTable({ data, columns, onSort, currentSort, className = '' }: Props) {
    const handleSort = (column: Column) => {
        if (!column.sortable || !onSort) return;

        const newDirection = 
            currentSort?.field === column.key && currentSort?.direction === 'asc' 
                ? 'desc' 
                : 'asc';
        
        onSort(column.key, newDirection);
    };

    const getSortIcon = (column: Column) => {
        if (!column.sortable) return null;
        
        if (currentSort?.field !== column.key) {
            return <i className="fas fa-sort text-muted ms-1"></i>;
        }
        
        return currentSort.direction === 'asc' 
            ? <i className="fas fa-sort-up text-primary ms-1"></i>
            : <i className="fas fa-sort-down text-primary ms-1"></i>;
    };

    const renderPagination = () => {
        if (data.last_page <= 1) return null;

        return (
            <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted small">
                    {data.from} - {data.to} / {data.total} kayıt gösteriliyor
                </div>
                <nav>
                    <ul className="pagination pagination-sm mb-0">
                        {data.links.map((link, index) => (
                            <li key={index} className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}>
                                {link.url ? (
                                    <Link
                                        href={link.url}
                                        className="page-link"
                                        preserveState
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span 
                                        className="page-link"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        );
    };

    return (
        <div className={`data-table ${className}`}>
            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead className="table-light">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`${column.className || ''} ${column.sortable ? 'cursor-pointer user-select-none' : ''}`}
                                    onClick={() => handleSort(column)}
                                >
                                    <div className="d-flex align-items-center">
                                        {column.label}
                                        {getSortIcon(column)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.data.length > 0 ? (
                            data.data.map((item, index) => (
                                <tr key={item.id || index}>
                                    {columns.map((column) => (
                                        <td key={column.key} className={column.className || ''}>
                                            {column.render 
                                                ? column.render(item)
                                                : item[column.key]
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-4 text-muted">
                                    <i className="fas fa-inbox fs-1 mb-2 d-block text-muted"></i>
                                    Gösterilecek kayıt bulunamadı
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {renderPagination()}
        </div>
    );
}