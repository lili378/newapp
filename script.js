/* Main script:
   - Fetches outfits.json
   - Renders masonry cards
   - Filters by aesthetic & tags
   - Search
   - Favorites stored in localStorage
   - Favorites view (separate "page" inside main)
*/

const GALLERY = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const tagBtns = document.querySelectorAll('.tag-btn');
const favoritesBtn = document.getElementById('favorites-btn');
const viewTitle = document.getElementById('view-title');
const viewSub = document.getElementById('view-sub');
const emptyState = document.getElementById('emptyState');
const allBtn = document.getElementById('all-btn');

let outfits = [];
let shown = [];             // currently shown items
let favorites = JSON.parse(localStorage.getItem('mm_favorites') || '[]');

// fetch the JSON and render
fetch('outfits.json')
    .then(r => r.json())
    .then(data => {
        outfits = data;
        renderAll();
    })
    .catch(err => {
        console.error('Failed to load outfits.json', err);
        GALLERY.innerHTML = '<p style="padding:20px;color:#333">Could not load outfits.json</p>';
    });

// Render helpers
function renderAll() {
    shown = outfits.slice();
    viewTitle.textContent = 'All Outfits';
    viewSub.textContent = '';
    renderGallery(shown);
    setActiveFilter('all');
}

function renderGallery(list) {
    GALLERY.innerHTML = '';
    if (!list.length) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        list.forEach(item => {
            const card = document.createElement('article');
            card.className = 'card';
            card.dataset.id = item.id;
            card.dataset.category = item.category;
            // create the markup (image, band, heart, meta)
            card.innerHTML = `
        <img loading="lazy" src="${item.image}" alt="${escapeHtml(item.title)}" />
        <div class="band"></div>
        <button class="heart-btn ${favorites.includes(item.id) ? 'favorited' : ''}" aria-label="save outfit" data-id="${item.id}">
          ${favorites.includes(item.id) ? '❤️' : '🤍'}
        </button>
        <div class="meta">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${item.tags.map(t => prettifyTag(t)).join(' • ')}</p>
        </div>
      `;
            GALLERY.appendChild(card);
        });
    }
}

// Utilities
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function prettifyTag(t) { return String(t).replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()) }

// Filtering (aesthetic buttons)
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        setActiveFilter(filter);
        if (filter === 'all') { renderAll(); return; }
        if (filter === 'favorites') {
            const favItems = outfits.filter(o => favorites.includes(o.id));
            viewTitle.textContent = 'Favorites';
            viewSub.textContent = `${favItems.length} saved`;
            renderGallery(favItems);
            return;
        }
        const items = outfits.filter(o => o.category === filter);
        viewTitle.textContent = `${capitalize(filter)} `;
        viewSub.textContent = `${items.length} items`;
        renderGallery(items);
    });
});

function setActiveFilter(key) {
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === key));
}

// Tag filters
tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        // highlight active tag (toggle)
        tagBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const items = outfits.filter(o => o.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase()));
        viewTitle.textContent = prettifyTag(tag);
        viewSub.textContent = `${items.length} items`;
        renderGallery(items);
    });
});

// Search
searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) { renderAll(); return; }
    const items = outfits.filter(o => {
        return o.title.toLowerCase().includes(q)
            || o.category.toLowerCase().includes(q)
            || o.tags.join(' ').toLowerCase().includes(q);
    });
    viewTitle.textContent = `Search: "${q}"`;
    viewSub.textContent = `${items.length} results`;
    renderGallery(items);
});

// Heart / favorites click (delegate)
GALLERY.addEventListener('click', (e) => {
    const btn = e.target.closest('.heart-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;
    toggleFavorite(id, btn);
});

function toggleFavorite(id, btn) {
    const idx = favorites.indexOf(id);
    if (idx === -1) {
        favorites.push(id);
        btn.classList.add('favorited');
        btn.textContent = '❤️';
    } else {
        favorites.splice(idx, 1);
        btn.classList.remove('favorited');
        btn.textContent = '🤍';
    }
    localStorage.setItem('mm_favorites', JSON.stringify(favorites));
    // keep view consistent: if currently viewing favorites, refresh it
    if (document.querySelector('.filter-btn.active')?.dataset.filter === 'favorites') {
        const favItems = outfits.filter(o => favorites.includes(o.id));
        viewSub.textContent = `${favItems.length} saved`;
        renderGallery(favItems);
    }
}

// small helpers
function capitalize(s) { return s && (s[0].toUpperCase() + s.slice(1)) }



