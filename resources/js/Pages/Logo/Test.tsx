import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import Layout from '@/Layouts';
import { PageProps } from '@/types';

interface TestProps extends PageProps {
    title: string;
}

export default function Test({ title }: TestProps) {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('connection');

    const [firmNo, setFirmNo] = useState(1);
    const [tableName, setTableName] = useState('');
    const [customSql, setCustomSql] = useState('');

    const testConnection = async () => {
        setLoading(true);
        try {
            const response = await fetch('/logo/api/test-connection');
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ success: false, error: 'Request failed' });
        } finally {
            setLoading(false);
        }
    };

    const getTables = async () => {
        setLoading(true);
        try {
            const response = await fetch('/logo/api/tables');
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ success: false, error: 'Request failed' });
        } finally {
            setLoading(false);
        }
    };

    const getCustomers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/logo/api/customers?firm_no=${firmNo}&limit=10`);
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ success: false, error: 'Request failed' });
        } finally {
            setLoading(false);
        }
    };

    const getProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/logo/api/products?firm_no=${firmNo}&limit=10`);
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ success: false, error: 'Request failed' });
        } finally {
            setLoading(false);
        }
    };

    const getInvoices = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/logo/api/invoices?firm_no=${firmNo}&limit=10`);
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ success: false, error: 'Request failed' });
        } finally {
            setLoading(false);
        }
    };

    const runCustomQuery = async () => {
        if (!customSql.trim()) {
            alert('Lütfen bir SQL sorgusu girin');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/logo/api/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ sql: customSql }),
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({ success: false, error: 'Request failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <Head title={title} />

            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <i className="ri-database-2-line me-2"></i>
                                        Logo Database Connection Test
                                    </h3>
                                </div>

                                <div className="card-body">
                                    {/* Tabs */}
                                    <ul className="nav nav-tabs mb-4" role="tablist">
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 'connection' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('connection')}
                                            >
                                                <i className="ri-plug-line me-1"></i>
                                                Connection Test
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 'tables' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('tables')}
                                            >
                                                <i className="ri-table-line me-1"></i>
                                                Tables
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 'data' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('data')}
                                            >
                                                <i className="ri-file-list-line me-1"></i>
                                                Data
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${activeTab === 'query' ? 'active' : ''}`}
                                                onClick={() => setActiveTab('query')}
                                            >
                                                <i className="ri-code-line me-1"></i>
                                                Custom Query
                                            </button>
                                        </li>
                                    </ul>

                                    {/* Connection Test Tab */}
                                    {activeTab === 'connection' && (
                                        <div>
                                            <h5>Test Logo Database Connection</h5>
                                            <p className="text-muted">
                                                Click the button below to test the connection to Logo MS SQL Server database.
                                            </p>
                                            <button
                                                className="btn btn-primary"
                                                onClick={testConnection}
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <i className="ri-loader-4-line spinner-border spinner-border-sm me-2"></i>
                                                        Testing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri-play-line me-2"></i>
                                                        Test Connection
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Tables Tab */}
                                    {activeTab === 'tables' && (
                                        <div>
                                            <h5>List All Tables</h5>
                                            <p className="text-muted">
                                                Retrieve all tables from the Logo database.
                                            </p>
                                            <button
                                                className="btn btn-primary"
                                                onClick={getTables}
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <i className="ri-loader-4-line spinner-border spinner-border-sm me-2"></i>
                                                        Loading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri-table-line me-2"></i>
                                                        Get Tables
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Data Tab */}
                                    {activeTab === 'data' && (
                                        <div>
                                            <h5>Retrieve Logo Data</h5>
                                            <p className="text-muted">
                                                Get data from Logo tables (customers, products, invoices).
                                            </p>

                                            <div className="mb-3">
                                                <label className="form-label">Firm Number</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={firmNo}
                                                    onChange={(e) => setFirmNo(parseInt(e.target.value) || 1)}
                                                    min="1"
                                                    style={{ maxWidth: '200px' }}
                                                />
                                                <small className="text-muted">
                                                    Logo firm number (default: 1, tables: LG_001_*)
                                                </small>
                                            </div>

                                            <div className="d-flex gap-2 flex-wrap">
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={getCustomers}
                                                    disabled={loading}
                                                >
                                                    <i className="ri-user-line me-2"></i>
                                                    Get Customers
                                                </button>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={getProducts}
                                                    disabled={loading}
                                                >
                                                    <i className="ri-product-hunt-line me-2"></i>
                                                    Get Products
                                                </button>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={getInvoices}
                                                    disabled={loading}
                                                >
                                                    <i className="ri-file-text-line me-2"></i>
                                                    Get Invoices
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Custom Query Tab */}
                                    {activeTab === 'query' && (
                                        <div>
                                            <h5>Run Custom SQL Query</h5>
                                            <p className="text-muted">
                                                Execute a custom SELECT query on the Logo database.
                                            </p>

                                            <div className="mb-3">
                                                <label className="form-label">SQL Query</label>
                                                <textarea
                                                    className="form-control font-monospace"
                                                    rows={5}
                                                    value={customSql}
                                                    onChange={(e) => setCustomSql(e.target.value)}
                                                    placeholder="SELECT * FROM INFORMATION_SCHEMA.TABLES"
                                                />
                                            </div>

                                            <button
                                                className="btn btn-primary"
                                                onClick={runCustomQuery}
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <i className="ri-loader-4-line spinner-border spinner-border-sm me-2"></i>
                                                        Executing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="ri-play-line me-2"></i>
                                                        Execute Query
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Result Display */}
                                    {result && (
                                        <div className="mt-4">
                                            <hr />
                                            <h5>
                                                Result:
                                                {result.success ? (
                                                    <span className="badge bg-success ms-2">Success</span>
                                                ) : (
                                                    <span className="badge bg-danger ms-2">Failed</span>
                                                )}
                                            </h5>

                                            <div className="card">
                                                <div className="card-body">
                                                    <pre className="mb-0" style={{ maxHeight: '500px', overflow: 'auto' }}>
                                                        {JSON.stringify(result, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
