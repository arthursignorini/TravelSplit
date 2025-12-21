// Format currency
function formatCurrency(amount, currency = 'BRL') {
    const formatter = new Intl.NumberFormat(getLocaleFromCurrency(currency), {
        style: 'currency',
        currency: currency
    });
    return formatter.format(amount);
}

function getLocaleFromCurrency(currency) {
    const locales = {
        'BRL': 'pt-BR',
        'USD': 'en-US',
        'EUR': 'de-DE',
        'GBP': 'en-GB'
    };
    return locales[currency] || 'pt-BR';
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Create data URL for export
function createDataURL(data) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    return URL.createObjectURL(blob);
}

// Download file
function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export {
    formatCurrency,
    formatDate,
    createDataURL,
    downloadFile
};