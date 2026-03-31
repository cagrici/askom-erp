import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Badge, Alert } from 'react-bootstrap';
import axios from 'axios';
import AsyncSelect from 'react-select/async';

interface Account {
    id: number;
    title: string;
    account_code: string;
    pivot?: {
        is_default: boolean;
    };
}

interface Props {
    userId: number;
    initialAccounts: Account[];
}

const AssignedAccountsManager: React.FC<Props> = ({ userId, initialAccounts }) => {
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts || []);
    const [availableAccounts, setAvailableAccounts] = useState<{value: number; label: string}[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<{value: number; label: string} | null>(null);
    const [defaultAccountId, setDefaultAccountId] = useState<number | null>(
        initialAccounts?.find(a => a.pivot?.is_default)?.id || null
    );
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);

    const searchAccounts = (inputValue: string) => {
        return axios.get(route('admin.users.available-accounts'), {
            params: { search: inputValue }
        }).then(response => {
            return response.data.map((acc: any) => ({
                value: acc.id,
                label: `${acc.title} (${acc.account_code})`
            }));
        }).catch(error => {
            console.error('Error searching accounts:', error);
            return [];
        });
    };

    const handleAddAccount = () => {
        if (!selectedAccount) return;

        const exists = accounts.find(a => a.id === selectedAccount.value);
        if (exists) {
            setMessage({ type: 'error', text: 'Bu cari zaten eklenmiş!' });
            return;
        }

        const newAccount: Account = {
            id: selectedAccount.value,
            title: selectedAccount.label.split(' (')[0],
            account_code: selectedAccount.label.split('(')[1]?.replace(')', '') || '',
            pivot: { is_default: accounts.length === 0 } // First account is default
        };

        setAccounts([...accounts, newAccount]);
        if (accounts.length === 0) {
            setDefaultAccountId(newAccount.id);
        }
        setSelectedAccount(null);
        setMessage(null);
    };

    const handleRemoveAccount = (accountId: number) => {
        const newAccounts = accounts.filter(a => a.id !== accountId);
        setAccounts(newAccounts);

        if (defaultAccountId === accountId && newAccounts.length > 0) {
            setDefaultAccountId(newAccounts[0].id);
        } else if (newAccounts.length === 0) {
            setDefaultAccountId(null);
        }
    };

    const handleSetDefault = (accountId: number) => {
        setDefaultAccountId(accountId);
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const accountsData = accounts.map(acc => ({
                id: acc.id,
                is_default: acc.id === defaultAccountId
            }));

            const response = await axios.post(route('admin.users.accounts', userId), {
                accounts: accountsData
            });

            setMessage({ type: 'success', text: response.data.message });

            // Refresh page after 1 second
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Bir hata oluştu!'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="mt-3">
            <Card.Header className="bg-light">
                <h5 className="mb-0">Atanmış Cari Hesaplar (B2B Portal Erişimi)</h5>
            </Card.Header>
            <Card.Body>
                {message && (
                    <Alert variant={message.type === 'success' ? 'success' : 'danger'} dismissible onClose={() => setMessage(null)}>
                        {message.text}
                    </Alert>
                )}

                <div className="mb-3">
                    <Form.Label>Cari Hesap Ekle</Form.Label>
                    <div className="d-flex gap-2">
                        <div className="flex-grow-1">
                            <AsyncSelect
                                value={selectedAccount}
                                onChange={setSelectedAccount}
                                loadOptions={searchAccounts}
                                placeholder="Cari ara..."
                                isClearable
                                defaultOptions
                                cacheOptions
                            />
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleAddAccount}
                            disabled={!selectedAccount}
                        >
                            <i className="bx bx-plus me-1"></i>
                            Ekle
                        </Button>
                    </div>
                    <Form.Text className="text-muted">
                        Kullanıcının B2B portaldan erişebileceği cari hesapları ekleyin
                    </Form.Text>
                </div>

                {accounts.length > 0 ? (
                    <>
                        <div className="table-responsive">
                            <table className="table table-sm table-hover">
                                <thead>
                                    <tr>
                                        <th>Cari Adı</th>
                                        <th>Cari Kodu</th>
                                        <th>Varsayılan</th>
                                        <th className="text-end">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map(account => (
                                        <tr key={account.id}>
                                            <td>{account.title}</td>
                                            <td><code>{account.account_code}</code></td>
                                            <td>
                                                <Form.Check
                                                    type="radio"
                                                    name="default_account"
                                                    checked={defaultAccountId === account.id}
                                                    onChange={() => handleSetDefault(account.id)}
                                                    label={defaultAccountId === account.id ? <Badge bg="success">Varsayılan</Badge> : ''}
                                                />
                                            </td>
                                            <td className="text-end">
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => handleRemoveAccount(account.id)}
                                                >
                                                    <i className="bx bx-trash"></i>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-end mt-3">
                            <Button
                                variant="success"
                                onClick={handleSave}
                                disabled={loading || accounts.length === 0}
                            >
                                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <Alert variant="info">
                        <i className="bx bx-info-circle me-2"></i>
                        Henüz cari hesap atanmamış. Yukarıdaki alandan cari ekleyebilirsiniz.
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

export default AssignedAccountsManager;
