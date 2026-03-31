import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Form, InputGroup, ListGroup, Badge, Button } from 'react-bootstrap';

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    initials: string;
}

interface Props {
    selectedUsers: User[];
    onUsersChange: (users: User[]) => void;
    placeholder?: string;
    disabled?: boolean;
}

const UserSelector: React.FC<Props> = ({ 
    selectedUsers, 
    onUsersChange, 
    placeholder = "Katılımcı ara...",
    disabled = false 
}) => {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            if (query.length >= 2) {
                searchUsers(query);
            } else {
                setSearchResults([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(delayedSearch);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target as Node) &&
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        const handleWindowResize = () => {
            if (showDropdown) {
                calculateDropdownPosition();
            }
        };

        const handleScroll = () => {
            if (showDropdown) {
                calculateDropdownPosition();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('resize', handleWindowResize);
        window.addEventListener('scroll', handleScroll, true);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleWindowResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showDropdown]);

    const calculateDropdownPosition = () => {
        if (searchRef.current) {
            const rect = searchRef.current.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            setDropdownPosition({
                top: rect.bottom + scrollTop + 4,
                left: rect.left + scrollLeft,
                width: rect.width
            });
        }
    };

    const searchUsers = async (searchQuery: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(route('meetings.users.search') + `?q=${encodeURIComponent(searchQuery)}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });
            const users = await response.json();
            setSearchResults(users);
            if (users.length > 0) {
                calculateDropdownPosition();
                setShowDropdown(true);
            } else {
                setShowDropdown(false);
            }
        } catch (error) {
            console.error('User search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addUser = (user: User) => {
        const isAlreadySelected = selectedUsers.some(u => u.id === user.id);
        if (!isAlreadySelected) {
            onUsersChange([...selectedUsers, user]);
        }
        setQuery('');
        setSearchResults([]);
        setShowDropdown(false);
    };

    const removeUser = (userId: number) => {
        onUsersChange(selectedUsers.filter(u => u.id !== userId));
    };

    const UserAvatar: React.FC<{ user: User; size?: 'sm' | 'md' }> = ({ user, size = 'sm' }) => {
        const sizeClass = size === 'sm' ? 'width: 24px; height: 24px; font-size: 10px;' : 'width: 32px; height: 32px; font-size: 12px;';
        
        if (user.avatar) {
            return (
                <img
                    src={user.avatar}
                    alt={user.name}
                    className="rounded-circle me-2"
                    style={{ width: size === 'sm' ? '24px' : '32px', height: size === 'sm' ? '24px' : '32px', objectFit: 'cover' }}
                />
            );
        }
        
        return (
            <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                style={{ 
                    width: size === 'sm' ? '24px' : '32px', 
                    height: size === 'sm' ? '24px' : '32px', 
                    fontSize: size === 'sm' ? '10px' : '12px',
                    fontWeight: 'bold'
                }}
            >
                {user.initials || 'U'}
            </div>
        );
    };

    const renderDropdown = () => {
        if (!showDropdown) return null;

        const dropdownContent = (
            <div
                ref={dropdownRef}
                className="position-fixed bg-white border rounded shadow-sm"
                style={{ 
                    zIndex: 9999, 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    width: `${dropdownPosition.width}px`,
                    minWidth: '200px'
                }}
            >
                {searchResults.length > 0 ? (
                    <ListGroup variant="flush">
                        {searchResults.map(user => {
                            const isSelected = selectedUsers.some(u => u.id === user.id);
                            return (
                                <ListGroup.Item
                                    key={user.id}
                                    className={`d-flex align-items-center cursor-pointer ${isSelected ? 'bg-light' : 'hover-bg-light'}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => !isSelected && addUser(user)}
                                >
                                    <UserAvatar user={user} size="md" />
                                    <div className="flex-grow-1">
                                        <div className="fw-medium">{user.name || 'Unknown User'}</div>
                                        <small className="text-muted">{user.email || 'No email'}</small>
                                    </div>
                                    {isSelected && (
                                        <Badge bg="success" className="ms-2">
                                            <i className="ri-check-line"></i>
                                        </Badge>
                                    )}
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                ) : query.length >= 2 && !isLoading ? (
                    <div className="p-3 text-center text-muted">
                        <i className="ri-user-search-line me-1"></i>
                        Kullanıcı bulunamadı
                    </div>
                ) : null}
            </div>
        );

        return createPortal(dropdownContent, document.body);
    };

    return (
        <div ref={containerRef} className="position-relative">
            {/* Selected Users */}
            {selectedUsers.length > 0 && (
                <div className="mb-3">
                    <div className="d-flex flex-wrap gap-2">
                        {selectedUsers.map(user => (
                            <Badge 
                                key={user.id} 
                                bg="light" 
                                text="dark" 
                                className="d-flex align-items-center py-2 px-2"
                                style={{ fontSize: '13px' }}
                            >
                                <UserAvatar user={user} size="sm" />
                                <span className="me-2">{user.name || 'Unknown User'}</span>
                                <button
                                    type="button"
                                    className="btn-close btn-close-sm"
                                    style={{ fontSize: '8px' }}
                                    onClick={() => removeUser(user.id)}
                                    disabled={disabled}
                                ></button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Input */}
            <InputGroup>
                <Form.Control
                    ref={searchRef}
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.length >= 2 && searchResults.length > 0) {
                            calculateDropdownPosition();
                            setShowDropdown(true);
                        }
                    }}
                    disabled={disabled}
                />
                <InputGroup.Text>
                    {isLoading ? (
                        <i className="ri-loader-2-line"></i>
                    ) : (
                        <i className="ri-search-line"></i>
                    )}
                </InputGroup.Text>
            </InputGroup>

            {/* Render dropdown as portal */}
            {renderDropdown()}
        </div>
    );
};

export default UserSelector;