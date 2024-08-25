document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results');

    let debounceTimeout;

    searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            const query = searchInput.value.toLowerCase();
            fetchResults(query);
        }, 300);
    });

    async function fetchResults(query) {
        if (query.length === 0) {
            resultsContainer.innerHTML = '';
            return;
        }

        try {
            const response = await fetch('https://swapi.dev/api/');
            const data = await response.json();
            await displayResults(data, query);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    async function displayResults(data, query) {
        resultsContainer.innerHTML = ''; 

        const results = new Set();

        for (const [key, url] of Object.entries(data)) {
            if (['people', 'planets', 'starships', 'vehicles', 'species'].includes(key)) {
                try {
                    const response = await fetch(url);
                    const resultsData = await response.json();
                    
                    const filteredResults = resultsData.results.filter(item =>
                        item.name.toLowerCase().includes(query)
                    );

                    for (const item of filteredResults) {
                        console.log(`Processing item: ${item.name}, Type: ${key}`);
                        console.log('Item data:', item);

                        const filmNames = await Promise.all(item.films.map(async filmUrl => {
                            try {
                                const filmResponse = await fetch(filmUrl);
                                const filmData = await filmResponse.json();
                                return filmData.title;
                            } catch (error) {
                                console.error('Error fetching film data:', error);
                                return 'Unknown';
                            }
                        }));

                        let homeworld = 'Unknown';
                        if (item.homeworld) {
                            try {
                                const homeworldResponse = await fetch(item.homeworld);
                                const homeworldData = await homeworldResponse.json();
                                homeworld = homeworldData.name;
                            } catch (error) {
                                console.error('Error fetching homeworld data:', error);
                            }
                        }

                        let species = 'Unknown';
                        if (key === 'people') {
                            if (item.species && item.species.length > 0) {
                                console.log('Species URL:', item.species[0]);
                                try {
                                    const speciesResponse = await fetch(item.species[0]);
                                    if (!speciesResponse.ok) {
                                        throw new Error(`HTTP error! status: ${speciesResponse.status}`);
                                    }
                                    const speciesData = await speciesResponse.json();
                                    species = speciesData.name;
                                    console.log('Species data:', speciesData);
                                } catch (error) {
                                    console.error('Error fetching species data:', error);
                                    species = 'Error fetching species';
                                }
                            } else {
                                console.log('No species URL provided, assuming Human');
                                species = 'Human';
                            }
                        } else if (key === 'species') {
                            species = item.name;
                        }

                        results.add({
                            name: item.name,
                            type: key,
                            films: filmNames.join(', '),
                            homeworld: homeworld,
                            species: species
                        });

                        await delay(100); // Espera 100ms entre solicitudes
                    }
                } catch (error) {
                    console.error(`Error fetching ${key}:`, error);
                }
            }
        }

        const sortedResults = Array.from(results).sort((a, b) => a.name.localeCompare(b.name));

        resultsContainer.innerHTML = sortedResults.map(result => `
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${result.name}</h5>
                        <p class="card-text">Type: ${result.type}</p>
                        <p class="card-text">Films: ${result.films}</p>
                        <p class="card-text">Homeworld: ${result.homeworld}</p>
                        <p class="card-text">Species: ${result.species}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
});