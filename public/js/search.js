let currentPage = 1;
const pageSize = 20;
let loading = false;
let allCardsLoaded = false;

async function searchCards(page = 1, append = false) {
    const name = document.getElementById('name').value.trim();
    const type = document.getElementById('typeDropdown').value;
    const subtype = document.getElementById('subtypeDropdown').value;
    const supertype = document.getElementById('supertypeDropdown').value;
    const hpMin = parseInt(document.getElementById('hpMin').value.trim(), 10);
    const hpMax = parseInt(document.getElementById('hpMax').value.trim(), 10);

    const container = document.getElementById('card-results');

    // check if we are making a new search to clear results and reset the flag
    if (!append) {
        container.innerHTML = '';
        allCardsLoaded = false;
    }

    const filters = {};
    if (name) filters.name = name;
    if (type) filters.types = [type]; // could make dropdowns multiselect?
    if (subtype) filters.subtypes = [subtype];
    if (supertype) filters.supertype = supertype;
    if (!isNaN(hpMin)) filters.hp = { ...(filters.hp || {}), gte: hpMin };
    if (!isNaN(hpMax)) filters.hp = { ...(filters.hp || {}), lte: hpMax };

    // no empty searches, no searching while loading, no searching after the cards have been loaded (infinite scroll)
    if (Object.keys(filters).length === 0 || loading || allCardsLoaded) return;

    loading = true;

    try {
        const res = await fetch('/cards/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filters: filters,
                page,
                pageSize
            }),
        });

        const data = await res.json();

        if (!data.cards || data.cards.length === 0) {
            if (!append) container.innerHTML = '<p>No cards found.</p>';
            allCardsLoaded = true;
            return;
        }

        data.cards.forEach((card) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.innerHTML = `
        <img src="${card.images.small}" alt="${card.name}" />
        <h3>${card.name}</h3>
        <button data-id="${card.id}">Add to Collection</button>
      `;
            container.appendChild(cardEl);

            requestAnimationFrame(() => {
                cardEl.classList.add('loaded');
            });
        });

        if (data.cards.length < pageSize) {
            allCardsLoaded = true;
        }

        currentPage = page;
    } catch (err) {
        console.error('Search failed:', err);
        if (!append) container.innerHTML = '<p>Something went wrong.</p>';
    } finally {
        loading = false;
    }
}

// New Search
document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    currentPage = 1;
    searchCards(currentPage, false);
});

// Infinite scroll
window.addEventListener('scroll', () => { // infinite scroll needs to be debounced
    if (loading || allCardsLoaded) return;

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY;

    if (scrolled >= scrollable - 200) {
        searchCards(currentPage + 1, true);
    }
});

// Populate dropdowns
window.addEventListener('DOMContentLoaded', () => {
    // should probably be cached results from pokemontcg.io
    const filterEnum = {
        types: [
            'Colorless', 'Darkness', 'Dragon', 'Fairy', 'Fighting',
            'Fire', 'Grass', 'Lightning', 'Metal', 'Psychic', 'Water',
        ],
        subtypes: [
            'BREAK', 'Baby', 'Basic', 'EX', 'GX', 'Item', 'MEGA',
            'Pokémon Tool', 'Pokémon Tool F', 'Radiant', 'Restored',
            'Rocket’s Secret Machine', 'Single Strike', 'Special',
            'Stage 1', 'Stage 2', 'Supporter', 'Tag Team', 'Technical Machine',
            'V', 'VMAX', 'VSTAR'
        ],
        supertypes: [
            'Pokémon', 'Trainer', 'Energy'
        ]
    };

    populateDropdown('typeDropdown', filterEnum.types);
    populateDropdown('subtypeDropdown', filterEnum.subtypes);
    populateDropdown('supertypeDropdown', filterEnum.supertypes);
});

function populateDropdown(id, values) {
    const select = document.getElementById(id);
    values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}
