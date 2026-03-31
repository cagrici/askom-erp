import React from 'react';
import { Form } from 'react-bootstrap';

interface Props {
    setting: {
        key: string;
        description: string | null;
        is_public: boolean;
    };
    value: boolean;
    onChange: (value: boolean) => void;
}

export default function BooleanToggle({ setting, value, onChange }: Props) {
    return (
        <Form.Group>
            <div className="d-flex align-items-center">
                <Form.Check
                    type="switch"
                    id={`switch-${setting.key}`}
                    label={setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                />
                {setting.is_public && (
                    <span className="badge bg-info ms-2">Public</span>
                )}
            </div>
            {setting.description && (
                <Form.Text className="text-muted d-block">
                    {setting.description}
                </Form.Text>
            )}
        </Form.Group>
    );
}