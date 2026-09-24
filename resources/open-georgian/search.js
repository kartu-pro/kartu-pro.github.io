let searchIndex = null;
let timer = null;

const input = document.getElementById('search');
const dropdown = document.getElementById('dropdown');

async function ensureIndex() {
    if (!searchIndex) {
        dropdown.style.display = 'block';
        try {
            const res = await fetch('search_index.json');
            searchIndex = await res.json();
        } catch (err) {
            dropdown.innerHTML = '<div class="dropdown-item">Failed to load index</div>';
        }
        if (!input.value.trim()) dropdown.style.display = 'none';
    }
}

function findNodeWithPath(node, query, path = '') {
    if (!node) return { node: null, path: '' };
    // Fix: Return node when query reaches exact match
    if (query === '') return { node: node, path: path };
    if (!node.c) return { node: null, path: '' };

    for (const edge in node.c) {
        if (query.startsWith(edge)) {
            return findNodeWithPath(node.c[edge], query.slice(edge.length), path + edge);
        }
        if (edge.startsWith(query)) {
            return { node: node.c[edge], path: path + edge };
        }
    }
    return { node: null, path: '' };
}

function collectMatches(node, path, matches = new Map(), limit = 50) {
    if (!node || matches.size >= limit) return matches;
    if (node.i) {
        for (const id of node.i) {
            if (!matches.has(id)) {
                matches.set(id, path);
                if (matches.size >= limit) return matches;
            }
        }
    }
    if (node.c) {
        for (const edge in node.c) {
            collectMatches(node.c[edge], path + edge, matches, limit);
            if (matches.size >= limit) break;
        }
    }
    return matches;
}

function latinToGeorgian(str) {
    let s = str;
    // Map uppercase Georgian keyboard layout shortcuts
    const shiftMap = { 'R': 'ღ', 'T': 'თ', 'W': 'ჭ', 'S': 'შ', 'Z': 'ჟ', 'C': 'ჩ', 'J': 'ჯ', 'H': 'ჰ' };
    s = s.split('').map(char => shiftMap[char] || char).join('').toLowerCase();

    // Multi-char Latin transliterations
    s = s.replace(/ts'/g, 'წ').replace(/tz/g, 'წ').replace(/c'/g, 'წ')
         .replace(/ch'/g, 'ჭ').replace(/t'/g, 'ტ').replace(/k'/g, 'კ').replace(/p'/g, 'პ')
         .replace(/ts/g, 'ც').replace(/ch/g, 'ჩ').replace(/sh/g, 'შ').replace(/kh/g, 'ხ')
         .replace(/gh/g, 'ღ').replace(/dz/g, 'ძ').replace(/zh/g, 'ჟ').replace(/th/g, 'თ').replace(/ph/g, 'ფ');

    const charMap = {
        'a':'ა','b':'ბ','g':'გ','d':'დ','e':'ე','v':'ვ','w':'ვ','z':'ზ','t':'თ',
        'i':'ი','k':'ქ','l':'ლ','m':'მ','n':'ნ','o':'ო','p':'ფ','r':'რ',
        's':'ს','u':'უ','q':'ყ','c':'ც','j':'ჯ','h':'ჰ','x':'ხ'
    };
    return s.split('').map(c => charMap[c] || c).join('').replace(/'/g, '');
}

function initStickyContextNav() {
    const selectEl = document.getElementById('sticky-jump-select');
    // Find all valid section headings that have an ID
    const sections = Array.from(document.querySelectorAll('.jump-section[id]'));

    if (!selectEl || sections.length === 0) return;

    // 1. Populate dropdown options
    selectEl.innerHTML = sections.map(sec => {
        const id = sec.getAttribute('id');
        const title = sec.getAttribute('data-jump-title') || sec.textContent.trim();
        return `<option value="#${id}">${title}</option>`;
    }).join('');

    // 2. Handle dropdown selection jump
    selectEl.addEventListener('change', (e) => {
        const target = document.querySelector(e.target.value);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // 3. Sync dropdown selection on scroll
    const navHeight = 48;    // Matches --sticky-bar-height
    const marginOffset = 12; // Matches scroll-margin-top offset
    const tolerance = 5;     // Buffer for subpixel rendering
    const triggerThreshold = navHeight + marginOffset + tolerance;

    function updateActiveSection() {
        let activeSection = sections[0];

        for (const section of sections) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= triggerThreshold) {
                activeSection = section;
            } else {
                break;
            }
        }

        const activeId = '#' + activeSection.getAttribute('id');

        // Update dropdown option if changed
        if (selectEl.value !== activeId) {
            selectEl.value = activeId;
        }
    }

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    updateActiveSection();
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStickyContextNav);
} else {
    initStickyContextNav();
}

if (input) {
    input.addEventListener('focus', ensureIndex);
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
            await ensureIndex();
            const q = input.value.trim();
            if (!q) { dropdown.style.display = 'none'; return; }

            // Fix: Include apostrophes in ASCII detection
            const isAscii = /^[a-z0-9\s.,'-]+$/i.test(q);
            const qLower = q.toLowerCase();
            const qGeo = isAscii ? latinToGeorgian(q) : qLower;
            const matchesMap = new Map();

            const primaryMatch = findNodeWithPath(searchIndex.r, qLower);
            if (primaryMatch.node) collectMatches(primaryMatch.node, primaryMatch.path, matchesMap, 50);

            if (isAscii && qGeo !== qLower) {
                const geoMatch = findNodeWithPath(searchIndex.r, qGeo);
                if (geoMatch.node) collectMatches(geoMatch.node, geoMatch.path, matchesMap, 50);
            }

            const candidates = Array.from(matchesMap.keys());
            if (candidates.length === 0) {
                dropdown.innerHTML = '<div class="dropdown-item">No results</div>';
            } else {
                candidates.sort((a, b) => {
                    const wA = searchIndex.w[a], wB = searchIndex.w[b];
                    if (!wA || !wB) return 0;
                    const termA = matchesMap.get(a) || wA.l, termB = matchesMap.get(b) || wB.l;
                    const isExactA = (termA === qLower || termA === qGeo), isExactB = (termB === qLower || termB === qGeo);
                    if (isExactA && !isExactB) return -1;
                    if (!isExactA && isExactB) return 1;
                    return termA.length - termB.length;
                });

                dropdown.innerHTML = candidates.slice(0, 15).map(id => {
                    const w = searchIndex.w[id];
                    if (!w) return '';
                    const matchedForm = matchesMap.get(id) || w.l;
                    const isLemmaMatch = w.l.toLowerCase().startsWith(qLower) || w.l.toLowerCase().startsWith(qGeo);
                    const isTransMatch = !isLemmaMatch && w.t && w.t.toLowerCase().includes(qLower);
                    let displayLabel = `<strong>${w.l}</strong>`;
                    if (!isLemmaMatch && !isTransMatch) {
                        displayLabel = `<strong>${matchedForm}</strong> <small style="color:#6c757d;">(form of ${w.l})</small>`;
                    }
                    return `<div class="dropdown-item" onclick="window.location='${id}/'">${displayLabel} | ${w.p}${w.t ? ' | ' + w.t : ''}</div>`;
                }).join('');
            }
            dropdown.style.display = 'block';
        }, 100);
    });
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) dropdown.style.display = 'none';
});
