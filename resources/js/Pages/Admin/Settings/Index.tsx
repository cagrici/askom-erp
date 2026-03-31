import React, { useState, FormEvent } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, Nav, Tab, Button, Spinner, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import TextInput from './Components/TextInput';
import EmailInput from './Components/EmailInput';
import IntegerInput from './Components/IntegerInput';
import BooleanToggle from './Components/BooleanToggle';
import TextareaInput from './Components/TextareaInput';
import SelectInput from './Components/SelectInput';
import JsonInput from './Components/JsonInput';

interface Setting {
    id: number;
    key: string;
    value: any;
    type: 'text' | 'email' | 'integer' | 'boolean' | 'json' | 'textarea' | 'select';
    description: string | null;
    options: Array<{ value: string; label: string }> | null;
    is_public: boolean;
}

interface SettingsGroup {
    [key: string]: Setting[];
}

interface Props {
    settings: SettingsGroup;
    groupLabels: { [key: string]: string };
    errors?: { [key: string]: string };
}

export default function Index({ settings, groupLabels, errors = {} }: Props) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<string>(Object.keys(settings)[0] || 'general');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [settingToDelete, setSettingToDelete] = useState<Setting | null>(null);
    const [selectOptions, setSelectOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [newOption, setNewOption] = useState({ value: '', label: '' });
    
    const { data, setData, put, processing, wasSuccessful } = useForm({
        settings: [] as Array<{ key: string; value: any }>
    });

    const { data: newSettingData, setData: setNewSettingData, post, processing: creating, reset: resetNewSetting } = useForm({
        key: '',
        value: '',
        type: 'text' as Setting['type'],
        group: 'custom',
        description: '',
        options: [] as Array<{ value: string; label: string }>,
        is_public: false
    });

    // Core settings that cannot be deleted
    const coreSettings = [
        'site_name', 'site_email', 'site_phone', 'company_address',
        'maintenance_mode', 'items_per_page', 'allowed_file_types', 'max_file_size',
        'email_from_address', 'email_from_name', 'smtp_host', 'smtp_port',
        'theme_color', 'date_format', 'time_format', 'timezone',
        'enable_registration', 'require_email_verification', 'session_lifetime', 'password_min_length'
    ];

    // Initialize form data
    React.useEffect(() => {
        const initialData: Array<{ key: string; value: any }> = [];
        Object.values(settings).forEach(group => {
            group.forEach(setting => {
                initialData.push({ key: setting.key, value: setting.value });
            });
        });
        setData('settings', initialData);
    }, [settings]);

    const updateSetting = (key: string, value: any) => {
        const updatedSettings = data.settings.map(s => 
            s.key === key ? { ...s, value } : s
        );
        setData('settings', updatedSettings);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(route('admin.settings.update'), {
            preserveScroll: true
        });
    };

    const handleAddSetting = (e: FormEvent) => {
        e.preventDefault();
        
        // Set default value based on type
        let defaultValue = newSettingData.value;
        if (newSettingData.type === 'boolean') {
            defaultValue = defaultValue === 'true' || defaultValue === '1' ? '1' : '0';
        } else if (newSettingData.type === 'json') {
            defaultValue = Array.isArray(defaultValue) ? defaultValue : [];
        }

        post(route('admin.settings.store'), {
            data: {
                ...newSettingData,
                value: defaultValue,
                options: newSettingData.type === 'select' ? selectOptions : null
            },
            preserveScroll: true,
            onSuccess: () => {
                setShowAddModal(false);
                resetNewSetting();
                setSelectOptions([]);
            }
        });
    };

    const handleDeleteSetting = () => {
        if (settingToDelete) {
            router.delete(route('admin.settings.destroy', settingToDelete.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setShowDeleteConfirm(false);
                    setSettingToDelete(null);
                }
            });
        }
    };

    const addSelectOption = () => {
        if (newOption.value && newOption.label) {
            setSelectOptions([...selectOptions, newOption]);
            setNewOption({ value: '', label: '' });
        }
    };

    const removeSelectOption = (index: number) => {
        setSelectOptions(selectOptions.filter((_, i) => i !== index));
    };

    const renderSettingInput = (setting: Setting) => {
        const value = data.settings.find(s => s.key === setting.key)?.value ?? setting.value;
        const error = errors[setting.key];
        const isCustom = !coreSettings.includes(setting.key);

        const inputComponent = (() => {
            switch (setting.type) {
                case 'text':
                    return (
                        <TextInput
                            setting={setting}
                            value={value}
                            onChange={(val) => updateSetting(setting.key, val)}
                            error={error}
                        />
                    );
                case 'email':
                    return (
                        <EmailInput
                            setting={setting}
                            value={value}
                            onChange={(val) => updateSetting(setting.key, val)}
                            error={error}
                        />
                    );
                case 'integer':
                    return (
                        <IntegerInput
                            setting={setting}
                            value={value}
                            onChange={(val) => updateSetting(setting.key, val)}
                            error={error}
                        />
                    );
                case 'boolean':
                    return (
                        <BooleanToggle
                            setting={setting}
                            value={value}
                            onChange={(val) => updateSetting(setting.key, val)}
                        />
                    );
                case 'textarea':
                    return (
                        <TextareaInput
                            setting={setting}
                            value={value}
                            onChange={(val) => updateSetting(setting.key, val)}
                            error={error}
                        />
                    );
                case 'select':
                    return (
                        <SelectInput
                            setting={setting}
                            value={value}
                            onChange={(val) => updateSetting(setting.key, val)}
                            error={error}
                        />
                    );
                case 'json':
                    return (
                        <JsonInput
                            setting={setting}
                            value={value}
                            onChange={(val) => updateSetting(setting.key, val)}
                            error={error}
                        />
                    );
                default:
                    return null;
            }
        })();

        return (
            <div className="position-relative">
                {inputComponent}
                {isCustom && (
                    <Button
                        variant="link"
                        className="position-absolute top-0 end-0 text-danger p-0"
                        onClick={() => {
                            setSettingToDelete(setting);
                            setShowDeleteConfirm(true);
                        }}
                        title="Delete this setting"
                    >
                        <i className="ri-delete-bin-line"></i>
                    </Button>
                )}
            </div>
        );
    };

    return (
        <AdminLayout>
            <Head title={t('Settings')} />

            <div className="page-content">
                <div className="container-fluid">
                    {/* Page Title */}
                    <div className="row">
                        <div className="col-12">
                            <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                                <h4 className="mb-sm-0">{t('Site Settings')}</h4>
                                <div className="page-title-right">
                                    <Button 
                                        variant="success" 
                                        size="sm"
                                        onClick={() => setShowAddModal(true)}
                                        className="me-2"
                                    >
                                        <i className="ri-add-line align-bottom me-1"></i> {t('Add Custom Setting')}
                                    </Button>
                                    <ol className="breadcrumb m-0 d-inline-block">
                                        <li className="breadcrumb-item">
                                            <a href={route('dashboard')}>{t('Dashboard')}</a>
                                        </li>
                                        <li className="breadcrumb-item active">{t('Settings')}</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    {wasSuccessful && (
                        <Alert variant="success" dismissible>
                            {t('Settings have been updated successfully!')}
                        </Alert>
                    )}

                    {/* Settings Form */}
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <Card.Body>
                                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'general')}>
                                    <Nav variant="tabs" className="nav-tabs-custom mb-3">
                                        {Object.entries(settings).map(([group, _]) => (
                                            <Nav.Item key={group}>
                                                <Nav.Link eventKey={group}>
                                                    {groupLabels[group] || group}
                                                </Nav.Link>
                                            </Nav.Item>
                                        ))}
                                    </Nav>

                                    <Tab.Content>
                                        {Object.entries(settings).map(([group, groupSettings]) => (
                                            <Tab.Pane key={group} eventKey={group}>
                                                <div className="row">
                                                    {groupSettings.map((setting) => (
                                                        <div key={setting.key} className="col-md-6 mb-3">
                                                            {renderSettingInput(setting)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </Tab.Pane>
                                        ))}
                                    </Tab.Content>
                                </Tab.Container>
                            </Card.Body>
                            <Card.Footer>
                                <div className="d-flex justify-content-end">
                                    <Button 
                                        type="submit" 
                                        variant="primary"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                    className="me-2"
                                                />
                                                {t('Saving...')}
                                            </>
                                        ) : (
                                            t('Save Settings')
                                        )}
                                    </Button>
                                </div>
                            </Card.Footer>
                        </Card>
                    </form>
                </div>
            </div>

            {/* Add Setting Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{t('Add Custom Setting')}</Modal.Title>
                </Modal.Header>
                <form onSubmit={handleAddSetting}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('Setting Key')} <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newSettingData.key}
                                        onChange={(e) => setNewSettingData('key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                        placeholder="custom_setting_key"
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        {t('Use lowercase letters, numbers, and underscores only')}
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('Type')} <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                        value={newSettingData.type}
                                        onChange={(e) => setNewSettingData('type', e.target.value as Setting['type'])}
                                        required
                                    >
                                        <option value="text">{t('Text')}</option>
                                        <option value="integer">{t('Integer')}</option>
                                        <option value="email">{t('Email')}</option>
                                        <option value="boolean">{t('Boolean (Yes/No)')}</option>
                                        <option value="textarea">{t('Textarea')}</option>
                                        <option value="select">{t('Select (Dropdown)')}</option>
                                        <option value="json">{t('JSON Array (Tags)')}</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('Group')} <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                        value={newSettingData.group}
                                        onChange={(e) => setNewSettingData('group', e.target.value)}
                                        required
                                    >
                                        <option value="custom">{t('Custom Settings')}</option>
                                        <option value="general">{t('General Settings')}</option>
                                        <option value="system">{t('System Settings')}</option>
                                        <option value="email">{t('Email Configuration')}</option>
                                        <option value="appearance">{t('Appearance')}</option>
                                        <option value="advanced">{t('Advanced Settings')}</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('Default Value')} <span className="text-danger">*</span></Form.Label>
                                    {newSettingData.type === 'boolean' ? (
                                        <Form.Select
                                            value={newSettingData.value}
                                            onChange={(e) => setNewSettingData('value', e.target.value)}
                                            required
                                        >
                                            <option value="0">{t('No')}</option>
                                            <option value="1">{t('Yes')}</option>
                                        </Form.Select>
                                    ) : newSettingData.type === 'textarea' ? (
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={newSettingData.value}
                                            onChange={(e) => setNewSettingData('value', e.target.value)}
                                            required
                                        />
                                    ) : newSettingData.type === 'integer' ? (
                                        <Form.Control
                                            type="number"
                                            value={newSettingData.value}
                                            onChange={(e) => setNewSettingData('value', e.target.value)}
                                            required
                                        />
                                    ) : (
                                        <Form.Control
                                            type={newSettingData.type === 'email' ? 'email' : 'text'}
                                            value={newSettingData.value}
                                            onChange={(e) => setNewSettingData('value', e.target.value)}
                                            required
                                        />
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('Description')}</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={newSettingData.description}
                                onChange={(e) => setNewSettingData('description', e.target.value)}
                                placeholder={t('Brief description of what this setting does')}
                            />
                        </Form.Group>

                        {newSettingData.type === 'select' && (
                            <div className="mb-3">
                                <Form.Label>{t('Select Options')}</Form.Label>
                                <div className="border rounded p-3">
                                    <Row className="mb-2">
                                        <Col md={5}>
                                            <Form.Control
                                                type="text"
                                                value={newOption.value}
                                                onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                                                placeholder={t('Value')}
                                            />
                                        </Col>
                                        <Col md={5}>
                                            <Form.Control
                                                type="text"
                                                value={newOption.label}
                                                onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                                                placeholder={t('Label')}
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Button 
                                                variant="primary" 
                                                onClick={addSelectOption}
                                                disabled={!newOption.value || !newOption.label}
                                            >
                                                {t('Add')}
                                            </Button>
                                        </Col>
                                    </Row>
                                    {selectOptions.map((option, index) => (
                                        <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                                            <span>{option.label} ({option.value})</span>
                                            <Button 
                                                variant="link" 
                                                className="text-danger p-0"
                                                onClick={() => removeSelectOption(index)}
                                            >
                                                <i className="ri-delete-bin-line"></i>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label={t('Make this setting publicly accessible (via API)')}
                                checked={newSettingData.is_public}
                                onChange={(e) => setNewSettingData('is_public', e.target.checked)}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button variant="primary" type="submit" disabled={creating}>
                            {creating ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    {t('Creating...')}
                                </>
                            ) : (
                                t('Create Setting')
                            )}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{t('Confirm Delete')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {settingToDelete && (
                        <p>
                            {t('Are you sure you want to delete the setting')} <strong>{settingToDelete.key}</strong>? 
                            {t('This action cannot be undone.')}.
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                        {t('Cancel')}
                    </Button>
                    <Button variant="danger" onClick={handleDeleteSetting}>
                        {t('Delete Setting')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </AdminLayout>
    );
}