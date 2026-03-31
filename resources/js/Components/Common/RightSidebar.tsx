/**
 * RightSidebar Component - Theme Customizer
 *
 * Bu bileşen kullanıcılara tema ayarlarını özelleştirme imkanı sağlar:
 * - Layout seçenekleri (vertical, horizontal, etc.)
 * - Renk şeması (light/dark mode)
 * - Sidebar ayarları
 * - Renk paleti özelleştirme (primary, secondary, success, danger, warning, info)
 *
 * Renk özelleştirme özelliği:
 * - Her renk türü için ayrı renk seçici
 * - Değişiklikler anında CSS değişkenlerine uygulanır
 * - Renkler localStorage'da saklanır
 * - Sayfa yenilenmesinde renkler korunur
 * - Reset butonu ile varsayılan renklere dönülür
 */
import React, { useEffect, useState } from 'react';
import {
    Offcanvas,
    Collapse,
    Form,
} from "react-bootstrap";
import { ChromePicker } from 'react-color';

//redux
import {
    changeLayout,
    changeSidebarTheme,
    changeLayoutMode,
    changeLayoutWidth,
    changeLayoutPosition,
    changeTopbarTheme,
    changeLeftsidebarSizeType,
    changeLeftsidebarViewType,
    changeSidebarImageType,
    changePreLoader,
    changeSidebarVisibility
    // resetValue
} from "../../slices/thunk";
import { setCustomizer } from "../../slices/layouts/reducer";

import { useSelector, useDispatch } from "react-redux";

//import Constant
import {
    LAYOUT_TYPES,
    LAYOUT_SIDEBAR_TYPES,
    LAYOUT_MODE_TYPES,
    LAYOUT_WIDTH_TYPES,
    LAYOUT_POSITION_TYPES,
    LAYOUT_TOPBAR_THEME_TYPES,
    LEFT_SIDEBAR_SIZE_TYPES,
    LEFT_SIDEBAR_VIEW_TYPES,
    LEFT_SIDEBAR_IMAGE_TYPES,
    PERLOADER_TYPES,
    SIDEBAR_VISIBILITY_TYPES
} from "../constants/layout";

//SimpleBar
import SimpleBar from "simplebar-react";
import classnames from "classnames";

//import Images
import img01 from "../../../images/sidebar/img-1.jpg";
import img02 from "../../../images/sidebar/img-2.jpg";
import img03 from "../../../images/sidebar/img-3.jpg";
import img04 from "../../../images/sidebar/img-4.jpg";
import { createSelector } from 'reselect';
import { useTranslation } from 'react-i18next';

const RightSidebar = (props: any) => {
    const dispatch: any = useDispatch();
    const { t } = useTranslation();

    const [show, setShow] = useState<boolean>(false);

    // Renk paleti state'leri
    const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
    const [currentColorType, setCurrentColorType] = useState<string>('primary');
    const [primaryColor, setPrimaryColor] = useState<string>('#405189');  // $indigo
    const [secondaryColor, setSecondaryColor] = useState<string>('#3577f1'); // $blue
    const [successColor, setSuccessColor] = useState<string>('#0ab39c');   // $green
    const [dangerColor, setDangerColor] = useState<string>('#f06548');     // $red
    const [warningColor, setWarningColor] = useState<string>('#f7b84b');   // $yellow
    const [infoColor, setInfoColor] = useState<string>('#299cdb');         // $cyan
    const [headerColor, setHeaderColor] = useState<string>('#ffffff');     // $white

    // Google Fonts state
    const [selectedFont, setSelectedFont] = useState<string>('Roboto');

    // Popüler Google Fontları
    const googleFonts = [
        'Roboto',
        'Open Sans',
        'Lato',
        'Montserrat',
        'Poppins',
        'Raleway',
        'Ubuntu',
        'Nunito',
        'Playfair Display',
        'Merriweather',
        'Inter',
        'Crimson Text',
        'Karla',
        'Source Sans Pro',
        'Oswald'
    ];

    // localStorage kontrol fonksiyonu
    const checkLocalStorage = () => {
        try {
            const testKey = 'localStorage-test';
            const testValue = 'test-value';
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);

            return retrieved === testValue;
        } catch (error) {
            console.error('localStorage erişim hatası:', error);
            return false;
        }
    };

    // Google Font'u yükle - useEffect'ten ÖNCE tanımlanmalı
    const loadGoogleFont = React.useCallback((fontName: string) => {
        // Mevcut font link'ini kaldır
        const existingLink = document.getElementById('google-font-link');
        if (existingLink) {
            existingLink.remove();
        }

        // Yeni font link'ini ekle
        const link = document.createElement('link');
        link.id = 'google-font-link';
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replaceAll(' ', '+')}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);

        // Font'u tüm sayfaya uygula - hem body hem de html root
        const fontFamily = `"${fontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        document.documentElement.style.setProperty('--vz-body-font-family', fontFamily);
        document.body.style.fontFamily = fontFamily;

        // CSS custom property olarak da kaydet
        document.documentElement.style.setProperty('--bs-body-font-family', fontFamily);
    }, []);

    // localStorage'dan renkleri yükle ve CSS'e uygula
    useEffect(() => {
        // LocalStorage kontrolü
        if (!checkLocalStorage()) {
            return;
        }

        try {
            const savedColors = localStorage.getItem('theme-colors');

            if (savedColors) {
                const colors = JSON.parse(savedColors);

                setPrimaryColor(colors.primary || '#405189');
                setSecondaryColor(colors.secondary || '#3577f1');
                setSuccessColor(colors.success || '#0ab39c');
                setDangerColor(colors.danger || '#f06548');
                setWarningColor(colors.warning || '#f7b84b');
                setInfoColor(colors.info || '#299cdb');
                setHeaderColor(colors.header || '#ffffff');

                // Yüklenen renkleri CSS'e uygula
                Object.entries(colors).forEach(([type, color]) => {
                    applyColorToCSS(type, color);
                });
            }
        } catch (error) {
            console.error('Renk yükleme hatası:', error);
        }
    }, []);

    // Google Font yükleme ve uygulama
    useEffect(() => {
        if (!checkLocalStorage()) {
            return;
        }

        try {
            const savedFont = localStorage.getItem('selected-font');
            if (savedFont) {
                setSelectedFont(savedFont);
                loadGoogleFont(savedFont);
            }
        } catch (error) {
            console.error('Font yükleme hatası:', error);
        }
    }, [loadGoogleFont]);

    // Font değiştirme handler
    const handleFontChange = (fontName: string) => {
        setSelectedFont(fontName);
        loadGoogleFont(fontName);

        // localStorage'a kaydet
        try {
            localStorage.setItem('selected-font', fontName);
        } catch (error) {
            console.error('Font kaydetme hatası:', error);
        }
    };

    // Renk değişikliklerini CSS değişkenlerine uygula
    const applyColorToCSS = (colorType: string, color: string) => {
        try {
            const root = document.documentElement;
            const rgbValue = hexToRgb(color);

            // Bootstrap 5 ve Velzon tema CSS değişkenleri
            const cssVariables = {
                primary: [
                    '--vz-primary',
                    '--vz-primary-rgb',
                    '--bs-primary',
                    '--bs-primary-rgb'
                ],
                secondary: [
                    '--vz-secondary',
                    '--vz-secondary-rgb',
                    '--bs-secondary',
                    '--bs-secondary-rgb'
                ],
                success: [
                    '--vz-success',
                    '--vz-success-rgb',
                    '--bs-success',
                    '--bs-success-rgb'
                ],
                danger: [
                    '--vz-danger',
                    '--vz-danger-rgb',
                    '--bs-danger',
                    '--bs-danger-rgb'
                ],
                warning: [
                    '--vz-warning',
                    '--vz-warning-rgb',
                    '--bs-warning',
                    '--bs-warning-rgb'
                ],
                info: [
                    '--vz-info',
                    '--vz-info-rgb',
                    '--bs-info',
                    '--bs-info-rgb'
                ],
                header: [
                    '--vz-header-bg',
                    '--header-bg',
                    '--topbar-bg'
                ]
            };

            // İlgili renk türü için tüm CSS değişkenlerini güncelle
            if (cssVariables[colorType]) {
                cssVariables[colorType].forEach((variable, index) => {
                    if (colorType === 'header') {
                        // Header rengi için özel işlem - sadece renk değeri
                        root.style.setProperty(variable, color);
                    } else if (variable.includes('-rgb')) {
                        root.style.setProperty(variable, rgbValue);
                    } else {
                        root.style.setProperty(variable, color);
                    }
                });
            }

            // Ek olarak, yaygın kullanılan CSS değişkenlerini de güncelle
            const additionalVariables = {
                primary: [
                    '--primary',
                    '--color-primary',
                    '--theme-primary',
                    '--vz-primary-text-emphasis',
                    '--vz-primary-bg-subtle',
                    '--vz-primary-border-subtle'
                ],
                secondary: [
                    '--secondary',
                    '--color-secondary',
                    '--theme-secondary',
                    '--vz-secondary-text-emphasis',
                    '--vz-secondary-bg-subtle',
                    '--vz-secondary-border-subtle'
                ],
                success: [
                    '--success',
                    '--color-success',
                    '--theme-success',
                    '--vz-success-text-emphasis',
                    '--vz-success-bg-subtle',
                    '--vz-success-border-subtle'
                ],
                danger: [
                    '--danger',
                    '--color-danger',
                    '--theme-danger',
                    '--vz-danger-text-emphasis',
                    '--vz-danger-bg-subtle',
                    '--vz-danger-border-subtle'
                ],
                warning: [
                    '--warning',
                    '--color-warning',
                    '--theme-warning',
                    '--vz-warning-text-emphasis',
                    '--vz-warning-bg-subtle',
                    '--vz-warning-border-subtle'
                ],
                info: [
                    '--info',
                    '--color-info',
                    '--theme-info',
                    '--vz-info-text-emphasis',
                    '--vz-info-bg-subtle',
                    '--vz-info-border-subtle'
                ],
                header: [
                    '--header-color',
                    '--topbar-color'
                ]
            };

            if (additionalVariables[colorType]) {
                additionalVariables[colorType].forEach(variable => {
                    // Header rengi için özel işlem
                    if (colorType === 'header') {
                        root.style.setProperty(variable, color);
                    } else {
                        // Emphasis, bg-subtle, ve border-subtle varyasyonlarını hesapla
                        let variableColor = color;
                        if (variable.includes('text-emphasis')) {
                            // %15 daha koyu
                            variableColor = adjustBrightness(color, -0.15);
                        } else if (variable.includes('bg-subtle')) {
                            // %85 daha açık
                            variableColor = adjustBrightness(color, 0.85);
                        } else if (variable.includes('border-subtle')) {
                            // %60 daha açık
                            variableColor = adjustBrightness(color, 0.60);
                        }

                        root.style.setProperty(variable, variableColor);
                    }
                });
            }

            // Renk değişikliğini zorla uygula
            root.style.setProperty('--force-update', Date.now().toString());

            // Body elementine de uygula
            document.body.style.setProperty(`--vz-${colorType}`, color);
            if (colorType !== 'header') {
                document.body.style.setProperty(`--vz-${colorType}-rgb`, rgbValue);
            }

            // Tüm elemanlara refresh signal gönder
            const customEvent = new CustomEvent('themeColorChanged', {
                detail: { colorType, color, rgbValue }
            });
            document.dispatchEvent(customEvent);


        } catch (error) {
            console.error(`CSS renk uygulama hatası (${colorType}):`, error);
        }
    };

    // Hex rengini RGB'ye çevir
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
            '0, 0, 0';
    };

    // Renk parlaklığını ayarla (tint/shade için)
    const adjustBrightness = (hex: string, factor: number) => {
        // Hex'i RGB'ye çevir
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return hex;

        let r = parseInt(result[1], 16);
        let g = parseInt(result[2], 16);
        let b = parseInt(result[3], 16);

        if (factor > 0) {
            // Tint (açıklık) - beyaza doğru karıştır
            r = Math.round(r + (255 - r) * factor);
            g = Math.round(g + (255 - g) * factor);
            b = Math.round(b + (255 - b) * factor);
        } else {
            // Shade (koyuluk) - siyaha doğru karıştır
            const absF = Math.abs(factor);
            r = Math.round(r * (1 - absF));
            g = Math.round(g * (1 - absF));
            b = Math.round(b * (1 - absF));
        }

        // RGB'yi hex'e geri çevir
        const toHex = (num: number) => {
            const hex = Math.max(0, Math.min(255, num)).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    // Renk değişikliği handler'ı
    const handleColorChange = (color: any) => {
        const hexColor = color.hex;
        switch (currentColorType) {
            case 'primary':
                setPrimaryColor(hexColor);
                break;
            case 'secondary':
                setSecondaryColor(hexColor);
                break;
            case 'success':
                setSuccessColor(hexColor);
                break;
            case 'danger':
                setDangerColor(hexColor);
                break;
            case 'warning':
                setWarningColor(hexColor);
                break;
            case 'info':
                setInfoColor(hexColor);
                break;
            case 'header':
                setHeaderColor(hexColor);
                break;
        }
        applyColorToCSS(currentColorType, hexColor);
    };

    // Renkleri localStorage'a kaydet
    const saveColors = () => {
        try {
            // LocalStorage kontrolü
            if (!checkLocalStorage()) {
                alert('LocalStorage desteklenmiyor veya devre dışı.');
                return;
            }

            const colors = {
                primary: primaryColor,
                secondary: secondaryColor,
                success: successColor,
                danger: dangerColor,
                warning: warningColor,
                info: infoColor,
                header: headerColor
            };

            localStorage.setItem('theme-colors', JSON.stringify(colors));

            // Renkleri CSS'e uygula
            Object.entries(colors).forEach(([type, color]) => {
                applyColorToCSS(type, color);
            });

            // Kullanıcıya başarı mesajı göster (toastr yerine basit alert)
            if (typeof window !== 'undefined') {
                const toast = document.createElement('div');
                toast.className = 'position-fixed top-0 end-0 p-3';
                toast.style.zIndex = '9999';
                toast.innerHTML = `
                    <div class="toast show bg-success text-white" role="alert">
                        <div class="toast-body">
                            <i class="ri-check-line me-2"></i>Renkler başarıyla kaydedildi!
                        </div>
                    </div>
                `;
                document.body.appendChild(toast);
                setTimeout(() => document.body.removeChild(toast), 3000);
            }

        } catch (error) {
            console.error('Renk kaydetme hatası:', error);
            alert('Renkler kaydedilirken bir hata oluştu: ' + error.message);
        }
    };

    // Renkleri sıfırla
    const resetColors = () => {
        try {
            const defaultColors = {
                primary: '#405189',   // $indigo
                secondary: '#3577f1', // $blue
                success: '#0ab39c',   // $green
                danger: '#f06548',    // $red
                warning: '#f7b84b',   // $yellow
                info: '#299cdb',      // $cyan
                header: '#ffffff'     // $white
            };


            setPrimaryColor(defaultColors.primary);
            setSecondaryColor(defaultColors.secondary);
            setSuccessColor(defaultColors.success);
            setDangerColor(defaultColors.danger);
            setWarningColor(defaultColors.warning);
            setInfoColor(defaultColors.info);
            setHeaderColor(defaultColors.header);

            localStorage.removeItem('theme-colors');

            // Renkleri CSS'e uygula
            Object.entries(defaultColors).forEach(([type, color]) => {
                applyColorToCSS(type, color);
            });

            // Reset toast mesajı
            if (typeof window !== 'undefined') {
                const toast = document.createElement('div');
                toast.className = 'position-fixed top-0 end-0 p-3';
                toast.style.zIndex = '9999';
                toast.innerHTML = `
                    <div class="toast show bg-info text-white" role="alert">
                        <div class="toast-body">
                            <i class="ri-refresh-line me-2"></i>Renkler varsayılan değerlere sıfırlandı!
                        </div>
                    </div>
                `;
                document.body.appendChild(toast);
                setTimeout(() => document.body.removeChild(toast), 3000);
            }

        } catch (error) {
            console.error('Renk sıfırlama hatası:', error);
            alert('Renkler sıfırlanırken bir hata oluştu.');
        }
    };

    // Renk picker açma/kapama
    const openColorPicker = (colorType: string) => {
        setCurrentColorType(colorType);
        setShowColorPicker(true);
    };

    // Seçilen rengi al
    const getCurrentColor = () => {
        switch (currentColorType) {
            case 'primary': return primaryColor;
            case 'secondary': return secondaryColor;
            case 'success': return successColor;
            case 'danger': return dangerColor;
            case 'warning': return warningColor;
            case 'info': return infoColor;
            case 'header': return headerColor;
            default: return primaryColor;
        }
    };

    function tog_show() {
        setShow(!show);
        dispatch(changeSidebarTheme("gradient"));
    }

    useEffect(() => {
        const sidebarColorDark = document.getElementById("sidebar-color-dark") as HTMLInputElement;
        const sidebarColorLight = document.getElementById("sidebar-color-light") as HTMLInputElement;

        if (show && sidebarColorDark && sidebarColorLight) {
            sidebarColorDark.checked = false;
            sidebarColorLight.checked = false;
        }
    }, [show]);

    const selectRightsidebarState = (state: any) => state.Layout;
    const selectRightsidebarProperties = createSelector(
        selectRightsidebarState,
        (layout: any) => ({
            layoutType: layout.layoutType,
            leftSidebarType: layout.leftSidebarType,
            layoutModeType: layout.layoutModeType,
            layoutWidthType: layout.layoutWidthType,
            layoutPositionType: layout.layoutPositionType,
            topbarThemeType: layout.topbarThemeType,
            leftsidbarSizeType: layout.leftsidbarSizeType,
            leftSidebarViewType: layout.leftSidebarViewType,
            leftSidebarImageType: layout.leftSidebarImageType,
            preloader: layout.preloader,
            sidebarVisibilitytype: layout.sidebarVisibilitytype,
            customizer: layout.customizer,
        })
    );
    // Inside your component
    const {
        layoutType,
        leftSidebarType,
        layoutModeType,
        layoutWidthType,
        layoutPositionType,
        topbarThemeType,
        leftsidbarSizeType,
        leftSidebarViewType,
        leftSidebarImageType,
        preloader,
        sidebarVisibilitytype,
        customizer
    } = useSelector(
        (state: any) => selectRightsidebarProperties(state));

    // open offcanvas
    const [open, setOpen] = useState<boolean>(false);
    const toggleLeftCanvas = () => {
        setOpen(!open);
        // Redux state'ini de güncelle
        dispatch(setCustomizer(!open));
    };

    // customizer state'i değiştiğinde offcanvas'ı aç/kapa
    useEffect(() => {
        setOpen(customizer);
    }, [customizer]);

    window.onscroll = function () {
        scrollFunction();
    };

    const scrollFunction = () => {
        const element = document.getElementById("back-to-top");
        if (element) {
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                element.style.display = "block";
            } else {
                element.style.display = "none";
            }
        }
    };

    const toTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };

    const pathName = window.location.pathname;

    useEffect(() => {
        const preloader = document.getElementById("preloader") as HTMLElement;

        if (preloader) {
            preloader.style.opacity = "1";
            preloader.style.visibility = "visible";

            setTimeout(function () {
                preloader.style.opacity = "0";
                preloader.style.visibility = "hidden";
            }, 1000);
        }
    }, [pathName]);


    return (
        <React.Fragment>
            <button
                onClick={() => toTop()}
                className="btn btn-danger btn-icon" id="back-to-top">
                <i className="ri-arrow-up-line"></i>
            </button>

            {preloader === "enable" && <div id="preloader">
                <div id="status">
                    <div className="spinner-border text-primary avatar-sm" role="status">
                        <span className="visually-hidden">{t('Loading...')}</span>
                    </div>
                </div>
            </div>}

            <div>

                <Offcanvas show={open} onHide={() => dispatch(setCustomizer(false))} placement="end" className='offcanvas-end border-0'>
                    <Offcanvas.Header className="d-flex align-items-center bg-primary bg-gradient p-3 offcanvas-header-dark" closeButton>
                        <span className="m-0 me-2 text-white">{t('Theme Customizer')}</span>
                    </Offcanvas.Header>
                    <Offcanvas.Body className="p-0">
                        <SimpleBar className="h-100">
                            <div className="p-4">
                                <h6 className="mb-0 fw-semibold text-uppercase">{t('Layout')}</h6>
                                <p className="text-muted">{t('Choose your layout')}</p>

                                <div className="row gy-3">
                                    <div className="col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                id="customizer-layout01"
                                                name="data-layout"
                                                type="radio"
                                                value={LAYOUT_TYPES.VERTICAL}
                                                checked={layoutType === LAYOUT_TYPES.VERTICAL}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayout(e.target.value));
                                                    }
                                                }}
                                                className="form-check-input"
                                            />
                                            <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="customizer-layout01">
                                                <span className="d-flex gap-1 h-100">
                                                    <span className="flex-shrink-0">
                                                        <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                            <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-grow-1">
                                                        <span className="d-flex h-100 flex-column">
                                                            <span className="bg-light d-block p-1"></span>
                                                            <span className="bg-light d-block p-1 mt-auto"></span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </Form.Check.Label>
                                        </div>
                                        <h5 className="fs-13 text-center mt-2">{t('Vertical')}</h5>
                                    </div>
                                    <div className="col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                id="customizer-layout02"
                                                name="data-layout"
                                                type="radio"
                                                value={LAYOUT_TYPES.HORIZONTAL}
                                                checked={layoutType === LAYOUT_TYPES.HORIZONTAL}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayout(e.target.value));
                                                    }
                                                }}
                                                className="form-check-input" />
                                            <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="customizer-layout02">
                                                <span className="d-flex h-100 flex-column gap-1">
                                                    <span className="bg-light d-flex p-1 gap-1 align-items-center">
                                                        <span className="d-block p-1 bg-primary-subtle rounded me-1"></span>
                                                        <span className="d-block p-1 pb-0 px-2 bg-primary-subtle ms-auto"></span>
                                                        <span className="d-block p-1 pb-0 px-2 bg-primary-subtle"></span>
                                                    </span>
                                                    <span className="bg-light d-block p-1"></span>
                                                    <span className="bg-light d-block p-1 mt-auto"></span>
                                                </span>
                                            </Form.Check.Label>
                                        </div>
                                        <h5 className="fs-13 text-center mt-2">{t('Horizontal')}</h5>
                                    </div>
                                    <div className="col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                id="customizer-layout03"
                                                name="data-layout"
                                                type="radio"
                                                value={LAYOUT_TYPES.TWOCOLUMN}
                                                checked={layoutType === LAYOUT_TYPES.TWOCOLUMN}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayout(e.target.value));
                                                    }
                                                }}
                                                className="form-check-input" />
                                            <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="customizer-layout03">
                                                <span className="d-flex gap-1 h-100">
                                                    <span className="flex-shrink-0">
                                                        <span className="bg-light d-flex h-100 flex-column gap-1">
                                                            <span className="d-block p-1 bg-primary-subtle mb-2"></span>
                                                            <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-shrink-0">
                                                        <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-grow-1">
                                                        <span className="d-flex h-100 flex-column">
                                                            <span className="bg-light d-block p-1"></span>
                                                            <span className="bg-light d-block p-1 mt-auto"></span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </Form.Check.Label>
                                        </div>
                                        <h5 className="fs-13 text-center mt-2">{t('Two Column')}</h5>
                                    </div>
                                    <div className="col-4">
                                        <div className="form-check card-radio">
                                            <input id="customizer-layout04" name="data-layout" type="radio" className="form-check-input"
                                                value={LAYOUT_TYPES.SEMIBOX}
                                                checked={layoutType === LAYOUT_TYPES.SEMIBOX}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeLayout(e.target.value));
                                                    }
                                                }}
                                            />
                                            <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="customizer-layout04">
                                                <span className="d-flex gap-1 h-100">
                                                    <span className="flex-shrink-0 p-1">
                                                        <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                            <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-grow-1">
                                                        <span className="d-flex h-100 flex-column pt-1 pe-2">
                                                            <span className="bg-light d-block p-1"></span>
                                                            <span className="bg-light d-block p-1 mt-auto"></span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </Form.Check.Label>
                                        </div>
                                        <h5 className="fs-13 text-center mt-2">{t('Semi Box')}</h5>
                                    </div>
                                </div>

                                <h6 className="mt-4 mb-0 fw-semibold text-uppercase">{t('Color Scheme')}</h6>
                                <p className="text-muted">{t('Choose Light or Dark Scheme.')}</p>

                                <div className="colorscheme-cardradio">
                                    <div className="row">
                                        <div className="col-4">
                                            <div className="form-check card-radio">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="data-bs-theme"
                                                    id="layout-mode-light"
                                                    value={LAYOUT_MODE_TYPES.LIGHTMODE}
                                                    checked={layoutModeType === LAYOUT_MODE_TYPES.LIGHTMODE}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changeLayoutMode(e.target.value));
                                                        }
                                                    }}
                                                />
                                                <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="layout-mode-light">
                                                    <span className="d-flex gap-1 h-100">
                                                        <span className="flex-shrink-0">
                                                            <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            </span>
                                                        </span>
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex h-100 flex-column">
                                                                <span className="bg-light d-block p-1"></span>
                                                                <span className="bg-light d-block p-1 mt-auto"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                </Form.Check.Label>
                                            </div>
                                            <h5 className="fs-13 text-center mt-2">{t('Light')}</h5>
                                        </div>

                                        <div className="col-4">
                                            <div className="form-check card-radio dark">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="data-bs-theme"
                                                    id="layout-mode-dark"
                                                    value={LAYOUT_MODE_TYPES.DARKMODE}
                                                    checked={layoutModeType === LAYOUT_MODE_TYPES.DARKMODE}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changeLayoutMode(e.target.value));
                                                        }
                                                    }}
                                                />
                                                <Form.Check.Label className="form-check-label p-0 avatar-md w-100 bg-dark" htmlFor="layout-mode-dark">
                                                    <span className="d-flex gap-1 h-100">
                                                        <span className="flex-shrink-0">
                                                            <span className="bg-white bg-opacity-10 d-flex h-100 flex-column gap-1 p-1">
                                                                <span className="d-block p-1 px-2 bg-white bg-opacity-10 rounded mb-2"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                            </span>
                                                        </span>
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex h-100 flex-column">
                                                                <span className="bg-white bg-opacity-10 d-block p-1"></span>
                                                                <span className="bg-white bg-opacity-10 d-block p-1 mt-auto"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                </Form.Check.Label>
                                            </div>
                                            <h5 className="fs-13 text-center mt-2">{t('Dark')}</h5>
                                        </div>
                                    </div>
                                </div>
                                {layoutType === LAYOUT_TYPES.SEMIBOX && <div id="sidebar-visibility">
                                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">{t('Sidebar Visibility')}</h6>
                                    <p className="text-muted">{t('Choose show or Hidden sidebar')}</p>

                                    <div className="row">
                                        <div className="col-4">
                                            <div className="form-check card-radio">
                                                <input className="form-check-input" type="radio" name="data-sidebar-visibility" id="sidebar-visibility-show"
                                                    value={SIDEBAR_VISIBILITY_TYPES.SHOW}
                                                    checked={sidebarVisibilitytype === SIDEBAR_VISIBILITY_TYPES.SHOW}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changeSidebarVisibility(e.target.value));
                                                        }
                                                    }} />
                                                <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-visibility-show">
                                                    <span className="d-flex gap-1 h-100">
                                                        <span className="flex-shrink-0 p-1">
                                                            <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            </span>
                                                        </span>
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex h-100 flex-column pt-1 pe-2">
                                                                <span className="bg-light d-block p-1"></span>
                                                                <span className="bg-light d-block p-1 mt-auto"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                </Form.Check.Label>
                                            </div>
                                            <h5 className="fs-13 text-center mt-2">{t('Show')}</h5>
                                        </div>
                                        <div className="col-4">
                                            <div className="form-check card-radio">
                                                <input className="form-check-input" type="radio" name="data-sidebar-visibility" id="sidebar-visibility-hidden"
                                                    value={SIDEBAR_VISIBILITY_TYPES.HIDDEN}
                                                    checked={sidebarVisibilitytype === SIDEBAR_VISIBILITY_TYPES.HIDDEN}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changeSidebarVisibility(e.target.value));
                                                        }
                                                    }}
                                                />
                                                <Form.Check.Label className="form-check-label p-0 avatar-md w-100 px-2" htmlFor="sidebar-visibility-hidden">
                                                    <span className="d-flex gap-1 h-100">
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex h-100 flex-column pt-1 px-2">
                                                                <span className="bg-light d-block p-1"></span>
                                                                <span className="bg-light d-block p-1 mt-auto"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                </Form.Check.Label>
                                            </div>
                                            <h5 className="fs-13 text-center mt-2">{t('Hidden')}</h5>
                                        </div>
                                    </div>
                                </div>}
                                {(layoutType !== LAYOUT_TYPES.TWOCOLUMN) && (
                                    <React.Fragment>
                                        {(layoutType === LAYOUT_TYPES.VERTICAL || layoutType === LAYOUT_TYPES.HORIZONTAL) && (<div id="layout-width">
                                            <h6 className="mt-4 mb-0 fw-semibold text-uppercase">{t('Layout Width')}</h6>
                                            <p className="text-muted">{t('Choose Fluid or Boxed layout')}</p>

                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="form-check card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-layout-width"
                                                            id="layout-width-fluid"
                                                            value={LAYOUT_WIDTH_TYPES.FLUID}
                                                            checked={layoutWidthType === LAYOUT_WIDTH_TYPES.FLUID}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLayoutWidth(e.target.value));
                                                                    dispatch(changeLeftsidebarSizeType("lg"));
                                                                }
                                                            }}
                                                        />
                                                        <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="layout-width-fluid">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </Form.Check.Label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">{t('Fluid')}</h5>
                                                </div>
                                                <div className="col-4">
                                                    <div className="form-check card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-layout-width"
                                                            id="layout-width-boxed"
                                                            value={LAYOUT_WIDTH_TYPES.BOXED}
                                                            checked={layoutWidthType === LAYOUT_WIDTH_TYPES.BOXED}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLayoutWidth(e.target.value));
                                                                    dispatch(changeLeftsidebarSizeType("sm-hover"));
                                                                }
                                                            }}
                                                        />
                                                        <Form.Check.Label className="form-check-label p-0 avatar-md w-100 px-2" htmlFor="layout-width-boxed">
                                                            <span className="d-flex gap-1 h-100 border-start border-end">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </Form.Check.Label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">{t('Boxed')}</h5>
                                                </div>
                                            </div>
                                        </div>)}

                                        <div id="layout-position">
                                            <h6 className="mt-4 mb-0 fw-semibold text-uppercase">{t('Layout Position')}</h6>
                                            <p className="text-muted">{t('Choose Fixed or Scrollable Layout Position.')}</p>

                                            <div className="btn-group radio" role="group">
                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="data-layout-position"
                                                    id="layout-position-fixed"
                                                    value={LAYOUT_POSITION_TYPES.FIXED}
                                                    checked={layoutPositionType === LAYOUT_POSITION_TYPES.FIXED}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changeLayoutPosition(e.target.value));
                                                        }
                                                    }}
                                                />
                                                <Form.Check.Label className="btn btn-light w-sm" htmlFor="layout-position-fixed">{t('Fixed')}</Form.Check.Label>

                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="data-layout-position"
                                                    id="layout-position-scrollable"
                                                    value={LAYOUT_POSITION_TYPES.SCROLLABLE}
                                                    checked={layoutPositionType === LAYOUT_POSITION_TYPES.SCROLLABLE}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changeLayoutPosition(e.target.value));
                                                        }
                                                    }}
                                                />
                                                <Form.Check.Label className="btn btn-light w-sm ms-0" htmlFor="layout-position-scrollable">{t('Scrollable')}</Form.Check.Label>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                )}

                                <h6 className="mt-4 mb-0 fw-semibold text-uppercase">{t('Topbar Color')}</h6>
                                <p className="text-muted">{t('Choose Light or Dark Topbar Color.')}</p>

                                <div className="row">
                                    <div className="col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="data-topbar"
                                                id="topbar-color-light"
                                                value={LAYOUT_TOPBAR_THEME_TYPES.LIGHT}
                                                checked={topbarThemeType === LAYOUT_TOPBAR_THEME_TYPES.LIGHT}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeTopbarTheme(e.target.value));
                                                    }
                                                }}
                                            />
                                            <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="topbar-color-light">
                                                <span className="d-flex gap-1 h-100">
                                                    <span className="flex-shrink-0">
                                                        <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                            <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-grow-1">
                                                        <span className="d-flex h-100 flex-column">
                                                            <span className="bg-light d-block p-1"></span>
                                                            <span className="bg-light d-block p-1 mt-auto"></span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </Form.Check.Label>
                                        </div>
                                        <h5 className="fs-13 text-center mt-2">{t('Light')}</h5>
                                    </div>
                                    <div className="col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="data-topbar"
                                                id="topbar-color-dark"
                                                value={LAYOUT_TOPBAR_THEME_TYPES.DARK}
                                                checked={topbarThemeType === LAYOUT_TOPBAR_THEME_TYPES.DARK}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        dispatch(changeTopbarTheme(e.target.value));
                                                    }
                                                }}
                                            />
                                            <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="topbar-color-dark">
                                                <span className="d-flex gap-1 h-100">
                                                    <span className="flex-shrink-0">
                                                        <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                            <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-grow-1">
                                                        <span className="d-flex h-100 flex-column">
                                                            <span className="bg-primary d-block p-1"></span>
                                                            <span className="bg-light d-block p-1 mt-auto"></span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </Form.Check.Label>
                                        </div>
                                        <h5 className="fs-13 text-center mt-2">{t('Dark')}</h5>
                                    </div>
                                </div>

                                {(layoutType === "vertical" || (layoutType === "semibox" && sidebarVisibilitytype === "show")) && (
                                    <React.Fragment>

                                        <div id="sidebar-size">
                                            <h6 className="mt-4 mb-0 fw-semibold text-uppercase">{t('Sidebar Size')}</h6>
                                            <p className="text-muted">{t('Choose a size of Sidebar.')}</p>

                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar-size"
                                                            id="sidebar-size-default"
                                                            value={LEFT_SIDEBAR_SIZE_TYPES.DEFAULT}
                                                            checked={leftsidbarSizeType === LEFT_SIDEBAR_SIZE_TYPES.DEFAULT}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLeftsidebarSizeType(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-size-default">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </Form.Check.Label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">{t('Default')}</h5>
                                                </div>

                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar-size"
                                                            id="sidebar-size-compact"
                                                            value={LEFT_SIDEBAR_SIZE_TYPES.COMPACT}
                                                            checked={leftsidbarSizeType === LEFT_SIDEBAR_SIZE_TYPES.COMPACT}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLeftsidebarSizeType(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-size-compact">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 bg-primary-subtle rounded mb-2"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </Form.Check.Label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">{t('Compact')}</h5>
                                                </div>

                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar-size"
                                                            id="sidebar-size-small"
                                                            value={LEFT_SIDEBAR_SIZE_TYPES.SMALLICON}
                                                            checked={leftsidbarSizeType === LEFT_SIDEBAR_SIZE_TYPES.SMALLICON}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLeftsidebarSizeType(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-size-small">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1">
                                                                        <span className="d-block p-1 bg-primary-subtle mb-2"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </Form.Check.Label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">{t('Small (Icon View)')}</h5>
                                                </div>

                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar-size"
                                                            id="sidebar-size-small-hover"
                                                            value={LEFT_SIDEBAR_SIZE_TYPES.SMALLHOVER}
                                                            checked={leftsidbarSizeType === LEFT_SIDEBAR_SIZE_TYPES.SMALLHOVER}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLeftsidebarSizeType(e.target.value));
                                                                }
                                                            }}

                                                        />
                                                        <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-size-small-hover">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1">
                                                                        <span className="d-block p-1 bg-primary-subtle mb-2"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </Form.Check.Label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">{t('Small Hover View')}</h5>
                                                </div>
                                            </div>
                                        </div>

                                        {layoutType !== "semibox" && (<div id="sidebar-view">
                                            <h6 className="mt-4 mb-0 fw-semibold text-uppercase">{t('Sidebar View')}</h6>
                                            <p className="text-muted">{t('Choose Default or Detached Sidebar view.')}</p>

                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-layout-style"
                                                            id="sidebar-view-default"
                                                            value={LEFT_SIDEBAR_VIEW_TYPES.DEFAULT}
                                                            checked={leftSidebarViewType === LEFT_SIDEBAR_VIEW_TYPES.DEFAULT}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLeftsidebarViewType(e.target.value));
                                                                }
                                                            }}

                                                        />
                                                        <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-view-default">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </Form.Check.Label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">{t('Default')}</h5>
                                                </div>
                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-layout-style"
                                                            id="sidebar-view-detached"
                                                            value={LEFT_SIDEBAR_VIEW_TYPES.DETACHED}
                                                            checked={leftSidebarViewType === LEFT_SIDEBAR_VIEW_TYPES.DETACHED}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    dispatch(changeLeftsidebarViewType(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-view-detached">
                                                            <span className="d-flex h-100 flex-column">
                                                                <span className="bg-light d-flex p-1 gap-1 align-items-center px-2">
                                                                    <span className="d-block p-1 bg-primary-subtle rounded me-1"></span>
                                                                    <span className="d-block p-1 pb-0 px-2 bg-primary-subtle ms-auto"></span>
                                                                    <span className="d-block p-1 pb-0 px-2 bg-primary-subtle"></span>
                                                                </span>
                                                                <span className="d-flex gap-1 h-100 p-1 px-2">
                                                                    <span className="flex-shrink-0">
                                                                        <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                            <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        </span>
                                                                    </span>
                                                                </span>
                                                                <span className="bg-light d-block p-1 mt-auto px-2"></span>
                                                            </span>
                                                        </Form.Check.Label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">{t('Detached')}</h5>
                                                </div>
                                            </div>
                                        </div>)}
                                    </React.Fragment>
                                )}

                                {(layoutType === "vertical" || layoutType === "twocolumn" || (layoutType === "semibox" && sidebarVisibilitytype === "show")) && (
                                    <React.Fragment>
                                        <div id="sidebar-color">
                                            <h6 className="mt-4 mb-0 fw-semibold text-uppercase">{t('Sidebar Color')}</h6>
                                            <p className="text-muted">{t('Choose Ligth or Dark Sidebar Color.')}</p>

                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar"
                                                            id="sidebar-color-light"
                                                            value={LAYOUT_SIDEBAR_TYPES.LIGHT}
                                                            checked={leftSidebarType === LAYOUT_SIDEBAR_TYPES.LIGHT}
                                                            onChange={e => {
                                                                setShow(false);
                                                                if (e.target.checked) {
                                                                    dispatch(changeSidebarTheme(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-color-light">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-white border-end d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </Form.Check.Label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">{t('Light')}</h5>
                                                </div>
                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar"
                                                            id="sidebar-color-dark"
                                                            value={LAYOUT_SIDEBAR_TYPES.DARK}
                                                            checked={leftSidebarType === LAYOUT_SIDEBAR_TYPES.DARK}
                                                            onChange={e => {
                                                                setShow(false);
                                                                if (e.target.checked) {
                                                                    dispatch(changeSidebarTheme(e.target.value));
                                                                }
                                                            }}
                                                        />
                                                        <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-color-dark">
                                                            <span className="d-flex gap-1 h-100">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-primary d-flex h-100 flex-column gap-1 p-1">
                                                                        <span className="d-block p-1 px-2 bg-white bg-opacity-10 rounded mb-2"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                        <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex h-100 flex-column">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block p-1 mt-auto"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </Form.Check.Label>
                                                    </div>
                                                    <h5 className="fs-13 text-center mt-2">{t('Dark')}</h5>
                                                </div>

                                                <div className="col-4">
                                                    <button
                                                        className={classnames(
                                                            "btn btn-link avatar-md w-100 p-0 overflow-hidden border ",
                                                            { collapsed: !show, active: show === true }
                                                        )}
                                                        type="button"
                                                        data-bs-target="#collapseBgGradient"
                                                        data-bs-toggle="collapse"
                                                        aria-controls="collapseBgGradient"
                                                        onClick={tog_show}
                                                    >
                                                        <span className="d-flex gap-1 h-100">
                                                            <span className="flex-shrink-0">
                                                                <span className="bg-vertical-gradient d-flex h-100 flex-column gap-1 p-1">
                                                                    <span className="d-block p-1 px-2 bg-white bg-opacity-10 rounded mb-2"></span>
                                                                    <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                    <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                    <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10"></span>
                                                                </span>
                                                            </span>
                                                            <span className="flex-grow-1">
                                                                <span className="d-flex h-100 flex-column">
                                                                    <span className="bg-light d-block p-1"></span>
                                                                    <span className="bg-light d-block p-1 mt-auto"></span>
                                                                </span>
                                                            </span>
                                                        </span>
                                                    </button>
                                                    <h5 className="fs-13 text-center mt-2">{t('Gradient')}</h5>
                                                </div>
                                            </div>
                                            <Collapse
                                                in={show}
                                                className="collapse"
                                            >
                                                <div id="collapseBgGradient">
                                                    <div className="d-flex gap-2 flex-wrap img-switch p-2 px-3 bg-light rounded">
                                                        <div className="form-check sidebar-setting card-radio">
                                                            <input className="form-check-input"
                                                                type="radio"
                                                                name="data-sidebar"
                                                                id="sidebar-color-gradient"
                                                                value={LAYOUT_SIDEBAR_TYPES.GRADIENT}
                                                                checked={leftSidebarType === LAYOUT_SIDEBAR_TYPES.GRADIENT}
                                                                onChange={e => {
                                                                    if (e.target.checked) {
                                                                        dispatch(changeSidebarTheme(e.target.value));
                                                                    }
                                                                }}
                                                            />
                                                            <Form.Check.Label className="form-check-label p-0 avatar-xs rounded-circle" htmlFor="sidebar-color-gradient">
                                                                <span className="avatar-title rounded-circle bg-vertical-gradient"></span>
                                                            </Form.Check.Label>
                                                        </div>
                                                        <div className="form-check sidebar-setting card-radio">
                                                            <input className="form-check-input"
                                                                type="radio"
                                                                name="data-sidebar"
                                                                id="sidebar-color-gradient-2"
                                                                value={LAYOUT_SIDEBAR_TYPES.GRADIENT_2}
                                                                checked={leftSidebarType === LAYOUT_SIDEBAR_TYPES.GRADIENT_2}
                                                                onChange={e => {
                                                                    if (e.target.checked) {
                                                                        dispatch(changeSidebarTheme(e.target.value));
                                                                    }
                                                                }}
                                                            />
                                                            <Form.Check.Label className="form-check-label p-0 avatar-xs rounded-circle" htmlFor="sidebar-color-gradient-2">
                                                                <span className="avatar-title rounded-circle bg-vertical-gradient-2"></span>
                                                            </Form.Check.Label>
                                                        </div>
                                                        <div className="form-check sidebar-setting card-radio">
                                                            <input className="form-check-input"
                                                                type="radio"
                                                                name="data-sidebar"
                                                                id="sidebar-color-gradient-3"
                                                                value={LAYOUT_SIDEBAR_TYPES.GRADIENT_3}
                                                                checked={leftSidebarType === LAYOUT_SIDEBAR_TYPES.GRADIENT_3}
                                                                onChange={e => {
                                                                    if (e.target.checked) {
                                                                        dispatch(changeSidebarTheme(e.target.value));
                                                                    }
                                                                }}
                                                            />
                                                            <Form.Check.Label className="form-check-label p-0 avatar-xs rounded-circle" htmlFor="sidebar-color-gradient-3">
                                                                <span className="avatar-title rounded-circle bg-vertical-gradient-3"></span>
                                                            </Form.Check.Label>
                                                        </div>
                                                        <div className="form-check sidebar-setting card-radio">
                                                            <input className="form-check-input"
                                                                type="radio"
                                                                name="data-sidebar"
                                                                id="sidebar-color-gradient-4"
                                                                value={LAYOUT_SIDEBAR_TYPES.GRADIENT_4}
                                                                checked={leftSidebarType === LAYOUT_SIDEBAR_TYPES.GRADIENT_4}
                                                                onChange={e => {
                                                                    if (e.target.checked) {
                                                                        dispatch(changeSidebarTheme(e.target.value));
                                                                    }
                                                                }}
                                                            />
                                                            <Form.Check.Label className="form-check-label p-0 avatar-xs rounded-circle" htmlFor="sidebar-color-gradient-4">
                                                                <span className="avatar-title rounded-circle bg-vertical-gradient-4"></span>
                                                            </Form.Check.Label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Collapse>
                                        </div>
                                        <div id="sidebar-img">
                                            <h6 className="mt-4 mb-0 fw-semibold text-uppercase">{t('Sidebar Images')}</h6>
                                            <p className="text-muted">{t('Choose a image of Sidebar.')}</p>

                                            <div className="d-flex gap-2 flex-wrap img-switch">
                                                <div className="form-check sidebar-setting card-radio">
                                                    <input className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-none"
                                                        value={LEFT_SIDEBAR_IMAGE_TYPES.NONE}
                                                        checked={leftSidebarImageType === LEFT_SIDEBAR_IMAGE_TYPES.NONE}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                dispatch(changeSidebarImageType(e.target.value));
                                                            }
                                                        }}
                                                    />
                                                    <Form.Check.Label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-none">
                                                        <span className="avatar-md w-auto bg-light d-flex align-items-center justify-content-center">
                                                            <i className="ri-close-fill fs-20"></i>
                                                        </span>
                                                    </Form.Check.Label>
                                                </div>

                                                <div className="form-check sidebar-setting card-radio">
                                                    <input className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-01"
                                                        value={LEFT_SIDEBAR_IMAGE_TYPES.IMG1}
                                                        checked={leftSidebarImageType === LEFT_SIDEBAR_IMAGE_TYPES.IMG1}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                dispatch(changeSidebarImageType(e.target.value));
                                                            }
                                                        }}
                                                    />
                                                    <Form.Check.Label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-01">
                                                        <img src={img01} alt="" className="avatar-md w-auto object-fit-cover" />
                                                    </Form.Check.Label>

                                                </div>

                                                <div className="form-check sidebar-setting card-radio">
                                                    <input className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-02"
                                                        value={LEFT_SIDEBAR_IMAGE_TYPES.IMG2}
                                                        checked={leftSidebarImageType === LEFT_SIDEBAR_IMAGE_TYPES.IMG2}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                dispatch(changeSidebarImageType(e.target.value));
                                                            }
                                                        }}
                                                    />
                                                    <Form.Check.Label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-02">
                                                        <img src={img02} alt="" className="avatar-md w-auto object-fit-cover" />
                                                    </Form.Check.Label>
                                                </div>
                                                <div className="form-check sidebar-setting card-radio">
                                                    <input className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-03"
                                                        value={LEFT_SIDEBAR_IMAGE_TYPES.IMG3}
                                                        checked={leftSidebarImageType === LEFT_SIDEBAR_IMAGE_TYPES.IMG3}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                dispatch(changeSidebarImageType(e.target.value));
                                                            }
                                                        }}
                                                    />
                                                    <Form.Check.Label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-03">
                                                        <img src={img03} alt="" className="avatar-md w-auto object-fit-cover" />
                                                    </Form.Check.Label>
                                                </div>
                                                <div className="form-check sidebar-setting card-radio">
                                                    <input className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-04"
                                                        value={LEFT_SIDEBAR_IMAGE_TYPES.IMG4}
                                                        checked={leftSidebarImageType === LEFT_SIDEBAR_IMAGE_TYPES.IMG4}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                dispatch(changeSidebarImageType(e.target.value));
                                                            }
                                                        }}
                                                    />
                                                    <Form.Check.Label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-04">
                                                        <img src={img04} alt="" className="avatar-md w-auto object-fit-cover" />
                                                    </Form.Check.Label>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                )}

                                <div id="preloader-menu">
                                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">{t('Preloader')}</h6>
                                    <p className="text-muted">{t('Choose a preloader.')}</p>

                                    <div className="row">
                                        <div className="col-4">
                                            <div className="form-check sidebar-setting card-radio">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="data-preloader"
                                                    id="preloader-view-custom"
                                                    value={PERLOADER_TYPES.ENABLE}
                                                    checked={preloader === PERLOADER_TYPES.ENABLE}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changePreLoader(e.target.value));
                                                        }
                                                    }}
                                                />

                                                <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="preloader-view-custom">
                                                    <span className="d-flex gap-1 h-100">
                                                        <span className="flex-shrink-0">
                                                            <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            </span>
                                                        </span>
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex h-100 flex-column">
                                                                <span className="bg-light d-block p-1"></span>
                                                                <span className="bg-light d-block p-1 mt-auto"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                    {/* <!-- <div id="preloader"> --> */}
                                                    <div id="status" className="d-flex align-items-center justify-content-center">
                                                        <div className="spinner-border text-primary avatar-xxs m-auto" role="status">
                                                            <span className="visually-hidden">{t('Loading...')}</span>
                                                        </div>
                                                    </div>
                                                    {/* <!-- </div> --> */}
                                                </Form.Check.Label>
                                            </div>
                                            <h5 className="fs-13 text-center mt-2">{t('Enable')}</h5>
                                        </div>
                                        <div className="col-4">
                                            <div className="form-check sidebar-setting card-radio">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="data-preloader"
                                                    id="preloader-view-none"
                                                    value={PERLOADER_TYPES.DISABLE}
                                                    checked={preloader === PERLOADER_TYPES.DISABLE}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            dispatch(changePreLoader(e.target.value));
                                                        }
                                                    }}
                                                />
                                                <Form.Check.Label className="form-check-label p-0 avatar-md w-100" htmlFor="preloader-view-none">
                                                    <span className="d-flex gap-1 h-100">
                                                        <span className="flex-shrink-0">
                                                            <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                                                <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle"></span>
                                                            </span>
                                                        </span>
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex h-100 flex-column">
                                                                <span className="bg-light d-block p-1"></span>
                                                                <span className="bg-light d-block p-1 mt-auto"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                </Form.Check.Label>
                                            </div>
                                            <h5 className="fs-13 text-center mt-2">{t('Disable')}</h5>
                                        </div>
                                    </div>
                                </div>

                                {/* Renk Özelleştirme Bölümü */}
                                <div id="color-customization">
                                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">{t('Theme Colors')}</h6>
                                    <p className="text-muted">{t('Customize theme colors.')}</p>

                                    <div className="row g-3">
                                        <div className="col-6">
                                            <div
                                                className="form-check card-radio h-auto"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => openColorPicker('primary')}
                                            >
                                                <div className="card-body p-2">
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="avatar-xs rounded me-2"
                                                            style={{ backgroundColor: primaryColor }}
                                                        ></div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-0 fs-12">{t('Primary')}</h6>
                                                            <small className="text-muted">{primaryColor}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div
                                                className="form-check card-radio h-auto"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => openColorPicker('secondary')}
                                            >
                                                <div className="card-body p-2">
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="avatar-xs rounded me-2"
                                                            style={{ backgroundColor: secondaryColor }}
                                                        ></div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-0 fs-12">{t('Secondary')}</h6>
                                                            <small className="text-muted">{secondaryColor}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div
                                                className="form-check card-radio h-auto"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => openColorPicker('success')}
                                            >
                                                <div className="card-body p-2">
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="avatar-xs rounded me-2"
                                                            style={{ backgroundColor: successColor }}
                                                        ></div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-0 fs-12">{t('Success')}</h6>
                                                            <small className="text-muted">{successColor}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div
                                                className="form-check card-radio h-auto"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => openColorPicker('danger')}
                                            >
                                                <div className="card-body p-2">
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="avatar-xs rounded me-2"
                                                            style={{ backgroundColor: dangerColor }}
                                                        ></div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-0 fs-12">{t('Danger')}</h6>
                                                            <small className="text-muted">{dangerColor}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div
                                                className="form-check card-radio h-auto"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => openColorPicker('warning')}
                                            >
                                                <div className="card-body p-2">
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="avatar-xs rounded me-2"
                                                            style={{ backgroundColor: warningColor }}
                                                        ></div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-0 fs-12">{t('Warning')}</h6>
                                                            <small className="text-muted">{warningColor}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div
                                                className="form-check card-radio h-auto"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => openColorPicker('info')}
                                            >
                                                <div className="card-body p-2">
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="avatar-xs rounded me-2"
                                                            style={{ backgroundColor: infoColor }}
                                                        ></div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-0 fs-12">{t('Info')}</h6>
                                                            <small className="text-muted">{infoColor}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div
                                                className="form-check card-radio h-auto"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => openColorPicker('header')}
                                            >
                                                <div className="card-body p-2">
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="avatar-xs rounded me-2"
                                                            style={{ backgroundColor: headerColor }}
                                                        ></div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-0 fs-12">{t('Header')}</h6>
                                                            <small className="text-muted">{headerColor}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Renk Picker Modal */}
                                    {showColorPicker && (
                                        <div
                                            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                                            style={{
                                                backgroundColor: 'rgba(0,0,0,0.5)',
                                                zIndex: 9999
                                            }}
                                            onClick={() => setShowColorPicker(false)}
                                        >
                                            <div
                                                className="bg-white p-3 rounded shadow"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h6 className="mb-0">{t('Choose Color')}</h6>
                                                    <button
                                                        type="button"
                                                        className="btn-close"
                                                        onClick={() => setShowColorPicker(false)}
                                                    ></button>
                                                </div>
                                                <ChromePicker
                                                    color={getCurrentColor()}
                                                    onChange={handleColorChange}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-3 d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm flex-fill"
                                            onClick={saveColors}
                                        >
                                            {t('Save Colors')}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm flex-fill"
                                            onClick={resetColors}
                                        >
                                            {t('Reset')}
                                        </button>
                                    </div>

                                </div>

                                {/* Font Özelleştirme Bölümü */}
                                <div id="font-customization">
                                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">{t('Font Family')}</h6>
                                    <p className="text-muted">{t('Choose a Google Font for the application.')}</p>

                                    <div className="row g-2">
                                        {googleFonts.map((font) => (
                                            <div key={font} className="col-6">
                                                <div
                                                    className={`form-check card-radio h-auto ${selectedFont === font ? 'border-primary' : ''}`}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleFontChange(font)}
                                                >
                                                    <div className="card-body p-2">
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-grow-1">
                                                                <h6
                                                                    className="mb-0 fs-12"
                                                                    style={{ fontFamily: `"${font}", sans-serif` }}
                                                                >
                                                                    {font}
                                                                </h6>
                                                                <small
                                                                    className="text-muted"
                                                                    style={{ fontFamily: `"${font}", sans-serif` }}
                                                                >
                                                                    Aa Bb Cc 123
                                                                </small>
                                                            </div>
                                                            {selectedFont === font && (
                                                                <i className="ri-check-line text-primary fs-16"></i>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </SimpleBar>

                    </Offcanvas.Body>

                </Offcanvas>
            </div>
        </React.Fragment>
    );
};

export default RightSidebar;
