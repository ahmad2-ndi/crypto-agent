document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('run-agent-btn');
    const terminalLog = document.getElementById('terminal-log');
    const signalsGrid = document.getElementById('signals-grid');
    
    let marketData = {};

    async function fetchTopCoins() {
        try {
            // Fetching top 10 coins by market cap
            const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h');
            const data = await response.json();
            
            marketData = {};
            data.forEach(coin => {
                marketData[coin.id] = {
                    name: coin.name,
                    symbol: coin.symbol.toUpperCase(),
                    price: coin.current_price,
                    change: coin.price_change_percentage_24h,
                    image: coin.image
                };
            });

            updateMarketOverview(data.slice(0, 3)); // Update top 3 cards
            return true;
        } catch (error) {
            console.error('API Error:', error);
            return false;
        }
    }

    function updateMarketOverview(top3) {
        // Update the 3 main cards at the top
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

    function log(msg, type = 'system') {
        const p = document.createElement('p');
        p.className = `${type}-msg`;
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        p.innerHTML = `<span class="time">[${time}]</span> > ${msg}`;
        terminalLog.appendChild(p);
        terminalLog.scrollTop = terminalLog.scrollHeight;
    }

    async function runAgent() {
        if (!runBtn || !terminalLog) return;

        runBtn.disabled = true;
        runBtn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing Markets...';
        signalsGrid.innerHTML = '';
        
        terminalLog.innerHTML = '';
        log('Starting Multi-Agent Global Analysis...', 'system');
        
        await sleep(500);
        log('Fetching real-time data for top market assets...', 'tool');
        
        const success = await fetchTopCoins();
        
        if (!success) {
            log('Error fetching live data. Please check connection.', 'warning');
            runBtn.disabled = false;
            runBtn.innerHTML = '<span class="btn-icon">⚡</span> Run Global Analysis';
            return;
        }

        log(`Data successfully retrieved for ${Object.keys(marketData).length} assets.`, 'success');
        
        for (const coinId in marketData) {
            const coin = marketData[coinId];
            log(`Analyzing ${coin.name} (${coin.symbol})...`, 'tool');
            await sleep(300);
            createSignalCard(coin);
        }
        
        log('Global analysis complete. All signals generated.', 'success');
        
        runBtn.disabled = false;
        runBtn.innerHTML = '<span class="btn-icon">⚡</span> Run Global Analysis';
    }

    function createSignalCard(coin) {
        const change = coin.change;
        let decision = "HOLD";
        let confidence = 70;
        let reasoning = "";
        let statusClass = "hold";

        if (change > 2) {
            decision = "BUY";
            confidence = Math.min(95, 75 + Math.abs(change) * 2).toFixed(0);
            reasoning = `${coin.name} is showing strong bullish momentum (+${change.toFixed(1)}%). Upward trend is confirmed.`;
            statusClass = "buy";
        } else if (change < -2) {
            decision = "SELL";
            confidence = Math.min(95, 70 + Math.abs(change) * 2).toFixed(0);
            reasoning = `Significant bearish pressure detected for ${coin.name} (${change.toFixed(1)}%). Downward trend suggests exit.`;
            statusClass = "sell";
        } else {
            decision = "HOLD";
            confidence = (60 + Math.random() * 10).toFixed(0);
            reasoning = `${coin.name} is currently consolidating. Neutral momentum at ${change.toFixed(1)}% 24h change.`;
            statusClass = "hold";
        }

        const card = document.createElement('div');
        card.className = `card recommendation-card signal-${statusClass}`;
        
        const targetPrice = coin.price * (decision === 'BUY' ? 1.15 : 1.05);
        const stopLoss = coin.price * (decision === 'SELL' ? 1.10 : 0.92);

        card.innerHTML = `
            <div class="card-header">
                <div class="card-coin-info">
                    <img src="${coin.image}" alt="${coin.name}">
                    <h3>${coin.name} Agent</h3>
                </div>
                <div class="confidence-meter">
                    <span class="label">Confidence</span>
                    <div class="meter-bar">
                        <div class="meter-fill" style="width: ${confidence}%; background: ${statusClass === 'buy' ? 'var(--success)' : statusClass === 'sell' ? 'var(--warning)' : 'var(--gold)'}"></div>
                    </div>
                    <span class="value">${confidence}%</span>
                </div>
            </div>
            <div class="decision-badge ${statusClass}">${decision}</div>
            <div class="reasoning">${reasoning}</div>
            <div class="trade-parameters">
                <div class="param">
                    <span class="param-label">Entry</span>
                    <span class="param-value">$${coin.price.toLocaleString()}</span>
                </div>
                <div class="param">
                    <span class="param-label">Target</span>
                    <span class="param-value highlight">$${targetPrice.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
                <div class="param">
                    <span class="param-label">Stop Loss</span>
                    <span class="param-value warning">$${stopLoss.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                </div>
            </div>
        `;
        
        signalsGrid.appendChild(card);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Load initial data
    fetchTopCoins();

    // Auto-update market prices every 30 seconds
    setInterval(() => {
        fetchTopCoins();
        console.log('Auto-syncing market data...');
    }, 30000);

    if (runBtn) {
        runBtn.addEventListener('click', runAgent);
    }
});

// Animation helper
if (!document.getElementById('agent-animations')) {
    const style = document.createElement('style');
    style.id = 'agent-animations';
    style.textContent = `
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}
