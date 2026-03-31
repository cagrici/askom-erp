import React, { useState, useEffect, useRef } from 'react';
import { Form, InputGroup, Button, Dropdown, ListGroup, Spinner } from 'react-bootstrap';
import axios from 'axios';

interface Option {
    id: number;
    title?: string;
    name?: string;
    account_code?: string;
    account_type?: string;
    logo_code?: string;
    department?: string;
    current_balance?: number;
    currency?: string;
    [key: string]: any;
}

interface SearchableSelectProps {
    value: number | string | null;
    onChange: (value: number | null) => void;
    searchUrl: string;
    searchParams?: Record<string, any>;
    placeholder?: string;
    isInvalid?: boolean;
    name?: string;
    disabled?: boolean;
    onCreateNew?: () => void;
    createButtonText?: string;
    showCreateButton?: boolean;
    clearable?: boolean;
    displayFormat?: (option: Option) => string;
    className?: string;
    initialDisplayText?: string;
    minSearchLength?: number;
}

export default function SearchableSelect({
    value,
    onChange,
    searchUrl,
    searchParams = {},
    placeholder = "Arama yapın...",
    isInvalid = false,
    name,
    disabled = false,
    onCreateNew,
    createButtonText = "Yeni Ekle",
    showCreateButton = false,
    clearable = true,
    displayFormat,
    className = "",
    initialDisplayText,
    minSearchLength = 2
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState<Option[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState<Option | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Format display text for an option
    const formatDisplayText = (option: Option): string => {
        if (displayFormat) {
            return displayFormat(option);
        }

        const displayName = option.title || option.name || '';

        if (option.account_code) {
            return `${displayName} (${option.account_code})`;
        }

        return displayName;
    };

    // Search for options
    const searchOptions = async (query: string) => {
        if (query.length < minSearchLength) {
            setOptions([]);
            return;
        }

        setLoading(true);
        try {
            const response = await axios.get(searchUrl, {
                params: {
                    q: query,
                    ...searchParams
                },
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            setOptions(response.data || []);
        } catch (error) {
            console.error('Search error:', error);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search
    useEffect(() => {
        if (!isOpen) return;

        const timeoutId = setTimeout(() => {
            searchOptions(searchTerm);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, isOpen, searchUrl]);

    // Handle option selection
    const handleOptionSelect = (option: Option) => {
        setSelectedOption(option);
        setSearchTerm(formatDisplayText(option));
        onChange(option.id);
        setIsOpen(false);
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        
        if (!isOpen) {
            setIsOpen(true);
        }

        // If input is cleared, clear the selection
        if (newValue === '' && clearable) {
            setSelectedOption(null);
            onChange(null);
        }
    };

    // Handle input focus
    const handleInputFocus = () => {
        setIsOpen(true);
        if (searchTerm.length >= minSearchLength) {
            searchOptions(searchTerm);
        } else if (minSearchLength === 0) {
            // If minSearchLength is 0, search immediately on focus
            searchOptions('');
        }
    };

    // Handle clear selection
    const handleClear = () => {
        setSelectedOption(null);
        setSearchTerm('');
        onChange(null);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    // Handle create new
    const handleCreateNew = () => {
        setIsOpen(false);
        if (onCreateNew) {
            onCreateNew();
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initialize with selected value
    useEffect(() => {
        if (value && !selectedOption) {
            // If we have a value but no selected option, use initialDisplayText or value
            const displayText = initialDisplayText || value.toString();
            setSearchTerm(displayText);
        } else if (!value) {
            setSelectedOption(null);
            setSearchTerm('');
        }
    }, [value, initialDisplayText]);

    return (
        <div className={`position-relative ${className}`} ref={dropdownRef}>
            <InputGroup>
                <Form.Control
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={placeholder}
                    isInvalid={isInvalid}
                    disabled={disabled}
                    name={name}
                    autoComplete="off"
                />
                
                {selectedOption && clearable && (
                    <Button
                        variant="outline-secondary"
                        onClick={handleClear}
                        disabled={disabled}
                        title="Temizle"
                    >
                        <i className="ri-close-line"></i>
                    </Button>
                )}
                
                {showCreateButton && onCreateNew && (
                    <Button
                        variant="outline-primary"
                        onClick={handleCreateNew}
                        disabled={disabled}
                        title={createButtonText}
                    >
                        <i className="ri-add-line"></i>
                    </Button>
                )}
            </InputGroup>

            {/* Dropdown menu */}
            {isOpen && !disabled && (
                <div 
                    className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" 
                    style={{ zIndex: 9999, maxHeight: '300px', overflowY: 'auto' }}
                >
                    {loading ? (
                        <div className="text-center p-3">
                            <Spinner animation="border" size="sm" className="me-2" />
                            Aranıyor...
                        </div>
                    ) : options.length > 0 ? (
                        <ListGroup variant="flush">
                            {options.map((option) => (
                                <ListGroup.Item
                                    key={option.id}
                                    action
                                    onClick={() => handleOptionSelect(option)}
                                    className="d-flex justify-content-between align-items-center py-2"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div>
                                        <div className="fw-medium">{option.title || option.name}</div>
                                        {option.account_code && (
                                            <small className="text-muted">Kod: {option.account_code}</small>
                                        )}
                                        {option.logo_code && !option.account_code && (
                                            <small className="text-muted">Kod: {option.logo_code}</small>
                                        )}
                                        {option.department && (
                                            <small className="text-muted ms-2">{option.department}</small>
                                        )}
                                    </div>
                                    <div className="text-end ms-2">
                                        {option.current_balance != null && option.current_balance !== 0 && (
                                            <small className={`fw-medium ${Number(option.current_balance) > 0 ? 'text-danger' : 'text-success'}`}>
                                                {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(Number(option.current_balance)))}
                                                {' '}{option.currency || '₺'}
                                                {' '}{Number(option.current_balance) > 0 ? '(B)' : '(A)'}
                                            </small>
                                        )}
                                        {option.account_type && (
                                            <div>
                                                <small className="badge bg-light text-dark">
                                                    {option.account_type === 'supplier' ? 'Tedarikçi' :
                                                     option.account_type === 'customer' ? 'Müşteri' :
                                                     option.account_type === 'both' ? 'Müşteri/Tedarikçi' :
                                                     option.account_type}
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    ) : searchTerm.length >= minSearchLength ? (
                        <div className="text-center p-3 text-muted">
                            <i className="ri-search-line me-2"></i>
                            Sonuç bulunamadı
                            {showCreateButton && onCreateNew && (
                                <div className="mt-2">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={handleCreateNew}
                                    >
                                        <i className="ri-add-line me-1"></i>
                                        {createButtonText}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : minSearchLength > 0 ? (
                        <div className="text-center p-3 text-muted">
                            <i className="ri-search-line me-2"></i>
                            Arama yapmak için en az {minSearchLength} karakter girin
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}