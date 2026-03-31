/**
 * Kullanıcının rolüne göre ana sayfa URL'sini döndürür
 */
export const getRoleBasedHomeUrl = (user: any): string => {
    if (!user || !user.roles || user.roles.length === 0) {
        return '/dashboard';
    }

    // Super Admin ve Administrator için dashboard
    const userRoles = user.roles.map((role: any) => role.name);
    if (userRoles.includes('Super Admin') || userRoles.includes('Administrator')) {
        return '/dashboard';
    }

    // İlk rolü al
    const firstRole = user.roles[0];
    if (!firstRole) {
        return '/dashboard';
    }

    // Rol adını URL-friendly hale getir
    const roleSlug = createSlug(firstRole.name);
    
    // Mevcut sayfalar
    const availablePages: { [key: string]: string } = {
        'sales-manager': '/dashboard/sales-manager',
        'sales-representative': '/sales-representative', 
        'dealer': '/dealer',
        'satici': '/satici',
        'muhasebe': '/muhasebe',
        'insan-kaynaklari': '/insan-kaynaklari',
        'teknik': '/dashboard',
        'pazarlama': '/dashboard',
    };

    return availablePages[roleSlug] || '/dashboard';
};

/**
 * Rol adını slug haline getir
 */
export const createSlug = (name: string): string => {
    // Türkçe karakterleri dönüştür
    const replacements: { [key: string]: string } = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G', 
        'ı': 'i', 'I': 'I',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U',
        'ö': 'o', 'Ö': 'O',
    };
    
    let processedName = name;
    Object.keys(replacements).forEach(key => {
        processedName = processedName.replace(new RegExp(key, 'g'), replacements[key]);
    });
    
    return processedName.toLowerCase().replace(/[\s_]+/g, '-');
};

/**
 * Kullanıcının belirli rollere sahip olup olmadığını kontrol eder
 */
export const hasRole = (user: any, roles: string[]): boolean => {
    if (!user || !user.roles || user.roles.length === 0) {
        return false;
    }

    const userRoles = user.roles.map((role: any) => role.name);
    return roles.some(role => userRoles.includes(role));
};