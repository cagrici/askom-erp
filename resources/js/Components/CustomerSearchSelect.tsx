import React, { useState, useEffect, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import { components, GroupBase, OptionProps, GroupHeadingProps } from 'react-select';
import axios from 'axios';

interface Customer {
    id: number;
    title: string;
    account_code?: string;
}

interface CustomerOption {
    value: number;
    label: string;
    customer: Customer;
}

interface GroupedOption {
    label: string;
    options: CustomerOption[];
}

interface CustomerSearchSelectProps {
    value: number | string | null;
    onChange: (customerId: number | null) => void;
    placeholder?: string;
    isInvalid?: boolean;
    disabled?: boolean;
    isClearable?: boolean;
    className?: string;
    initialCustomer?: Customer | null;
}

// Custom option component to show account code
const CustomOption = (props: OptionProps<CustomerOption, false, GroupedOption>) => {
    const { data } = props;
    return (
        <components.Option {...props}>
            <div className="d-flex justify-content-between align-items-center">
                <span>{data.customer.title}</span>
                {data.customer.account_code && (
                    <small className="text-muted ms-2">
                        {data.customer.account_code}
                    </small>
                )}
            </div>
        </components.Option>
    );
};

// Custom group heading with icon
const CustomGroupHeading = (props: GroupHeadingProps<CustomerOption, false, GroupedOption>) => {
    const isRecent = props.data.label === 'Son Siparisler';
    return (
        <components.GroupHeading {...props}>
            <span className="d-flex align-items-center gap-1">
                <i className={`ri-${isRecent ? 'time-line' : 'search-line'} me-1`}></i>
                {props.data.label}
            </span>
        </components.GroupHeading>
    );
};

export default function CustomerSearchSelect({
    value,
    onChange,
    placeholder = 'Musteri ara...',
    isInvalid = false,
    disabled = false,
    isClearable = true,
    className = '',
    initialCustomer = null,
}: CustomerSearchSelectProps) {
    const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize selected option from initialCustomer prop
    const getInitialOption = (): CustomerOption | null => {
        if (initialCustomer && value) {
            return {
                value: initialCustomer.id,
                label: initialCustomer.title,
                customer: initialCustomer,
            };
        }
        return null;
    };

    const [selectedOption, setSelectedOption] = useState<CustomerOption | null>(getInitialOption);

    // Load recent customers on mount
    useEffect(() => {
        const loadRecentCustomers = async () => {
            try {
                const response = await axios.get(route('sales.orders.customers.recent'), {
                    params: { limit: 10 },
                });
                setRecentCustomers(response.data || []);
            } catch (error) {
                console.error('Failed to load recent customers:', error);
            }
        };

        loadRecentCustomers();
    }, []);

    // Update selected option when initialCustomer or value changes
    useEffect(() => {
        if (initialCustomer && value) {
            setSelectedOption({
                value: initialCustomer.id,
                label: initialCustomer.title,
                customer: initialCustomer,
            });
        } else if (!value && !initialCustomer) {
            setSelectedOption(null);
        }
    }, [initialCustomer?.id, value]);

    // Convert customers to options
    const customersToOptions = (customers: Customer[]): CustomerOption[] => {
        return customers.map((customer) => ({
            value: customer.id,
            label: customer.title,
            customer,
        }));
    };

    // Load options for async select
    const loadOptions = useCallback(
        async (inputValue: string): Promise<GroupedOption[]> => {
            const groups: GroupedOption[] = [];

            // If no search term, show recent customers
            if (!inputValue || inputValue.length < 2) {
                if (recentCustomers.length > 0) {
                    groups.push({
                        label: 'Son Siparisler',
                        options: customersToOptions(recentCustomers),
                    });
                }
                return groups;
            }

            // Search customers
            try {
                const response = await axios.get(route('sales.orders.customers.search'), {
                    params: { q: inputValue },
                });
                const searchResults = response.data || [];

                if (searchResults.length > 0) {
                    groups.push({
                        label: 'Arama Sonuclari',
                        options: customersToOptions(searchResults),
                    });
                }
            } catch (error) {
                console.error('Customer search error:', error);
            }

            return groups;
        },
        [recentCustomers]
    );

    // Handle selection change
    const handleChange = (option: CustomerOption | null) => {
        setSelectedOption(option);
        onChange(option ? option.value : null);
    };

    // Default options (recent customers)
    const defaultOptions: GroupedOption[] =
        recentCustomers.length > 0
            ? [
                  {
                      label: 'Son Siparisler',
                      options: customersToOptions(recentCustomers),
                  },
              ]
            : [];

    // Custom styles for react-select
    const customStyles = {
        control: (base: any, state: any) => ({
            ...base,
            borderColor: isInvalid
                ? '#dc3545'
                : state.isFocused
                ? '#86b7fe'
                : '#ced4da',
            boxShadow: isInvalid
                ? '0 0 0 0.25rem rgba(220, 53, 69, 0.25)'
                : state.isFocused
                ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)'
                : 'none',
            '&:hover': {
                borderColor: isInvalid ? '#dc3545' : '#86b7fe',
            },
        }),
        groupHeading: (base: any) => ({
            ...base,
            backgroundColor: '#f8f9fa',
            color: '#6c757d',
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            padding: '8px 12px',
            borderBottom: '1px solid #dee2e6',
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected
                ? '#0d6efd'
                : state.isFocused
                ? '#e9ecef'
                : 'white',
            color: state.isSelected ? 'white' : '#212529',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: '#0d6efd',
            },
        }),
        menu: (base: any) => ({
            ...base,
            zIndex: 9999,
        }),
        menuList: (base: any) => ({
            ...base,
            maxHeight: '300px',
        }),
        singleValue: (base: any) => ({
            ...base,
            color: '#212529',
        }),
        input: (base: any) => ({
            ...base,
            color: '#212529',
        }),
        placeholder: (base: any) => ({
            ...base,
            color: '#6c757d',
        }),
    };

    return (
        <AsyncSelect<CustomerOption, false, GroupedOption>
            className={className}
            classNamePrefix="customer-select"
            value={selectedOption}
            onChange={handleChange}
            loadOptions={loadOptions}
            defaultOptions={defaultOptions}
            placeholder={placeholder}
            isClearable={isClearable}
            isDisabled={disabled}
            isLoading={isLoading}
            cacheOptions
            components={{
                Option: CustomOption,
                GroupHeading: CustomGroupHeading,
            }}
            styles={customStyles}
            noOptionsMessage={({ inputValue }) =>
                inputValue.length < 2
                    ? 'En az 2 karakter girin'
                    : 'Sonuc bulunamadi'
            }
            loadingMessage={() => 'Araniyor...'}
        />
    );
}
