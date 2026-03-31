import React, { useState, useEffect } from 'react';
import { Form, Badge } from 'react-bootstrap';

interface Props {
    setting: {
        key: string;
        description: string | null;
        is_public: boolean;
    };
    value: string[] | any;
    onChange: (value: any) => void;
    error?: string;
}

export default function JsonInput({ setting, value, onChange, error }: Props) {
    const [inputValue, setInputValue] = useState('');
    const [items, setItems] = useState<string[]>([]);

    useEffect(() => {
        // Initialize items from value
        if (Array.isArray(value)) {
            setItems(value);
        } else if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    setItems(parsed);
                }
            } catch (e) {
                setItems([]);
            }
        }
    }, [value]);

    const handleAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            e.preventDefault();
            const newItems = [...items, inputValue.trim()];
            setItems(newItems);
            onChange(newItems);
            setInputValue('');
        }
    };

    const handleRemove = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        onChange(newItems);
    };

    return (
        <Form.Group>
            <Form.Label>
                {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {setting.is_public && (
                    <span className="badge bg-info ms-2">Public</span>
                )}
            </Form.Label>
            
            <div className="mb-2">
                {items.map((item, index) => (
                    <Badge
                        key={index}
                        bg="secondary"
                        className="me-1 mb-1"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRemove(index)}
                    >
                        {item} <i className="ri-close-line ms-1"></i>
                    </Badge>
                ))}
            </div>

            <Form.Control
                type="text"
                placeholder="Type and press Enter to add"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleAdd}
                isInvalid={!!error}
            />
            
            {setting.description && (
                <Form.Text className="text-muted">
                    {setting.description}
                </Form.Text>
            )}
            {error && (
                <Form.Control.Feedback type="invalid">
                    {error}
                </Form.Control.Feedback>
            )}
        </Form.Group>
    );
}