import React, { useState, useEffect, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import { components, OptionProps } from 'react-select';
import axios from 'axios';

interface Product {
    id: number;
    code: string;
    name: string;
}

interface ProductOption {
    value: number;
    label: string;
    product: Product;
}

interface ProductFilterSelectProps {
    value: number | string | null;
    onChange: (productId: number | null) => void;
    placeholder?: string;
    isInvalid?: boolean;
    disabled?: boolean;
    isClearable?: boolean;
    className?: string;
    initialProduct?: Product | null;
}

// Custom option component to show product code
const CustomOption = (props: OptionProps<ProductOption, false>) => {
    const { data } = props;
    return (
        <components.Option {...props}>
            <div className="d-flex justify-content-between align-items-center">
                <span>{data.product.name}</span>
                <small className="text-muted ms-2">
                    {data.product.code}
                </small>
            </div>
        </components.Option>
    );
};

export default function ProductFilterSelect({
    value,
    onChange,
    placeholder = 'Urun ara...',
    isInvalid = false,
    disabled = false,
    isClearable = true,
    className = '',
    initialProduct = null,
}: ProductFilterSelectProps) {
    // Initialize selected option from initialProduct prop
    const getInitialOption = (): ProductOption | null => {
        if (initialProduct && value) {
            return {
                value: initialProduct.id,
                label: `${initialProduct.name} (${initialProduct.code})`,
                product: initialProduct,
            };
        }
        return null;
    };

    const [selectedOption, setSelectedOption] = useState<ProductOption | null>(getInitialOption);

    // Update selected option when initialProduct or value changes
    useEffect(() => {
        if (initialProduct && value) {
            setSelectedOption({
                value: initialProduct.id,
                label: `${initialProduct.name} (${initialProduct.code})`,
                product: initialProduct,
            });
        } else if (!value && !initialProduct) {
            setSelectedOption(null);
        }
    }, [initialProduct?.id, value]);

    // Convert products to options
    const productsToOptions = (products: Product[]): ProductOption[] => {
        return products.map((product) => ({
            value: product.id,
            label: `${product.name} (${product.code})`,
            product,
        }));
    };

    // Load options for async select
    const loadOptions = useCallback(
        async (inputValue: string): Promise<ProductOption[]> => {
            if (!inputValue || inputValue.length < 2) {
                return [];
            }

            try {
                const response = await axios.get(route('sales.orders.products.filter-search'), {
                    params: { q: inputValue },
                });
                const searchResults = response.data || [];
                return productsToOptions(searchResults);
            } catch (error) {
                console.error('Product search error:', error);
                return [];
            }
        },
        []
    );

    // Handle selection change
    const handleChange = (option: ProductOption | null) => {
        setSelectedOption(option);
        onChange(option ? option.value : null);
    };

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
        <AsyncSelect<ProductOption, false>
            className={className}
            classNamePrefix="product-select"
            value={selectedOption}
            onChange={handleChange}
            loadOptions={loadOptions}
            defaultOptions={[]}
            placeholder={placeholder}
            isClearable={isClearable}
            isDisabled={disabled}
            cacheOptions
            components={{
                Option: CustomOption,
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
