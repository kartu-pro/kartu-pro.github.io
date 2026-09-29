let searchIndex = null;
let timer = null;

const input = document.getElementById('search');
const dropdown = document.getElementById('dropdown');

async function ensureIndex() {
    if (!searchIndex) {
        dropdown.style.display = 'block';
        dropdown.innerHTML = '<div class="dropdown-item loading">Loading search index...</div>';
        try {
            const res = await fetch('search_index.json');
            searchIndex = await res.json();
            dropdown.innerHTML = '';
        } catch (err) {
            dropdown.innerHTML = '<div class="dropdown-item">Failed to load index</div>';
        }
        if (!input.value.trim()) dropdown.style.display = 'none';
    }
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

// Binary search to find lower bound index in sorted terms
function findLowerBound(terms, prefix) {
    let low = 0, high = terms.length - 1;
    let result = terms.length;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (terms[mid] >= prefix) {
            result = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    return result;
}

// Collect matches using binary search + linear prefix scan
function collectMatches(prefix, matchesMap, limit = 50) {
    if (!prefix || !searchIndex || !searchIndex.t) return;
    
    const terms = searchIndex.t;
    const startIdx = findLowerBound(terms, prefix);

    for (let i = startIdx; i < terms.length; i++) {
        const term = terms[i];
        if (!term.startsWith(prefix)) break;

        const ids = searchIndex.i[i];
        if (Array.isArray(ids)) {
            for (const id of ids) {
                if (!matchesMap.has(id)) matchesMap.set(id, term);
            }
        } else {
            if (!matchesMap.has(ids)) matchesMap.set(ids, term);
        }

        if (matchesMap.size >= limit) break;
    }
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



if (input) {
    input.addEventListener('focus', ensureIndex);
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
            await ensureIndex();
            const rawQ = input.value.trim();
            if (!rawQ) { dropdown.style.display = 'none'; return; }

            const qLower = rawQ.toLowerCase();
            // Preserve apostrophes (') and hyphens (-) within words, split on punctuation/spaces
            const qClean = qLower
                .replace(/[,;/]/g, ' ')
                .replace(/[^\w\s\u0100-\uFFFF'-]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            const qTokens = qClean.split(' ').filter(Boolean);

            const isAscii = /^[a-z0-9\s.,''-]+$/i.test(rawQ);
            const qGeo = isAscii ? latinToGeorgian(rawQ) : qLower;
            const matchesMap = new Map();

            // Collect match candidates for query tokens and transliteration
            qTokens.forEach(token => collectMatches(token, matchesMap, 100));
            if (isAscii && qGeo !== qLower) {
                collectMatches(qGeo, matchesMap, 100);
            }

            let candidates = Array.from(matchesMap.keys());

            // Multi-token filter (e.g. "do, make"): require translation to contain all tokens
            if (qTokens.length > 1) {
                candidates = candidates.filter(id => {
                    const w = searchIndex.w[id];
                    if (!w) return false;
                    const trans = (w[2] || '').toLowerCase();
                    return qTokens.every(tok => trans.includes(tok));
                });
            }

            if (candidates.length === 0) {
                dropdown.innerHTML = '<div class="dropdown-item">No results</div>';
            } else {
                const parseGlosses = (transStr) => {
                    if (!transStr) return [];
                    return transStr
                        .toLowerCase()
                        .split(/[,;/]+/)
                        .map(g => g.replace(/\([^)]*\)/g, '').trim())
                        .filter(Boolean);
                };

                candidates.sort((a, b) => {
                    const wA = searchIndex.w[a], wB = searchIndex.w[b];
                    if (!wA || !wB) return 0;

                    const lemmaA = wA[0].toLowerCase(), lemmaB = wB[0].toLowerCase();
                    const transA = (wA[2] || '').toLowerCase();
                    const transB = (wB[2] || '').toLowerCase();

                    const termA = (matchesMap.get(a) || lemmaA).toLowerCase();
                    const termB = (matchesMap.get(b) || lemmaB).toLowerCase();

                    const glossesA = parseGlosses(transA);
                    const glossesB = parseGlosses(transB);

                    const getScore = (lemma, term, trans, glosses) => {
                        const targets = [qLower, qClean, qGeo].filter(Boolean);

                        // 0: Exact Lemma Match
                        if (targets.includes(lemma)) return 0;

                        // 10: Exact Inflected Form Match
                        if (targets.includes(term)) return 10;

                        // 15: Exact Gloss Match
                        if (targets.some(t => glosses.includes(t) || trans === t)) return 15;

                        // 20: Prefix Match on Lemma
                        if (targets.some(t => lemma.startsWith(t))) return 20;

                        // 25: Prefix Match on Translation Gloss
                        if (targets.some(t => glosses.some(g => g.startsWith(t)))) return 25;

                        // 30: Prefix Match on Inflected Form
                        if (targets.some(t => term.startsWith(t))) return 30;

                        // 35: Substring Match on Translation
                        if (targets.some(t => trans.includes(t) || (qTokens.length > 0 && qTokens.every(tok => trans.includes(tok))))) return 35;

                        return 40;
                    };

                    const scoreA = getScore(lemmaA, termA, transA, glossesA);
                    const scoreB = getScore(lemmaB, termB, transB, glossesB);

                    if (scoreA !== scoreB) return scoreA - scoreB;

                    if (transA.length !== transB.length) {
                        return transA.length - transB.length;
                    }

                    if (termA.length !== termB.length) {
                        return termA.length - termB.length;
                    }

                    return lemmaA.localeCompare(lemmaB);
                });

                dropdown.innerHTML = candidates.slice(0, 15).map(id => {
                    const w = searchIndex.w[id];
                    if (!w) return '';
                    const [lemma, pos, trans, uuid] = w;
                    const matchedForm = matchesMap.get(id) || lemma;
                    const isSame = matchedForm.toLowerCase() === lemma.toLowerCase();

                    return `
                      <div class="dropdown-item" onclick="window.location='${uuid}/'">
                        <div class="item-header">
                          <div class="item-title">
                            <span class="matched-form">${matchedForm}</span>
                            ${!isSame ? `<span class="lemma-ref">(lemma: <em>${lemma}</em>)</span>` : ''}
                          </div>
                          <span class="pos-badge">${pos}</span>
                        </div>
                        ${trans ? `<div class="item-trans">${trans}</div>` : ''}
                      </div>
                    `;
                }).join('');
            }
            dropdown.style.display = 'block';
        }, 100);
    });
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) dropdown.style.display = 'none';
});

document.addEventListener('copy', (e) => {
    const selection = window.getSelection().toString();
    if (!selection) return;
    const cleanedText = selection.replace(/\t+/g, ''); // remove tabs
    e.clipboardData.setData('text/plain', cleanedText);
    e.preventDefault();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ensureIndex();
        initStickyContextNav();
    });
} else {
    ensureIndex();
    initStickyContextNav();
}

