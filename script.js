document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = 'https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json';
    let superheroes = [];
    let filteredData = [];
    let currentPage = 1;
    let pageSize = 20;
    let sortColumn = null;
    let sortOrder = 'asc';
    let searchField = 'name';
    let searchOperator = 'include';
    let searchValue = '';

    // Fetch data from the API
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            superheroes = data;
            parseUrlParams();
            applyFilters();
            renderTable();
        })
        .catch(error => console.error('Error fetching data:', error));

    // Render the table
    function renderTable() {
        const tbody = document.querySelector('#superheroTable tbody');
        tbody.innerHTML = '';

        const start = (currentPage - 1) * pageSize;
        const end = pageSize === 'all' ? filteredData.length : start + pageSize;
        const paginatedData = filteredData.slice(start, end);

        paginatedData.forEach(hero => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${hero.images.xs}" alt="${hero.name}"></td>
                <td><a href="#" class="hero-link" data-id="${hero.id}">${hero.name}</a></td>
                <td>${hero.biography.fullName || 'N/A'}</td>
                <td>${Object.entries(hero.powerstats).map(([key, value]) => `${key}: ${value}`).join(', ')}</td>
                <td>${hero.appearance.race || 'N/A'}</td>
                <td>${hero.appearance.gender || 'N/A'}</td>
                <td>${hero.appearance.height.join(', ') || 'N/A'}</td>
                <td>${hero.appearance.weight.join(', ') || 'N/A'}</td>
                <td>${hero.biography.placeOfBirth || 'N/A'}</td>
                <td>${hero.biography.alignment || 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });

        updatePaginationControls();
        updateSortIndicators();
    }

    // Update pagination controls
    function updatePaginationControls() {
        const totalPages = Math.ceil(filteredData.length / (pageSize === 'all' ? filteredData.length : pageSize));
        document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage === totalPages;
    }

    // Update sort indicators
    function updateSortIndicators() {
        document.querySelectorAll('#superheroTable th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            const column = th.dataset.column;
            if (column === sortColumn) {
                th.classList.add(sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });
    }

    // Apply filters and search
    function applyFilters() {
        filteredData = superheroes.filter(hero => {
            const searchableFields = getSearchableFields(hero);
            let matches = false;

            switch (searchOperator) {
                case 'include':
                    matches = Object.values(searchableFields).some(value =>
                        value.toLowerCase().includes(searchValue.toLowerCase())
                    );
                    break;
                case 'exclude':
                    matches = !Object.values(searchableFields).some(value =>
                        value.toLowerCase().includes(searchValue.toLowerCase())
                    );
                    break;
                case 'equal':
                    matches = Object.values(searchableFields).some(value =>
                        value.toLowerCase() === searchValue.toLowerCase()
                    );
                    break;
                case 'notEqual':
                    matches = Object.values(searchableFields).some(value =>
                        value.toLowerCase() !== searchValue.toLowerCase()
                    );
                    break;
                case 'greaterThan':
                    matches = Object.values(searchableFields).some(value =>
                        parseFloat(value) > parseFloat(searchValue)
                    );
                    break;
                case 'lessThan':
                    matches = Object.values(searchableFields).some(value =>
                        parseFloat(value) < parseFloat(searchValue)
                    );
                    break;
            }

            return matches;
        });
    }

    // Update the URL with search parameters
    function updateUrlParams() {
        const params = new URLSearchParams();
        params.set('page', currentPage);
        params.set('pageSize', pageSize);
        params.set('searchField', searchField);
        params.set('searchOperator', searchOperator);
        params.set('searchValue', searchValue);
        history.pushState(null, '', '?' + params.toString());
    }

    // Parse URL parameters on page load
    function parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        currentPage = parseInt(params.get('page')) || 1;
        pageSize = params.get('pageSize') || 20;
        searchField = params.get('searchField') || 'name';
        searchOperator = params.get('searchOperator') || 'include';
        searchValue = params.get('searchValue') || '';
    }

    // Get searchable fields based on the selected search field
    function getSearchableFields(hero) {
        switch (searchField) {
            case 'fullname':
                return { 'Full Name': hero.biography.fullName || '' };
            case 'powerstats':
                return hero.powerstats;
            case 'race':
                return { 'Race': hero.appearance.race || '' };
            case 'gender':
                return { 'Gender': hero.appearance.gender || '' };
            case 'height':
                return { 'Height': hero.appearance.height.join(', ') || '' };
            case 'weight':
                return { 'Weight': hero.appearance.weight.join(', ') || '' };
            case 'placeofbirth':
                return { 'Place of Birth': hero.biography.placeOfBirth || '' };
            case 'alignment':
                return { 'Alignment': hero.biography.alignment || '' };
            default:
                return { 'Name': hero.name };
        }
    }

    // Event listeners
    document.getElementById('search').addEventListener('input', () => {
        searchValue = document.getElementById('search').value;
        applyFilters();
        renderTable();
        updateUrlParams();
    });

    document.getElementById('searchField').addEventListener('change', (event) => {
        searchField = event.target.value;
        document.getElementById('search').dispatchEvent(new Event('input'));
    });

    document.getElementById('searchOperator').addEventListener('change', (event) => {
        searchOperator = event.target.value;
        document.getElementById('search').dispatchEvent(new Event('input'));
    });

    document.getElementById('searchValue').addEventListener('input', () => {
        searchValue = document.getElementById('searchValue').value;
        applyFilters();
        renderTable();
        updateUrlParams();
    });

    document.getElementById('pageSize').addEventListener('change', (event) => {
        pageSize = event.target.value;
        currentPage = 1;
        applyFilters();
        renderTable();
        updateUrlParams();
    });

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            applyFilters();
            renderTable();
            updateUrlParams();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / (pageSize === 'all' ? filteredData.length : pageSize));
        if (currentPage < totalPages) {
            currentPage++;
            applyFilters();
            renderTable();
            updateUrlParams();
        }
    });

    document.querySelectorAll('#superheroTable th').forEach((th, index) => {
        th.dataset.column = th.textContent.trim().toLowerCase().replace(/ /g, '');
        th.addEventListener('click', () => {
            const key = th.dataset.column;
            if (sortColumn === key) {
                sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                sortOrder = 'asc';
                sortColumn = key;
            }

            filteredData.sort((a, b) => {
                let valueA = extractValue(a, key);
                let valueB = extractValue(b, key);

                if (sortOrder === 'asc') {
                    if (isNaN(valueA) || isNaN(valueB)) {
                        return (valueA || '').localeCompare(valueB || '');
                    }
                    return valueA - valueB;
                } else {
                    if (isNaN(valueA) || isNaN(valueB)) {
                        return (valueB || '').localeCompare(valueA || '');
                    }
                    return valueB - valueA;
                }
            });

            // Ensure missing values are always last
            filteredData.sort((a, b) => {
                const aMissing = !extractValue(a, sortColumn);
                const bMissing = !extractValue(b, sortColumn);
                if (aMissing && !bMissing) return 1;
                if (!aMissing && bMissing) return -1;
                return 0;
            });

            renderTable();
            updateSortIndicators();
            updateUrlParams();
        });
    });

    function extractValue(hero, key) {
        switch (key) {
            case 'icon':
                return ''; // No need to sort images
            case 'powerstats':
                return ''; // No direct sort for powerstats
            case 'name':
                return hero.name;
            case 'fullname':
                return hero.biography.fullName || '';
            case 'race':
                return hero.appearance.race || '';
            case 'gender':
                return hero.appearance.gender || '';
            case 'height':
                return parseFloat(hero.appearance.height[0]) || NaN; // Handle first height value
            case 'weight':
                return parseFloat(hero.appearance.weight[0]) || NaN; // Handle first weight value
            case 'placeofbirth':
                return hero.biography.placeOfBirth || '';
            case 'alignment':
                return hero.biography.alignment || '';
            default:
                return '';
        }
    }

    // Click event for hero details
    document.querySelector('#superheroTable').addEventListener('click', (event) => {
        if (event.target.classList.contains('hero-link')) {
            event.preventDefault();
            const heroId = event.target.dataset.id;
            const hero = superheroes.find(h => h.id === heroId);
            showHeroDetails(hero);
        }
    });

    function showHeroDetails(hero) {
        document.getEadocument.addEventListener('DOMContentLoaded', () => {
            const apiUrl = 'https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json';
            let superheroes = [];
            let filteredData = [];
            let currentPage = 1;
            let pageSize = 20;
            let sortColumn = null;
            let sortOrder = 'asc';
            let searchField = 'name';
            let searchOperator = 'include';
            let searchValue = '';
        
            // Fetch data from the API
            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    superheroes = data;
                    parseUrlParams();
                    applyFilters();
                    renderTable();
                })
                .catch(error => console.error('Error fetching data:', error));
        
            // Render the table
            function renderTable() {
                const tbody = document.querySelector('#superheroTable tbody');
                tbody.innerHTML = '';
        
                const start = (currentPage - 1) * pageSize;
                const end = pageSize === 'all' ? filteredData.length : start + pageSize;
                const paginatedData = filteredData.slice(start, end);
        
                paginatedData.forEach(hero => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><img src="${hero.images.xs}" alt="${hero.name}"></td>
                        <td><a href="#" class="hero-link" data-id="${hero.id}">${hero.name}</a></td>
                        <td>${hero.biography.fullName || 'N/A'}</td>
                        <td>${Object.entries(hero.powerstats).map(([key, value]) => `${key}: ${value}`).join(', ')}</td>
                        <td>${hero.appearance.race || 'N/A'}</td>
                        <td>${hero.appearance.gender || 'N/A'}</td>
                        <td>${hero.appearance.height.join(', ') || 'N/A'}</td>
                        <td>${hero.appearance.weight.join(', ') || 'N/A'}</td>
                        <td>${hero.biography.placeOfBirth || 'N/A'}</td>
                        <td>${hero.biography.alignment || 'N/A'}</td>
                    `;
                    tbody.appendChild(tr);
                });
        
                updatePaginationControls();
                updateSortIndicators();
            }
        
            // Update pagination controls
            function updatePaginationControls() {
                const totalPages = Math.ceil(filteredData.length / (pageSize === 'all' ? filteredData.length : pageSize));
                document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
                document.getElementById('prevPage').disabled = currentPage === 1;
                document.getElementById('nextPage').disabled = currentPage === totalPages;
            }
        
            // Update sort indicators
            function updateSortIndicators() {
                document.querySelectorAll('#superheroTable th').forEach(th => {
                    th.classList.remove('sort-asc', 'sort-desc');
                    const column = th.dataset.column;
                    if (column === sortColumn) {
                        th.classList.add(sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
                    }
                });
            }
        
            // Apply filters and search
            function applyFilters() {
                filteredData = superheroes.filter(hero => {
                    const searchableFields = getSearchableFields(hero);
                    let matches = false;
        
                    switch (searchOperator) {
                        case 'include':
                            matches = Object.values(searchableFields).some(value =>
                                value.toLowerCase().includes(searchValue.toLowerCase())
                            );
                            break;
                        case 'exclude':
                            matches = !Object.values(searchableFields).some(value =>
                                value.toLowerCase().includes(searchValue.toLowerCase())
                            );
                            break;
                        case 'equal':
                            matches = Object.values(searchableFields).some(value =>
                                value.toLowerCase() === searchValue.toLowerCase()
                            );
                            break;
                        case 'notEqual':
                            matches = Object.values(searchableFields).some(value =>
                                value.toLowerCase() !== searchValue.toLowerCase()
                            );
                            break;
                        case 'greaterThan':
                            matches = Object.values(searchableFields).some(value =>
                                parseFloat(value) > parseFloat(searchValue)
                            );
                            break;
                        case 'lessThan':
                            matches = Object.values(searchableFields).some(value =>
                                parseFloat(value) < parseFloat(searchValue)
                            );
                            break;
                    }
        
                    return matches;
                });
        
                if (sortColumn) {
                    filteredData.sort((a, b) => {
                        const aValue = extractValue(a, sortColumn);
                        const bValue = extractValue(b, sortColumn);
        
                        // Handle missing values
                        const aMissing = aValue === '' || isNaN(aValue);
                        const bMissing = bValue === '' || isNaN(bValue);
        
                        if (aMissing && !bMissing) return 1;
                        if (!aMissing && bMissing) return -1;
        
                        if (typeof aValue === 'number' && typeof bValue === 'number') {
                            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                        } else {
                            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
                            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
                            return 0;
                        }
                    });
                }
        
                renderTable();
                updateUrlParams();
            }
        
            // Extract value based on the column key
            function extractValue(hero, key) {
                switch (key) {
                    case 'icon':
                        return ''; // No need to sort images
                    case 'powerstats':
                        return ''; // No direct sort for powerstats
                    case 'name':
                        return hero.name;
                    case 'fullname':
                        return hero.biography.fullName || '';
                    case 'race':
                        return hero.appearance.race || '';
                    case 'gender':
                        return hero.appearance.gender || '';
                    case 'height':
                        return parseFloat(hero.appearance.height[0]) || NaN; // Handle first height value
                    case 'weight':
                        return parseFloat(hero.appearance.weight[0]) || NaN; // Handle first weight value
                    case 'placeofbirth':
                        return hero.biography.placeOfBirth || '';
                    case 'alignment':
                        return hero.biography.alignment || '';
                    default:
                        return '';
                }
            }
        
            // Handle sorting by column header
            document.querySelectorAll('#superheroTable th').forEach(th => {
                th.addEventListener('click', () => {
                    const column = th.dataset.column;
        
                    if (sortColumn === column) {
                        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                    } else {
                        sortColumn = column;
                        sortOrder = 'asc';
                    }
        
                    applyFilters();
                });
            });
        
            // Handle pagination
            document.getElementById('prevPage').addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderTable();
                }
            });
        
            document.getElementById('nextPage').addEventListener('click', () => {
                const totalPages = Math.ceil(filteredData.length / (pageSize === 'all' ? filteredData.length : pageSize));
                if (currentPage < totalPages) {
                    currentPage++;
                    renderTable();
                }
            });
        
            // Handle page size change
            document.getElementById('pageSize').addEventListener('change', (e) => {
                pageSize = e.target.value;
                currentPage = 1;
                renderTable();
            });
        
            // Handle search value change
            document.getElementById('searchValue').addEventListener('input', (e) => {
                searchValue = e.target.value;
                applyFilters();
            });
        
            // Handle search field change
            document.getElementById('searchField').addEventListener('change', (e) => {
                searchField = e.target.value;
                applyFilters();
            });
        
            // Handle search operator change
            document.getElementById('searchOperator').addEventListener('change', (e) => {
                searchOperator = e.target.value;
                applyFilters();
            });
        
            // Click event for hero details
            document.querySelector('#superheroTable').addEventListener('click', (event) => {
                if (event.target.classList.contains('hero-link')) {
                    event.preventDefault();
                    const heroId = event.target.dataset.id;
                    const hero = superheroes.find(h => h.id === heroId);
                    showHeroDetails(hero);
                }
            });
        
            function showHeroDetails(hero) {
                document.getElementById('detailImage').src = hero.images.md;
                document.getElementById('detailInfo').innerHTML = `
                    <h2>${hero.name}</h2>
                    <p><strong>Full Name:</strong> ${hero.biography.fullName || 'N/A'}</p>
                    <p><strong>Powerstats:</strong> ${Object.entries(hero.powerstats).map(([key, value]) => `${key}: ${value}`).join(', ')}</p>
                    <p><strong>Race:</strong> ${hero.appearance.race || 'N/A'}</p>
                    <p><strong>Gender:</strong> ${hero.appearance.gender || 'N/A'}</p>
                    <p><strong>Height:</strong> ${hero.appearance.height.join(', ') || 'N/A'}</p>
                    <p><strong>Weight:</strong> ${hero.appearance.weight.join(', ') || 'N/A'}</p>
                    <p><strong>Place of Birth:</strong> ${hero.biography.placeOfBirth || 'N/A'}</p>
                    <p><strong>Alignment:</strong> ${hero.biography.alignment || 'N/A'}</p>
                `;
                document.getElementById('detailView').style.display = 'block';
            }
        
            document.getElementById('closeDetailView').addEventListener('click', () => {
                document.getElementById('detailView').style.display = 'none';
            });
        
            // Update URL parameters
            function updateUrlParams() {
                const params = new URLSearchParams({
                    searchField,
                    searchOperator,
                    searchValue,
                    pageSize,
                    currentPage,
                    sortColumn,
                    sortOrder
                });
                window.history.replaceState({}, '', '?' + params.toString());
            }
        
            // Parse URL parameters
            function parseUrlParams() {
                const params = new URLSearchParams(window.location.search);
                searchField = params.get('searchField') || 'name';
                searchOperator = params.get('searchOperator') || 'include';
                searchValue = params.get('searchValue') || '';
                pageSize = params.get('pageSize') || '20';
                currentPage = parseInt(params.get('currentPage'), 10) || 1;
                sortColumn = params.get('sortColumn') || 'name';
                sortOrder = params.get('sortOrder') || 'asc';
            }
        
            window.addEventListener('popstate', () => {
                parseUrlParams();
                applyFilters();
                renderTable();
            });
        });
        lementById('detailImage').src = hero.images.md;
        document.getElementById('detailInfo').innerHTML = `
            <h2>${hero.name}</h2>
            <p><strong>Full Name:</strong> ${hero.biography.fullName || 'N/A'}</p>
            <p><strong>Powerstats:</strong> ${Object.entries(hero.powerstats).map(([key, value]) => `${key}: ${value}`).join(', ')}</p>
            <p><strong>Race:</strong> ${hero.appearance.race || 'N/A'}</p>
            <p><strong>Gender:</strong> ${hero.appearance.gender || 'N/A'}</p>
            <p><strong>Height:</strong> ${hero.appearance.height.join(', ') || 'N/A'}</p>
            <p><strong>Weight:</strong> ${hero.appearance.weight.join(', ') || 'N/A'}</p>
            <p><strong>Place of Birth:</strong> ${hero.biography.placeOfBirth || 'N/A'}</p>
            <p><strong>Alignment:</strong> ${hero.biography.alignment || 'N/A'}</p>
        `;
        document.getElementById('detailView').style.display = 'block';
    }

    window.addEventListener('popstate', () => {
        parseUrlParams();
        applyFilters();
        renderTable();
    });
});
