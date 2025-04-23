let currentPage = 1;
const pageSize = 20;
let loading = false;
let allCardsLoaded = false;

// infinite scroll needs to be debounced
async function searchCards(page = 1, append = false) {
    const name = document.getElementById('name').value.trim();
    const results = document.getElementById('results');

    // check if we are making a new search to clear results and reset the flag
    if (!append) {
        results.innerHTML = '';
        allCardsLoaded = false;
    }

    // no empty searches, no searching while loading, no searching after the cards have been loaded (infinite scroll)
    if (!name || loading || allCardsLoaded) return;

    loading = true;

    try {
        const res = await fetch('/cards/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, page, pageSize }),
        });

        const cards = await res.json();

        if (!cards.data || cards.data.length === 0) {
            if (!append) results.innerHTML = '<p>No cards found.</p>';
            allCardsLoaded = true;
            return;
        }

        cards.data.forEach((card) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.innerHTML = `
                <img src="${card.images.small}" alt="${card.name}" />
                <h3>${card.name}</h3>
                <div class="button-group">
                    <button class="collection-btn" data-id="${card.id}">Add to Collection</button>
                    <button class="wishlist-btn" data-id="${card.id}">Add to Wishlist</button>
                </div>
                `;
            results.appendChild(cardEl);

            requestAnimationFrame(() => {
                cardEl.classList.add('loaded');
            });
        });

        if (cards.data.length < pageSize) {
            allCardsLoaded = true;
        }

        currentPage = page;
    } catch (err) {
        console.error('Search failed:', err);
        if (!append) results.innerHTML = '<p>Something went wrong.</p>';
    } finally {
        loading = false;
    }
}

function handleScroll() {
    if (loading || allCardsLoaded) return;

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY;

    if (scrolled >= scrollable - 200) {
        searchCards(currentPage + 1, true);
    }
}

document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    currentPage = 1;
    searchCards(currentPage, false);
});

window.addEventListener('scroll', handleScroll);
