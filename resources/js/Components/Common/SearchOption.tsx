import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Form, Spinner, Badge } from 'react-bootstrap';
import { Link } from '@inertiajs/react';
import Navdata from '../../Layouts/LayoutMenuData';
import SimpleBar from "simplebar-react";
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface SearchResult {
    id: number;
    title: string;
    subtitle: string;
    extra?: string;
    status?: string;
    url: string;
}

interface GlobalSearchResults {
    customers: SearchResult[];
    offers: SearchResult[];
    orders: SearchResult[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: 'Taslak', color: 'secondary' },
    sent: { label: 'Gönderildi', color: 'info' },
    approved: { label: 'Onaylandı', color: 'success' },
    rejected: { label: 'Reddedildi', color: 'danger' },
    expired: { label: 'Süresi Doldu', color: 'warning' },
    converted_to_order: { label: 'Siparişe Çevrildi', color: 'primary' },
    confirmed: { label: 'Onaylandı', color: 'success' },
    in_production: { label: 'Üretimde', color: 'info' },
    ready_to_ship: { label: 'Sevke Hazır', color: 'primary' },
    shipped: { label: 'Sevk Edildi', color: 'primary' },
    delivered: { label: 'Teslim Edildi', color: 'success' },
    cancelled: { label: 'İptal', color: 'danger' },
    pending: { label: 'Beklemede', color: 'warning' },
};

const SearchOption = () => {
    const navData = Navdata().props.children;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterData, setFilterData] = useState([]);
    const [apiResults, setApiResults] = useState<GlobalSearchResults | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const searchOptions = document.getElementById("search-close-options") as HTMLElement;
        const dropdown = document.getElementById("search-dropdown") as HTMLElement;
        const searchInput = document.getElementById("search-options") as HTMLInputElement;

        const handleSearchInput = () => {
            const inputLength = searchInput.value.length;
            if (inputLength > 0) {
                dropdown.classList.add("show");
                searchOptions.classList.remove("d-none");
            } else {
                dropdown.classList.remove("show");
                searchOptions.classList.add("d-none");
            }
        };

        searchInput.addEventListener("focus", handleSearchInput);
        searchInput.addEventListener("keyup", handleSearchInput);

        searchOptions.addEventListener("click", () => {
            searchInput.value = "";
            dropdown.classList.remove("show");
            searchOptions.classList.add("d-none");
        });

        document.body.addEventListener("click", (e: any) => {
            if (e.target.getAttribute('id') !== "search-options") {
                dropdown.classList.remove("show");
                searchOptions.classList.add("d-none");
            }
        });
    }, [searchTerm]);

    const onKeyDownPress = (e: any) => {
        if (e.key === "Enter") {
            e.preventDefault();
            setSearchTerm(e.target.value);
        }
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setSearchTerm(event.target.value);
    };

    // Backend arama (debounced)
    const fetchGlobalSearch = useCallback((query: string) => {
        if (abortRef.current) {
            abortRef.current.abort();
        }

        if (query.length < 2) {
            setApiResults(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const controller = new AbortController();
        abortRef.current = controller;

        axios.get('/api/global-search', {
            params: { q: query },
            signal: controller.signal,
        })
        .then((res) => {
            setApiResults(res.data);
            setIsLoading(false);
        })
        .catch((err) => {
            if (!axios.isCancel(err)) {
                setIsLoading(false);
            }
        });
    }, []);

    // Menü filtreleme + debounced API arama
    useEffect(() => {
        // Client-side menü filtreleme
        const filteredMenuItems = navData.reduce((result: any, menuItem: any) => {
            const lowercaseLabel = menuItem.label ? menuItem.label.toLowerCase() : '';
            const lowercaseLink = menuItem.link ? menuItem.link.toLowerCase() : '';

            if (
                lowercaseLabel.includes(searchTerm.toLowerCase()) ||
                lowercaseLink.includes(searchTerm.toLowerCase())
            ) {
                result.push(menuItem);
            }

            const filteredSubItems = (menuItem.subItems || []).filter((subItem: any) => {
                const lowercaseSubItemLabel = subItem.label ? subItem.label.toLowerCase() : '';
                const lowercaseSubItemLink = subItem.link ? subItem.link.toLowerCase() : '';
                return (
                    lowercaseSubItemLabel.includes(searchTerm.toLowerCase()) ||
                    lowercaseSubItemLink.includes(searchTerm.toLowerCase())
                );
            });

            if (filteredSubItems.length > 0) {
                const menuItemWithSubItems = { ...menuItem, subItems: filteredSubItems };
                result.push(menuItemWithSubItems);
            }

            return result;
        }, []);

        setFilterData(filteredMenuItems);

        // Debounced API arama
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (searchTerm.length >= 2) {
            setIsLoading(true);
            debounceRef.current = setTimeout(() => {
                fetchGlobalSearch(searchTerm);
            }, 300);
        } else {
            setApiResults(null);
            setIsLoading(false);
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    const hasApiResults = apiResults &&
        (apiResults.customers.length > 0 || apiResults.offers.length > 0 || apiResults.orders.length > 0);

    const renderStatusBadge = (status?: string) => {
        if (!status) return null;
        const info = statusLabels[status];
        if (!info) return <Badge bg="secondary" className="ms-1" style={{ fontSize: '9px' }}>{status}</Badge>;
        return <Badge bg={info.color} className="ms-1" style={{ fontSize: '9px' }}>{info.label}</Badge>;
    };

    return (
        <React.Fragment>
            <form className="app-search d-none d-md-block">
                <div className="position-relative">
                    <Form.Control type="text" className="form-control" placeholder={t('Search...')}
                        id="search-options"
                        value={searchTerm}
                        autoComplete="off"
                        onKeyDown={onKeyDownPress}
                        onChange={handleChange}
                    />
                    <span className="mdi mdi-magnify search-widget-icon"></span>
                    <span className="mdi mdi-close-circle search-widget-icon search-widget-icon-close d-none"
                        id="search-close-options"></span>
                </div>
                <div className="dropdown-menu dropdown-menu-lg" id="search-dropdown">
                    <SimpleBar style={{ maxHeight: "400px" }}>

                        {/* Menü sonuçları */}
                        {filterData.length > 0 && (
                            <>
                                <div className="dropdown-header">
                                    <h6 className="text-overflow text-muted mb-0 text-uppercase">{t('Pages')}</h6>
                                </div>
                                {filterData.map((menuItem: any, index) => (
                                    <React.Fragment key={index}>
                                        {!menuItem.subItems ? (
                                            <Link href={menuItem.link} className="dropdown-item notify-item">
                                                <i className={menuItem.icon + " align-middle fs-xl text-muted me-2"}></i>
                                                <span>{menuItem.label}</span>
                                            </Link>
                                        ) : (
                                            <div className="dropdown-header mt-2">
                                                <h6 className="text-overflow text-muted mb-1 text-uppercase">{menuItem.label}</h6>
                                            </div>
                                        )}
                                        {menuItem.subItems && menuItem.subItems.length > 0 && (
                                            <>
                                                {menuItem.subItems.map((subItem: any, subIndex: number) => (
                                                    <Link key={subIndex} href={subItem.link} className="dropdown-item notify-item">
                                                        <i className={menuItem.icon + " align-middle fs-xl text-muted me-2"}></i>
                                                        <span>{subItem.label}</span>
                                                    </Link>
                                                ))}
                                            </>
                                        )}
                                    </React.Fragment>
                                ))}
                            </>
                        )}

                        {/* Loading */}
                        {isLoading && (
                            <div className="text-center py-3">
                                <Spinner animation="border" size="sm" variant="primary" />
                                <span className="ms-2 text-muted" style={{ fontSize: '12px' }}>Aranıyor...</span>
                            </div>
                        )}

                        {/* API Sonuçları - Cariler */}
                        {apiResults && apiResults.customers.length > 0 && (
                            <>
                                <div className="dropdown-header mt-2">
                                    <h6 className="text-overflow text-muted mb-1 text-uppercase">
                                        <i className="ri-building-line me-1"></i>Cariler
                                    </h6>
                                </div>
                                {apiResults.customers.map((item) => (
                                    <Link key={`c-${item.id}`} href={item.url} className="dropdown-item notify-item">
                                        <i className="ri-building-line align-middle fs-xl text-primary me-2"></i>
                                        <span>
                                            <strong>{item.title}</strong>
                                            {item.subtitle && <span className="text-muted ms-1">({item.subtitle})</span>}
                                            {item.extra && <small className="text-muted ms-1">- {item.extra}</small>}
                                        </span>
                                    </Link>
                                ))}
                            </>
                        )}

                        {/* API Sonuçları - Teklifler */}
                        {apiResults && apiResults.offers.length > 0 && (
                            <>
                                <div className="dropdown-header mt-2">
                                    <h6 className="text-overflow text-muted mb-1 text-uppercase">
                                        <i className="ri-file-text-line me-1"></i>Teklifler
                                    </h6>
                                </div>
                                {apiResults.offers.map((item) => (
                                    <Link key={`o-${item.id}`} href={item.url} className="dropdown-item notify-item">
                                        <i className="ri-file-text-line align-middle fs-xl text-info me-2"></i>
                                        <span>
                                            <strong>{item.title}</strong>
                                            {item.subtitle && <span className="text-muted ms-1">- {item.subtitle}</span>}
                                            {renderStatusBadge(item.status)}
                                        </span>
                                    </Link>
                                ))}
                            </>
                        )}

                        {/* API Sonuçları - Siparişler */}
                        {apiResults && apiResults.orders.length > 0 && (
                            <>
                                <div className="dropdown-header mt-2">
                                    <h6 className="text-overflow text-muted mb-1 text-uppercase">
                                        <i className="ri-shopping-cart-line me-1"></i>Siparişler
                                    </h6>
                                </div>
                                {apiResults.orders.map((item) => (
                                    <Link key={`s-${item.id}`} href={item.url} className="dropdown-item notify-item">
                                        <i className="ri-shopping-cart-line align-middle fs-xl text-success me-2"></i>
                                        <span>
                                            <strong>{item.title}</strong>
                                            {item.subtitle && <span className="text-muted ms-1">- {item.subtitle}</span>}
                                            {renderStatusBadge(item.status)}
                                        </span>
                                    </Link>
                                ))}
                            </>
                        )}

                        {/* Sonuç bulunamadı */}
                        {!isLoading && searchTerm.length >= 2 && apiResults && !hasApiResults && filterData.length === 0 && (
                            <div className="text-center py-3">
                                <i className="ri-search-line fs-1 text-muted"></i>
                                <p className="text-muted mb-0 mt-1" style={{ fontSize: '12px' }}>Sonuç bulunamadı</p>
                            </div>
                        )}

                    </SimpleBar>
                </div>
            </form>
        </React.Fragment>
    );
};

export default SearchOption;
