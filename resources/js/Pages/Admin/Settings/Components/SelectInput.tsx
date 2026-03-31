import React from 'react';
import { Form } from 'react-bootstrap';

interface Option {
    value: string;
    label: string;
}

interface Props {
    setting: {
        key: string;
        description: string | null;
        options: Option[] | null;
        is_public: boolean;
    };
    value: string;
    onChange: (value: string) => void;
    error?: string;
}

export default function SelectInput({ setting, value, onChange, error }: Props) {
    return (
        <Form.Group>
            <Form.Label>
                {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {setting.is_public && (
                    <span className="badge bg-info ms-2">Public</span>
                )}
            </Form.Label>
            <Form.Select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                isInvalid={!!error}
            >
                <option value="">Select an option</option>
                {setting.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </Form.Select>
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