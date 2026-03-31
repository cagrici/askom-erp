
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, InputGroup, Badge } from 'react-bootstrap';
import { FaSearch, FaPlus, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface Entity {
    id: number;
    entity_name: string;
    entity_code: string;
}

interface EntityAuthorizationModalProps {
    show: boolean;
    onHide: () => void;
    userId: number;
    userName: string;
    onSave: () => void;
}

const EntityAuthorizationModal: React.FC<EntityAuthorizationModalProps> = ({
                                                                               show, onHide, userId, userName, onSave
                                                                           }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Entity[]>([]);
    const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (show && userId) {
            // Load user's entities
            axios.get(route('admin.users.entities', userId))
                .then(response => {
                    setSelectedEntities(response.data.entities);
                })
                .catch(error => {
                    console.error('Error loading user entities:', error);
                });
        }
    }, [show, userId]);

    const handleSearch = () => {
        if (searchTerm.trim().length < 2) return;

        setIsSearching(true);
        axios.get(route('admin.entities.search'), {
            params: { q: searchTerm, limit: 10 }
        })
            .then(response => {
                setSearchResults(response.data);
                setIsSearching(false);
            })
            .catch(error => {
                console.error('Error searching entities:', error);
                setIsSearching(false);
            });
    };

    const handleAddEntity = (entity: Entity) => {
        if (!selectedEntities.some(e => e.id === entity.id)) {
            setSelectedEntities([...selectedEntities, entity]);
        }
        setSearchResults([]);
        setSearchTerm('');
    };

    const handleRemoveEntity = (entityId: number) => {
        setSelectedEntities(selectedEntities.filter(entity => entity.id !== entityId));
    };

    const handleSave = () => {
        setIsSaving(true);

        axios.post(route('admin.users.entities.update', userId), {
            entities: selectedEntities
        })
            .then(() => {
                setIsSaving(false);
                onSave();
                onHide();
            })
            .catch(error => {
                console.error('Error updating entities:', error);
                setIsSaving(false);
            });
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{t('Entity Authorization')} - {userName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-4">
                    <Form.Label>{t('Search Entities')}</Form.Label>
                    <InputGroup>
                        <Form.Control
                            placeholder={t('Search by name or code...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button
                            variant="primary"
                            onClick={handleSearch}
                            disabled={isSearching}
                        >
                            {isSearching ? t('Searching...') : <FaSearch />}
                        </Button>
                    </InputGroup>
                </div>

                {searchResults.length > 0 && (
                    <div className="mb-4">
                        <h6>{t('Search Results')}</h6>
                        <Table bordered hover size="sm">
                            <thead>
                            <tr>
                                <th>{t('Code')}</th>
                                <th>{t('Name')}</th>
                                <th>{t('Action')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {searchResults.map(entity => (
                                <tr key={entity.id}>
                                    <td>{entity.entity_code}</td>
                                    <td>{entity.entity_name}</td>
                                    <td className="text-center">
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={() => handleAddEntity(entity)}
                                        >
                                            <FaPlus />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    </div>
                )}

                <div>
                    <h6>{t('Authorized Entities')}</h6>
                    {selectedEntities.length === 0 ? (
                        <div className="alert alert-info">
                            {t('No entities authorized for this user')}
                        </div>
                    ) : (
                        <Table bordered hover>
                            <thead>
                            <tr>
                                <th>{t('Code')}</th>
                                <th>{t('Name')}</th>
                                <th>{t('Action')}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {selectedEntities.map(entity => (
                                <tr key={entity.id}>
                                    <td>{entity.entity_code}</td>
                                    <td>{entity.entity_name}</td>
                                    <td className="text-center">
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleRemoveEntity(entity.id)}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {t('Cancel')}
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? t('Saving...') : t('Save Changes')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default EntityAuthorizationModal;
