import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const user = usePage().props.auth.user;

    const menuItems = [
        {
            title: t('Dashboard'),
            icon: 'bx bx-home-circle',
            href: '/admin',
            active: location.pathname === '/admin'
        },
        {
            title: t('User Management'),
            icon: 'bx bx-user',
            submenu: [
                {
                    title: t('Users'),
                    href: '/admin/users',
                    active: location.pathname.startsWith('/admin/users')
                },
                {
                    title: t('Roles'),
                    href: '/admin/roles',
                    active: location.pathname.startsWith('/admin/roles')
                },
                {
                    title: 'Pozisyonlar',
                    href: '/admin/positions',
                    active: location.pathname.startsWith('/admin/positions')
                },
                {
                    title: t('Login Redirects'),
                    href: route('admin.login-redirects.index'),
                    active: location.pathname.startsWith(route('admin.login-redirects.index'))
                },
                {
                    title: t('Permissions'),
                    href: '/admin/permissions',
                    active: location.pathname.startsWith('/admin/permissions')
                }
            ]
        },
        {
            title: t('Organization Chart'),
            icon: 'ri-map-pin-user-line',
            href: route('admin.organization-chart.index'),
            active: location.pathname.startsWith(route('admin.organization-chart.index'))
        },
        {
            title: t('Approval Workflows'),
            icon: 'bx bx-check-circle',
            href: '/admin/approval-workflows',
            active: location.pathname.startsWith('/admin/approval-workflows')
        },
        {
            title: t('Categories'),
            icon: 'bx bx-category',
            href: '/admin/categories',
            active: location.pathname.startsWith('/admin/categories')
        },
        {
            title: 'Şirket Yönetimi',
            icon: 'bx bx-buildings',
            submenu: [
                {
                    title: 'Şirketler',
                    href: '/admin/companies',
                    active: location.pathname.startsWith('/admin/companies')
                },
                {
                    title: 'Lokasyonlar',
                    href: '/admin/locations',
                    active: location.pathname.startsWith('/admin/locations')
                },
                {
                    title: 'Departmanlar',
                    href: '/admin/departments',
                    active: location.pathname.startsWith('/admin/departments')
                }
            ]
        },
        {
            title: t('Settings'),
            icon: 'bx bx-cog',
            href: '/admin/settings',
            active: location.pathname.startsWith('/admin/settings')
        }
    ];

    return (
        <div className="d-flex">
            {/* Sidebar */}
            <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="admin-sidebar-header">
                    <div className="d-flex align-items-center">

                        {sidebarOpen && (
                            <span className="text-white fs-6 fw-bold">Admin Panel</span>
                        )}
                    </div>
                    <button
                        className="btn btn-link text-white p-0"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <i className="bx bx-menu"></i>
                    </button>
                </div>

                <div className="admin-sidebar-content">
                    <nav className="admin-nav">
                        {menuItems.map((item, index) => (
                            <div key={index} className="admin-nav-item">
                                {item.submenu ? (
                                    <div className="admin-nav-group">
                                        <div className="admin-nav-group-header">
                                            <i className={item.icon}></i>
                                            <span>{item.title}</span>
                                        </div>
                                        <div className="admin-nav-submenu">
                                            {item.submenu.map((subItem, subIndex) => (
                                                <Link
                                                    key={subIndex}
                                                    href={subItem.href}
                                                    className={`admin-nav-link ${subItem.active ? 'active' : ''}`}
                                                >
                                                    {subItem.title}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={`admin-nav-link ${item.active ? 'active' : ''}`}
                                    >
                                        <i className={item.icon}></i>
                                        <span>{item.title}</span>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="admin-sidebar-footer">
                    <Link href="/" className="btn btn-outline-light btn-sm">
                        <i className="bx bx-arrow-back"></i> {t('Back to Portal')}
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="admin-main-content flex-grow-1">
                {/* Top Bar */}
                <div className="admin-topbar">
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{t('Admin Panel')}</h5>
                        <div className="d-flex align-items-center">
                            <span className="me-3">Merhaba, {user.name}</span>
                            <Link
                                href="/logout"
                                method="post"
                                className="btn btn-outline-danger btn-sm"
                            >
                                <i className="bx bx-log-out"></i> {t('Logout')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="admin-page-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
