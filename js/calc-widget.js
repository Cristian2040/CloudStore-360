const CALC_WIDGET_HTML = `
<div id="calc-panel" class="calc-panel">
    <div class="calc-header">
        <h3><i data-lucide="calculator" style="width:1em; height:1em; vertical-align: middle;"></i> Calculadora</h3>
        <button id="close-calc-btn" class="calc-close-btn">&times;</button>
    </div>
    <div class="calc-body">
        <div class="calc-display">
            <div id="calc-history-view" class="calc-history"></div>
            <div id="calc-result" class="calc-result">0</div>
        </div>
        <div class="calc-buttons">
            <button class="calc-btn clear" onclick="window.calcAction('C')">C</button>
            <button class="calc-btn op" onclick="window.calcAction('(')">(</button>
            <button class="calc-btn op" onclick="window.calcAction(')')">)</button>
            <button class="calc-btn op" onclick="window.calcAction('/')">÷</button>
            
            <button class="calc-btn" onclick="window.calcAction('7')">7</button>
            <button class="calc-btn" onclick="window.calcAction('8')">8</button>
            <button class="calc-btn" onclick="window.calcAction('9')">9</button>
            <button class="calc-btn op" onclick="window.calcAction('*')">×</button>
            
            <button class="calc-btn" onclick="window.calcAction('4')">4</button>
            <button class="calc-btn" onclick="window.calcAction('5')">5</button>
            <button class="calc-btn" onclick="window.calcAction('6')">6</button>
            <button class="calc-btn op" onclick="window.calcAction('-')">−</button>
            
            <button class="calc-btn" onclick="window.calcAction('1')">1</button>
            <button class="calc-btn" onclick="window.calcAction('2')">2</button>
            <button class="calc-btn" onclick="window.calcAction('3')">3</button>
            <button class="calc-btn op" onclick="window.calcAction('+')">+</button>
            
            <button class="calc-btn" onclick="window.calcAction('0')">0</button>
            <button class="calc-btn" onclick="window.calcAction('.')">.</button>
            <button class="calc-btn eval" onclick="window.calcAction('=')">=</button>
        </div>
        <div class="calc-history-panel">
            <div class="calc-history-header">
                <span>Historial</span>
                <button id="clear-calc-history" class="calc-history-clear"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>
            </div>
            <div id="calc-history-list" class="calc-history-list">
                <!-- History items here -->
            </div>
        </div>
    </div>
</div>
<div id="calc-overlay" class="calc-overlay"></div>
`;

let calcExpression = '';
let calcEvaluated = false;

document.addEventListener('DOMContentLoaded', () => {
    // Inject HTML
    const div = document.createElement('div');
    div.innerHTML = CALC_WIDGET_HTML;
    document.body.appendChild(div);
    if (window.lucide) window.lucide.createIcons({ root: div });

    // Initial Setup
    setupCalcButton();
    setupCalcEvents();
    loadCalcHistory();
});

function setupCalcButton() {
    let targetContainer = document.querySelector('.navbar-user-mobile');
    if (!targetContainer || window.innerWidth > 768) {
        targetContainer = document.querySelector('.navbar-user');
    }

    if (targetContainer) {
        const btn = document.createElement('button');
        btn.id = 'toggle-calc-btn';
        btn.className = 'navbar-icon-btn';
        btn.innerHTML = '<i data-lucide="calculator" style="width:1em; height:1em;"></i>';
        btn.title = 'Calculadora';

        // Insert before the dropdown (or before notes button if it exists so they are side by side)
        targetContainer.insertBefore(btn, targetContainer.firstChild);
        if (window.lucide) window.lucide.createIcons({ root: btn });

        btn.addEventListener('click', toggleCalcPanel);
    }
}

function setupCalcEvents() {
    document.getElementById('close-calc-btn').addEventListener('click', closeCalcPanel);
    document.getElementById('calc-overlay').addEventListener('click', closeCalcPanel);
    document.getElementById('clear-calc-history').addEventListener('click', clearCalcHistory);
}

function toggleCalcPanel() {
    const panel = document.getElementById('calc-panel');
    const overlay = document.getElementById('calc-overlay');
    panel.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeCalcPanel() {
    document.getElementById('calc-panel').classList.remove('active');
    document.getElementById('calc-overlay').classList.remove('active');
}

window.calcAction = function(action) {
    const display = document.getElementById('calc-result');
    const historyView = document.getElementById('calc-history-view');

    if (action === 'C') {
        calcExpression = '';
        calcEvaluated = false;
        historyView.textContent = '';
        display.textContent = '0';
        return;
    }

    if (action === '=') {
        if (!calcExpression) return;
        try {
            // Replace display symbols with math operators just in case
            let evalExpr = calcExpression;
            let result = Number(new Function('return ' + evalExpr)());
            // Limit decimals to avoid long floats
            result = Math.round(result * 100000000) / 100000000;
            
            saveCalcHistory(calcExpression, result);
            
            historyView.textContent = calcExpression + ' =';
            display.textContent = result;
            calcExpression = result.toString();
            calcEvaluated = true;
        } catch (e) {
            display.textContent = 'Error';
            calcExpression = '';
            calcEvaluated = true;
        }
        return;
    }

    // Handle normal input
    if (calcEvaluated) {
        // If it's an operator after eval, keep the result to operate on it
        if (['+', '-', '*', '/'].includes(action)) {
            calcEvaluated = false;
        } else {
            // Start fresh
            calcExpression = '';
            calcEvaluated = false;
        }
    }

    // Replace display operators for visual, keeping logic operators in expression
    calcExpression += action;
    display.textContent = calcExpression.replace(/\*/g, '×').replace(/\//g, '÷');
};

function saveCalcHistory(expr, result) {
    let history = JSON.parse(localStorage.getItem('calc_history') || '[]');
    history.unshift({ expr: expr.replace(/\*/g, '×').replace(/\//g, '÷'), res: result });
    if (history.length > 20) history = history.slice(0, 20); // Keep last 20
    localStorage.setItem('calc_history', JSON.stringify(history));
    loadCalcHistory();
}

function loadCalcHistory() {
    const list = document.getElementById('calc-history-list');
    let history = JSON.parse(localStorage.getItem('calc_history') || '[]');
    
    if (history.length === 0) {
        list.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:0.8rem; margin-top:20px;">No hay historial reciente</div>';
        return;
    }

    list.innerHTML = history.map(item => `
        <div class="calc-history-item" onclick="window.restoreCalcHistory('${item.res}')">
            <div class="expr">${item.expr}</div>
            <div class="res">${item.res}</div>
        </div>
    `).join('');
}

window.restoreCalcHistory = function(value) {
    calcExpression = value;
    calcEvaluated = false;
    document.getElementById('calc-result').textContent = value;
    document.getElementById('calc-history-view').textContent = '';
};

function clearCalcHistory() {
    if(confirm('¿Limpiar el historial de la calculadora?')) {
        localStorage.removeItem('calc_history');
        loadCalcHistory();
    }
}
