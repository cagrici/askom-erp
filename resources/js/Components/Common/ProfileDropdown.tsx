import React, { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { Link, usePage, router } from '@inertiajs/react';
import { useDispatch, useSelector } from 'react-redux';
import { setCustomizer } from '../../slices/layouts/reducer';
import { changeLayoutMode } from '../../slices/layouts/thunk';
//import images
import avatar1 from "../../../images/users/avatar-3.jpg";
import { useTranslation } from 'react-i18next';
//constants
import { LAYOUT_MODE_TYPES } from "../../Components/constants/layout";

const ProfileDropdown = () => {
    const user = usePage().props.auth.user;
    const dispatch = useDispatch();
    const { layoutModeType } = useSelector((state: any) => ({
        layoutModeType: state.Layout.layoutModeType,
    }));

    const { t } = useTranslation();
    //Dropdown Toggle
    const [isProfileDropdown, setIsProfileDropdown] = useState<boolean>(false);
    const toggleProfileDropdown = () => {
        setIsProfileDropdown(!isProfileDropdown);
    };

    const openCustomizer = () => {
        dispatch(setCustomizer(true));
        setIsProfileDropdown(false); // Dropdown'ı kapat
        console.log("Theme Settings clicked, opening customizer"); // Debug için
    };

    const [open, setOpen] = useState<boolean>(true);
    const toggleLeftCanvas = () => {
        setOpen(!open);
    };

    // Tema değiştirme fonksiyonu
    const toggleTheme = () => {
        const mode = layoutModeType === LAYOUT_MODE_TYPES['DARKMODE']
            ? LAYOUT_MODE_TYPES['LIGHTMODE']
            : LAYOUT_MODE_TYPES['DARKMODE'];
        dispatch(changeLayoutMode(mode));
        setIsProfileDropdown(false); // Dropdown'ı kapat
    };

    // Logout fonksiyonu
    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();

        // Fresh CSRF token al
        const token = document.head.querySelector('meta[name="csrf-token"]');
        if (token) {
            router.post(route('logout'), {}, {
                onError: (errors) => {
                    console.error('Logout error:', errors);
                    // CSRF hatası varsa sayfayı yenile ve tekrar dene
                    if (errors.message && errors.message.includes('419')) {
                        window.location.reload();
                    }
                }
            });
        } else {
            // Token yoksa sayfayı yenile
            window.location.reload();
        }
    };

    return (
        <React.Fragment>
            <Dropdown
                show={isProfileDropdown}
                onClick={toggleProfileDropdown}
                className="ms-sm-3 header-item topbar-user">
                <Dropdown.Toggle as="button" type="button" className="arrow-none btn">
                    <span className="d-flex align-items-center">
                        <img
                            className="rounded-circle header-profile-user"
                            src={user.avatar ? `/storage/${user.avatar}` : (user.avatar || avatar1)}
                            alt="Header Avatar"
                            onError={(e) => {
                                e.currentTarget.src = avatar1;
                            }}
                        />
                        <span className="text-start ms-xl-2">
                            <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">{user.name}</span>
                            <span className="d-none d-xl-block ms-1 fs-12 text-mute user-name-sub-text">{user.position || 'Çalışan'}</span>
                        </span>
                    </span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu-end">
                    <h6 className="dropdown-header">{t('Welcome')} {user.name}!</h6>

                    <Link href={route('profile.edit')} className="dropdown-item">
                        <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
                        <span className="align-middle">{t('Edit Profile')}</span>
                    </Link>


                    <Dropdown.Item href="/admin" className="dropdown-item">
                        <i
                            className="mdi mdi-lifebuoy text-muted fs-16 align-middle me-1"></i> <span
                        className="align-middle">{t('Admin')}</span>
                    </Dropdown.Item>

                    <Dropdown.Item
                        className="dropdown-item"
                        onClick={openCustomizer}
                    >
                        <i className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i>
                        <span className="align-middle">{t('Theme Settings')}</span>
                    </Dropdown.Item>



                    {/* LightDark bileşeni Dropdown.Item olarak */}
                    <Dropdown.Item className="dropdown-item" onClick={toggleTheme}>
                        <i className={`${layoutModeType === LAYOUT_MODE_TYPES['DARKMODE'] ? 'bx bx-sun' : 'bx bx-moon'} text-muted fs-16 align-middle me-1`}></i>
                        <span className="align-middle">{layoutModeType === LAYOUT_MODE_TYPES['DARKMODE'] ? t('Light Mode') : t('Dark Mode')}</span>
                    </Dropdown.Item>



                    <div className="dropdown-divider"></div>



                    <Dropdown.Item href="/pages-profile-settings" className="dropdown-item">
                        <span
                            className="badge bg-success-subtle text-success mt-1 float-end">{t('Online')}</span><i
                                className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i> <span
                                    className="align-middle">{t('Settings')}</span>
                    </Dropdown.Item>

                    <Dropdown.Item as="button" className="dropdown-item" onClick={handleLogout}>
                        <i className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i>
                        <span className="align-middle">{t('Logout')}</span>
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </React.Fragment>
    );
};

export default ProfileDropdown;
