import React, { useState, useEffect } from 'react';
import { Form, Badge, Button } from 'react-bootstrap';
import StaticSearchableSelect from '@/Components/StaticSearchableSelect';
import axios from 'axios';

interface Category {
    id: number;
    name: string;
    level?: number;
    parent_id?: number;
    children?: Category[];
}

interface Props {
    categories: Category[];
    categoriesHierarchy: Category[];
    selectedMainCategory?: number | string;
    selectedCategories?: number[];
    onMainCategoryChange: (categoryId: string) => void;
    onCategoriesChange: (categoryIds: number[]) => void;
    mainCategoryError?: string;
    categoriesError?: string;
}

export default function HierarchicalCategorySelect({
    categories,
    categoriesHierarchy,
    selectedMainCategory,
    selectedCategories = [],
    onMainCategoryChange,
    onCategoriesChange,
    mainCategoryError,
    categoriesError
}: Props) {
    const [autoCategories, setAutoCategories] = useState<number[]>([]);
    const [manualCategories, setManualCategories] = useState<number[]>([]);

    // Flatten categories for dropdown with alphabetical sorting
    const flattenCategories = (categories: Category[], level = 0): Array<Category & { displayName: string }> => {
        let result: Array<Category & { displayName: string }> = [];
        
        // Sort categories alphabetically at each level
        const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        
        sortedCategories.forEach(category => {
            const indent = '—'.repeat(level);
            const displayName = level > 0 ? `${indent} ${category.name}` : category.name;
            
            result.push({
                ...category,
                displayName
            });
            
            if (category.children && category.children.length > 0) {
                result = result.concat(flattenCategories(category.children, level + 1));
            }
        });
        
        return result;
    };

    const flatCategories = flattenCategories(categoriesHierarchy);

    // Prepare options for SearchableSelect
    const categoryOptions = flatCategories.map(category => ({
        value: category.id.toString(),
        label: category.displayName,
        searchText: category.name.toLowerCase() // For better search
    }));

    // Get parent categories when main category changes
    useEffect(() => {
        if (selectedMainCategory && selectedMainCategory !== '') {
            fetchParentCategories(Number(selectedMainCategory));
        } else {
            setAutoCategories([]);
        }
    }, [selectedMainCategory]);

    const fetchParentCategories = async (categoryId: number) => {
        try {
            const response = await axios.get('/products/api/category-parents', {
                params: { category_id: categoryId }
            });
            
            const parentIds = response.data.map((cat: any) => cat.id);
            setAutoCategories(parentIds);
            
            // Update total categories
            const newSelectedCategories = [...new Set([...parentIds, ...manualCategories])];
            onCategoriesChange(newSelectedCategories);
        } catch (error) {
            console.error('Error fetching parent categories:', error);
        }
    };

    const handleManualCategoryToggle = (categoryId: number) => {
        const newManualCategories = manualCategories.includes(categoryId)
            ? manualCategories.filter(id => id !== categoryId)
            : [...manualCategories, categoryId];
        
        setManualCategories(newManualCategories);
        
        // Update total categories
        const newSelectedCategories = [...new Set([...autoCategories, ...newManualCategories])];
        onCategoriesChange(newSelectedCategories);
    };

    const getCategoryName = (categoryId: number): string => {
        const category = categories.find(cat => cat.id === categoryId);
        return category?.name || `Category ${categoryId}`;
    };

    // Separate auto and manual categories for display
    useEffect(() => {
        const manual = selectedCategories.filter(id => !autoCategories.includes(id));
        setManualCategories(manual);
    }, [selectedCategories, autoCategories]);

    return (
        <div>
            {/* Main Category Selection */}
            <Form.Group className="mb-3">
                <Form.Label>Ana Kategori <span className="text-danger">*</span></Form.Label>
                <StaticSearchableSelect
                    options={categoryOptions}
                    value={selectedMainCategory ? selectedMainCategory.toString() : ''}
                    onChange={(value) => onMainCategoryChange(value)}
                    placeholder="Kategori ara ve seçin..."
                    isInvalid={!!mainCategoryError}
                    emptyMessage="Kategori bulunamadı"
                />
                {mainCategoryError && (
                    <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                        {mainCategoryError}
                    </Form.Control.Feedback>
                )}
                <Form.Text className="text-muted">
                    Kategori adını yazarak arayabilir ve seçebilirsiniz. Parent kategoriler otomatik eklenecektir.
                </Form.Text>
            </Form.Group>

            {/* Auto-selected Categories Display */}
            {autoCategories.length > 0 && (
                <Form.Group className="mb-3">
                    <Form.Label>Otomatik Eklenen Kategoriler</Form.Label>
                    <div>
                        {autoCategories.map(categoryId => (
                            <Badge 
                                key={categoryId} 
                                bg="primary" 
                                className="me-2 mb-1"
                            >
                                {getCategoryName(categoryId)}
                            </Badge>
                        ))}
                    </div>
                    <Form.Text className="text-muted">
                        Ana kategori seçimine göre otomatik eklenen parent kategoriler.
                    </Form.Text>
                </Form.Group>
            )}

            {/* Manual Category Selection */}
            <Form.Group className="mb-3">
                <Form.Label>Ek Kategoriler</Form.Label>
                <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {flatCategories.map(category => {
                        const isAutoSelected = autoCategories.includes(category.id);
                        const isManuallySelected = manualCategories.includes(category.id);
                        
                        return (
                            <Form.Check
                                key={category.id}
                                type="checkbox"
                                id={`manual-category-${category.id}`}
                                label={category.displayName}
                                checked={isAutoSelected || isManuallySelected}
                                disabled={isAutoSelected}
                                onChange={() => handleManualCategoryToggle(category.id)}
                                className={`${isAutoSelected ? 'text-muted' : ''} mb-1`}
                            />
                        );
                    })}
                </div>
                <Form.Text className="text-muted">
                    Ürünü ek kategorilerde de göstermek için seçin. Gri olanlar otomatik eklenenlerdir.
                </Form.Text>
                {categoriesError && (
                    <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                        {categoriesError}
                    </Form.Control.Feedback>
                )}
            </Form.Group>

            {/* Selected Categories Summary */}
            {selectedCategories.length > 0 && (
                <Form.Group className="mb-3">
                    <Form.Label>Seçili Kategoriler ({selectedCategories.length})</Form.Label>
                    <div>
                        {selectedCategories.map(categoryId => {
                            const isAuto = autoCategories.includes(categoryId);
                            return (
                                <Badge 
                                    key={categoryId} 
                                    bg={isAuto ? "primary" : "secondary"} 
                                    className="me-2 mb-1"
                                >
                                    {getCategoryName(categoryId)}
                                    {isAuto && <small className="ms-1">(otomatik)</small>}
                                </Badge>
                            );
                        })}
                    </div>
                </Form.Group>
            )}
        </div>
    );
}