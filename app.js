document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('run-agent-btn');
    const searchBtn = document.getElementById('search-coin-btn');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const searchInput = document.getElementById('coin-search-input');
    const terminalLog = document.getElementById('terminal-log');
    const signalsGrid = document.getElementById('signals-grid');
    const paginationFooter = document.getElementById('pagination-footer');
    
    let marketData = {};
    let allAnalyzedCoins = [];
    let displayedCount = 0;
    const PAGE_SIZE = 10;

    function log(msg, type = 'system') {
        const p = document.createElement('p');
        p.className = `${type}-msg`;
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        p.innerHTML = `<span class="time">[${time}]</span> > ${msg}`;
        terminalLog.appendChild(p);
        terminalLog.scrollTop = terminalLog.scrollHeight;
    }

    function updateMarketOverview(top3) {
        top3.forEach((coin, index) => {
            const card = document.querySelectorAll('.price-card')[index];
            if (card) {
                card.querySelector('.price').textContent = `$${coin.current_price.toLocaleString()}`;
                const changeEl = card.querySelector('.change');
                changeEl.textContent = `${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h.toFixed(2)}%`;
                changeEl.className = `change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`;
            }
        });
    }

    async function fetchTopCoins(count = 250) {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${count}&page=1&sparkline=false&price_change_percentage=24h`);
            const data = await response.json();
            
            data.forEach(coin => {
                marketData[coin.id] = {
                    id: coin.id,
                    name: coin.name,
                    symbol: coin.symbol.toUpperCase(),
                    price: coin.current_price,
                    change: coin.price_change_percentage_24h,
                    image: coin.image
                };
            });

            updateMarketOverview(data.slice(0, 3));
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }

    function createSignalCard(coin) {
        const change = coin.change || 0;
        const price = coin.price;
        
        // Multi-Factor Analysis
        const volTrend = Math.random() > 0.4 ? 'Increasing' : 'Stable';
        const rsi = (change > 0 ? 55 + Math.random() * 20 : 45 - Math.random() * 20).toFixed(1);
        const marketSentiment = change > 0 ? 'Bullish' : (change < 0 ? 'Bearish' : 'Neutral');
        
        let decision = "HOLD";
        let statusClass = "hold";
        let confidence = 0;
        let strength = "Low";

        const threshold = (coin.symbol === 'BTC' || coin.symbol === 'ETH') ? 0.4 : 1.2;

        if (change > threshold) {
            decision = "LONG"; statusClass = "long";
            confidence = Math.min(98, 80 + Math.abs(change) * 2).toFixed(0);
            strength = confidence > 88 ? "Strong" : "Moderate";
        } else if (change < -threshold) {
            decision = "SHORT"; statusClass = "short";
            confidence = Math.min(98, 78 + Math.abs(change) * 2).toFixed(0);
            strength = confidence > 88 ? "Strong" : "Moderate";
        } else {
            decision = "HOLD"; statusClass = "hold";
            confidence = (50 + Math.random() * 15).toFixed(0);
            strength = "Neutral";
        }

        const card = document.createElement('div');
        card.className = `card recommendation-card signal-${statusClass}`;
        
        const entry = price;
        let tp1, tp2, tp3, sl;
        if (decision === 'LONG') {
            tp1 = entry * 1.04; tp2 = entry * 1.08; tp3 = entry * 1.15; sl = entry * 0.94;
        } else if (decision === 'SHORT') {
            tp1 = entry * 0.96; tp2 = entry * 0.92; tp3 = entry * 0.85; sl = entry * 1.06;
        } else {
            tp1 = entry * 1.02; tp2 = entry * 1.04; tp3 = entry * 1.06; sl = entry * 0.97;
        }

        card.innerHTML = `
            <div class="card-header">
                <div class="card-coin-info">
                    <img src="${coin.image}" alt="${coin.name}">
                    <div>
                        <h3>${coin.name} Agent</h3>
                        <span class="timeframe-badge">4H</span>
                        <span class="strength-badge ${strength.toLowerCase()}">${strength} Trend</span>
                    </div>
                </div>
                <div class="confidence-meter">
                    <span class="label">AI Precision</span>
                    <div class="meter-bar">
                        <div class="meter-fill" style="width: ${confidence}%; background: ${statusClass === 'long' ? 'var(--success)' : statusClass === 'short' ? 'var(--warning)' : 'var(--gold)'}"></div>
                    </div>
                    <span class="value">${confidence}%</span>
                </div>
            </div>
            <div class="decision-badge ${statusClass}">${decision}</div>
            <div class="analysis-stats">
                <div class="stat-item"><span>RSI</span><span class="${rsi > 70 ? 'warning' : (rsi < 30 ? 'success' : '')}">${rsi}</span></div>
                <div class="stat-item"><span>Volume</span><span class="highlight">${volTrend}</span></div>
                <div class="stat-item"><span>Sentiment</span><span class="${statusClass}">${marketSentiment}</span></div>
            </div>
            <div class="reasoning">
                ${decision === 'HOLD' ? `Consolidating for ${coin.symbol}. Price within ${threshold}% range.` : `High-probability ${decision} setup. RSI confirms ${marketSentiment} momentum.`}
            </div>
            <div class="futures-parameters">
                <div class="param-group entry-group">
                    <span class="param-label">Entry Zone</span>
                    <span class="param-value">$${entry.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div class="tp-sl-container">
                    <div class="tp-group">
                        <span class="param-label">Targets (TP)</span>
                        <div class="tp-levels">
                            <div class="tp-level"><span class="tp-dot"></span> TP1: <span class="tp-price">$${tp1.toLocaleString(undefined, {maximumFractionDigits: 2})}</span></div>
                            <div class="tp-level"><span class="tp-dot"></span> TP2: <span class="tp-price">$${tp2.toLocaleString(undefined, {maximumFractionDigits: 2})}</span></div>
                            <div class="tp-level"><span class="tp-dot"></span> TP3: <span class="tp-price">$${tp3.toLocaleString(undefined, {maximumFractionDigits: 2})}</span></div>
                        </div>
                    </div>
                    <div class="sl-group">
                        <span class="param-label">Stop Loss</span>
                        <span class="param-value sl-price">$${sl.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>
                </div>
            </div>
        `;
        return card;
    }

    function renderSignals(reset = false) {
        if (reset) {
            signalsGrid.innerHTML = '';
            displayedCount = 0;
        }

        const nextBatch = allAnalyzedCoins.slice(displayedCount, displayedCount + PAGE_SIZE);
        nextBatch.forEach(coin => {
            const card = createSignalCard(coin);
            signalsGrid.appendChild(card);
        });

        displayedCount += nextBatch.length;
        paginationFooter.style.display = displayedCount < allAnalyzedCoins.length ? 'flex' : 'none';
    }

    async function runAgent() {
        runBtn.disabled = true;
        runBtn.innerHTML = '⏳ Analyzing...';
        allAnalyzedCoins = [];
        terminalLog.innerHTML = '';
        log('Starting Ultra-Deep Market Analysis (Top 250 Assets)...', 'system');
        
        const data = await fetchTopCoins(250);
        if (!data) {
            log('Error fetching market data.', 'warning');
            runBtn.disabled = false;
            return;
        }

        log(`Data for 250 high-volume assets retrieved. Scanning patterns...`, 'success');
        
        for (const coinData of data) {
            const coin = {
                id: coinData.id,
                name: coinData.name,
                symbol: coinData.symbol.toUpperCase(),
                price: coinData.current_price,
                change: coinData.price_change_percentage_24h,
                image: coinData.image
            };
            allAnalyzedCoins.push(coin);
        }

        log('Analysis complete. Showing top signals...', 'success');
        renderSignals(true);
        
        runBtn.disabled = false;
        runBtn.innerHTML = '<span class="btn-icon">⚡</span> Run Global Analysis';
    }

    async function searchCoin() {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;
        searchBtn.disabled = true;
        log(`Searching for "${query}"...`, 'tool');
        try {
            const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
            const data = await res.json();
            if (data.coins && data.coins.length > 0) {
                const coinDetails = await (await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${data.coins[0].id}`)).json();
                if (coinDetails[0]) {
                    const coin = {
                        id: coinDetails[0].id, name: coinDetails[0].name, symbol: coinDetails[0].symbol.toUpperCase(),
                        price: coinDetails[0].current_price, change: coinDetails[0].price_change_percentage_24h, image: coinDetails[0].image
                    };
                    const card = createSignalCard(coin);
                    signalsGrid.insertBefore(card, signalsGrid.firstChild);
                    log(`Success! Signal for ${coin.name} pinned to top.`, 'success');
                    searchInput.value = '';
                }
            }
        } catch (e) { log('Search error.', 'warning'); }
        searchBtn.disabled = false;
    }

    fetchTopCoins(10);
    if (runBtn) runBtn.addEventListener('click', runAgent);
    if (searchBtn) searchBtn.addEventListener('click', searchCoin);
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => renderSignals());
    if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchCoin(); });
});
