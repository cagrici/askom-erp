import React, { useState, useEffect, useRef } from 'react';
import { Form, InputGroup, Button, Dropdown, ListGroup } from 'react-bootstrap';

interface Option {
    value: string;
    label: string;
    searchText?: string;
}

interface StaticSearchableSelectProps {
    options: Option[];
    value: string | null;
    onChange: (value: string) => void;
    placeholder?: string;
    isInvalid?: boolean;
    name?: string;
    disabled?: boolean;
    clearable?: boolean;
    className?: string;
    emptyMessage?: string;
}

export default function StaticSearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Arama yapın...",
    isInvalid = false,
    name,
    disabled = false,
    clearable = true,
    className = "",
    emptyMessage = "Sonuç bulunamadı"
}: StaticSearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [displayText, setDisplayText] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Update display text when value changes
    useEffect(() => {
        if (value) {
            const selectedOption = options.find(opt => opt.value === value);
            setDisplayText(selectedOption ? selectedOption.label : '');
        } else {
            setDisplayText('');
        }
    }, [value, options]);

    // Filter options based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredOptions(options);
        } else {
            const filtered = options.filter(option => {
                const searchIn = option.searchText || option.label;
                return searchIn.toLowerCase().includes(searchTerm.toLowerCase());
            });
            setFilteredOptions(filtered);
        }
    }, [searchTerm, options]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleInputFocus = () => {
        if (!disabled) {
            setIsOpen(true);
            setSearchTerm(displayText);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (!isOpen) {
            setIsOpen(true);
        }
    };

    const handleOptionSelect = (option: Option) => {
        onChange(option.value);
        setDisplayText(option.label);
        setSearchTerm('');
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleClear = () => {
        onChange('');
        setDisplayText('');
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
            inputRef.current?.blur();
        } else if (e.key === 'ArrowDown' && filteredOptions.length > 0) {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
            }
        } else if (e.key === 'Enter' && filteredOptions.length === 1) {
            e.preventDefault();
            handleOptionSelect(filteredOptions[0]);
        }
    };

    return (
        <div className={`position-relative ${className}`} ref={dropdownRef}>
            <InputGroup>
                <Form.Control
                    ref={inputRef}
                    type="text"
                    value={isOpen ? searchTerm : displayText}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    isInvalid={isInvalid}
                    disabled={disabled}
                    name={name}
                    autoComplete="off"
                />
                {clearable && value && (
                    <Button
                        variant="outline-secondary"
                        onClick={handleClear}
                        disabled={disabled}
                        size="sm"
                        style={{ borderLeft: 'none' }}
                    >
                        ×
                    </Button>
                )}
            </InputGroup>

            {isOpen && (
                <div 
                    className="position-absolute w-100 bg-white border rounded shadow-sm"
                    style={{ 
                        top: '100%', 
                        zIndex: 1000,
                        maxHeight: '300px',
                        overflowY: 'auto'
                    }}
                >
                    {filteredOptions.length > 0 ? (
                        <ListGroup variant="flush">
                            {filteredOptions.map((option) => (
                                <ListGroup.Item
                                    key={option.value}
                                    action
                                    onClick={() => handleOptionSelect(option)}
                                    className={`cursor-pointer ${value === option.value ? 'active' : ''}`}
                                    style={{ 
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        padding: '8px 12px'
                                    }}
                                >
                                    {option.label}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    ) : (
                        <div className="p-3 text-muted text-center">
                            {emptyMessage}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}