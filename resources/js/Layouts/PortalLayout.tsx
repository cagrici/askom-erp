import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface CurrentAccount {
    id: number;
    title: string;
    account_code: string;
    is_default: boolean;
}

interface PortalLayoutProps {
    children: React.ReactNode;
}

const PortalLayout: React.FC<PortalLayoutProps> = ({ children }) => {
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [availableAccounts, setAvailableAccounts] = useState<CurrentAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const user = usePage().props.auth.user;

    useEffect(() => {
        fetchAvailableAccounts();
    }, []);

    const fetchAvailableAccounts = async () => {
        try {
            const response = await axios.get(route('portal.account.available'));
            setAvailableAccounts(response.data.accounts);
            setSelectedAccountId(response.data.selected_id);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const handleAccountSwitch = (accountId: number) => {
        if (accountId === selectedAccountId) return;

        setLoading(true);
        router.post(route('portal.account.switch'), {
            account_id: accountId
        }, {
            preserveState: false,
            onFinish: () => setLoading(false)
        });
    };

    const selectedAccount = availableAccounts.find(acc => acc.id === selectedAccountId);

    const menuItems = [
        {
            title: 'Ana Sayfa',
            icon: 'bx bx-home-circle',
            href: route('portal.dashboard'),
            active: location.pathname === route('portal.dashboard')
        },
        {
            title: 'Ürün Kataloğu',
            icon: 'bx bx-package',
            href: route('portal.products.index'),
            active: location.pathname.startsWith(route('portal.products.index'))
        },
        {
            title: 'Siparişlerim',
            icon: 'bx bx-shopping-bag',
            href: route('portal.orders.index'),
            active: location.pathname.startsWith(route('portal.orders.index'))
        },
        {
            title: 'Tekliflerim',
            icon: 'bx bx-file',
            href: route('portal.offers.index'),
            active: location.pathname.startsWith(route('portal.offers.index'))
        },
        {
            title: 'İadelerim',
            icon: 'bx bx-arrow-back',
            href: route('portal.returns.index'),
            active: location.pathname.startsWith(route('portal.returns.index'))
        },
        {
            title: 'Faturalarım',
            icon: 'bx bx-receipt',
            href: route('portal.invoices.index'),
            active: location.pathname.startsWith(route('portal.invoices.index'))
        },
        {
            title: 'Cari Hesap Özeti',
            icon: 'bx bx-wallet',
            href: route('portal.account-summary.index'),
            active: location.pathname.startsWith(route('portal.account-summary.index'))
        },
        {
            title: 'Profilim',
            icon: 'bx bx-user',
            href: route('portal.profile.index'),
            active: location.pathname.startsWith(route('portal.profile.index'))
        }
    ];

    return (
        <div className="d-flex">
            {/* Sidebar */}
            <div
                className={`sidebar bg-light border-end ${sidebarOpen ? '' : 'sidebar-closed'}`}
                style={{
                    width: sidebarOpen ? '250px' : '70px',
                    minHeight: '100vh',
                    transition: 'width 0.3s'
                }}
            >
                <div className="d-flex flex-column h-100">
                    {/* Logo */}
                    <div className="p-3 border-bottom">
                        <div className="d-flex align-items-center justify-content-between">
                            {sidebarOpen && (
                                <h5 className="mb-0 text-primary fw-bold">ASKOM B2B Portal</h5>
                            )}
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                <i className={`bx ${sidebarOpen ? 'bx-chevron-left' : 'bx-chevron-right'}`}></i>
                            </button>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="p-3 border-bottom">
                        <div className="d-flex align-items-center">
                            <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                <i className="bx bx-user"></i>
                            </div>
                            {sidebarOpen && (
                                <div className="ms-2">
                                    <div className="fw-bold">{user?.name}</div>
                                    <small className="text-muted">{user?.email}</small>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="flex-grow-1 overflow-auto">
                        <ul className="nav flex-column p-2">
                            {menuItems.map((item, index) => (
                                <li key={index} className="nav-item mb-1">
                                    <Link
                                        href={item.href}
                                        className={`nav-link d-flex align-items-center rounded ${
                                            item.active ? 'bg-primary text-white' : 'text-dark'
                                        }`}
                                        style={{
                                            padding: '10px 15px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <i className={`${item.icon} fs-5`}></i>
                                        {sidebarOpen && (
                                            <span className="ms-3">{item.title}</span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Logout */}
                    <div className="p-3 border-top">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
                        >
                            <i className="bx bx-log-out"></i>
                            {sidebarOpen && <span className="ms-2">Çıkış Yap</span>}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
                {/* Header */}
                <header className="bg-white border-bottom p-3 sticky-top">
                    <div className="container-fluid">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <h4 className="mb-0">B2B Müşteri Portalı</h4>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                {/* Active Account Display */}
                                {selectedAccount && (
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="text-muted small">Aktif Cari:</span>
                                        {availableAccounts.length > 1 ? (
                                            <div className="dropdown">
                                                <button
                                                    className="btn btn-outline-primary dropdown-toggle"
                                                    type="button"
                                                    data-bs-toggle="dropdown"
                                                    disabled={loading}
                                                >
                                                    <i className="bx bx-buildings me-2"></i>
                                                    {loading ? 'Yükleniyor...' : selectedAccount.title}
                                                </button>
                                                <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: '250px' }}>
                                                    <li className="dropdown-header">Cari Hesaplarım</li>
                                                    {availableAccounts.map((account) => (
                                                        <li key={account.id}>
                                                            <button
                                                                className={`dropdown-item d-flex justify-content-between align-items-center ${account.id === selectedAccountId ? 'active' : ''}`}
                                                                onClick={() => handleAccountSwitch(account.id)}
                                                            >
                                                                <div>
                                                                    <div className="fw-bold">{account.title}</div>
                                                                    <small className="text-muted">{account.account_code}</small>
                                                                </div>
                                                                {account.id === selectedAccountId && (
                                                                    <i className="bx bx-check text-success"></i>
                                                                )}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : (
                                            <div className="badge bg-primary-subtle text-primary fs-6 px-3 py-2">
                                                <i className="bx bx-buildings me-2"></i>
                                                {selectedAccount.title}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Notifications */}
                                <div className="dropdown">
                                    <button
                                        className="btn btn-light position-relative"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                    >
                                        <i className="bx bx-bell fs-5"></i>
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                                            0
                                        </span>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                        <li><span className="dropdown-item-text">Bildirim yok</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4">
                    <div className="container-fluid">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white border-top p-3 mt-auto">
                    <div className="container-fluid">
                        <div className="text-center text-muted small">
                            © {new Date().getFullYear()} - ASKOM B2B Portal. Tüm hakları saklıdır.
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default PortalLayout;
