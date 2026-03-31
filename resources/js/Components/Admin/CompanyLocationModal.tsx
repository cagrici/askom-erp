import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import axios from '../../utils/axios';

interface CompanyLocationProps {
    id: number;
    name: string;
    pivot?: {
        is_primary: boolean;
        is_admin: boolean;
    };
}

interface CompanyLocationModalProps {
    show: boolean;
    onHide: () => void;
    userId: number;
    userName: string;
    userLocations: CompanyLocationProps[];
    availableLocations: CompanyLocationProps[];
    onSave: () => void;
}

const CompanyLocationModal: React.FC<CompanyLocationModalProps> = ({
    show,
    onHide,
    userId,
    userName,
    userLocations,
    availableLocations,
    onSave
}) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<{[key: number]: {selected: boolean, is_primary: boolean, is_admin: boolean}}>({});

    // Initialize locations state from userLocations
    useEffect(() => {
        const initialLocations: {[key: number]: {selected: boolean, is_primary: boolean, is_admin: boolean}} = {};
        
        // First initialize all available locations as not selected
        availableLocations.forEach(location => {
            initialLocations[location.id] = {
                selected: false,
                is_primary: false,
                is_admin: false
            };
        });
        
        // Then update with user's current locations
        userLocations.forEach(location => {
            initialLocations[location.id] = {
                selected: true,
                is_primary: location.pivot?.is_primary || false,
                is_admin: location.pivot?.is_admin || false
            };
        });
        
        setLocations(initialLocations);
    }, [userLocations, availableLocations]);

    const handleLocationChange = (locationId: number, selected: boolean) => {
        setLocations(prev => ({
            ...prev,
            [locationId]: {
                ...prev[locationId],
                selected
            }
        }));
    };

    const handlePrimaryChange = (locationId: number) => {
        // Unset primary for all locations
        const updatedLocations = { ...locations };
        Object.keys(updatedLocations).forEach(key => {
            const id = parseInt(key);
            updatedLocations[id] = {
                ...updatedLocations[id],
                is_primary: false
            };
        });
        
        // Set primary for the selected location
        updatedLocations[locationId] = {
            ...updatedLocations[locationId],
            is_primary: true
        };
        
        setLocations(updatedLocations);
    };

    const handleAdminChange = (locationId: number, isAdmin: boolean) => {
        setLocations(prev => ({
            ...prev,
            [locationId]: {
                ...prev[locationId],
                is_admin: isAdmin
            }
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        
        try {
            // Format locations data for API
            const selectedLocations = Object.entries(locations)
                .filter(([_, locationData]) => locationData.selected)
                .map(([locationId, locationData]) => ({
                    id: parseInt(locationId),
                    is_primary: locationData.is_primary,
                    is_admin: locationData.is_admin
                }));
            
            console.log('Sending locations data:', selectedLocations);
            console.log('User ID:', userId);
            
            // Send data to API
            const response = await axios.post(`/admin/users/${userId}/company-locations`, {
                companyLocations: selectedLocations
            });
            
            console.log('Response:', response.data);
            
            onSave();
            onHide();
        } catch (error) {
            console.error('Error saving company locations:', error);
            if (axios.isAxiosError(error)) {
                console.error('Response data:', error.response?.data);
                console.error('Response status:', error.response?.status);
            }
            alert(t('Failed to save company locations. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>{t('Manage Company Locations for')}: {userName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="table-responsive">
                    <Table hover bordered>
                        <thead className="bg-light">
                            <tr>
                                <th>{t('Select')}</th>
                                <th>{t('Location')}</th>
                                <th>{t('Primary')}</th>
                                <th>{t('Admin')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {availableLocations.map(location => (
                                <tr key={location.id}>
                                    <td>
                                        <Form.Check
                                            type="checkbox"
                                            id={`location-${location.id}`}
                                            checked={locations[location.id]?.selected || false}
                                            onChange={e => handleLocationChange(location.id, e.target.checked)}
                                        />
                                    </td>
                                    <td>{location.name}</td>
                                    <td>
                                        <Form.Check
                                            type="radio"
                                            name="primary_location"
                                            id={`primary-${location.id}`}
                                            disabled={!locations[location.id]?.selected}
                                            checked={locations[location.id]?.is_primary || false}
                                            onChange={() => handlePrimaryChange(location.id)}
                                        />
                                    </td>
                                    <td>
                                        <Form.Check
                                            type="checkbox"
                                            id={`admin-${location.id}`}
                                            disabled={!locations[location.id]?.selected}
                                            checked={locations[location.id]?.is_admin || false}
                                            onChange={e => handleAdminChange(location.id, e.target.checked)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    {t('Cancel')}
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={loading}>
                    {loading ? t('Saving...') : t('Save Changes')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CompanyLocationModal;
