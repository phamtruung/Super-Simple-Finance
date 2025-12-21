const transactionType = ['Income', 'Expense', 'Transfer'];
const categoryType = ['Income', 'Expense'];
let data = {
    accountList: [],
    categoriesList: [],
    transactionList: []
}
let viewYear;

//#region Data
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("MyDatabase", 1);

        request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Tạo object store nếu chưa có
        if (!db.objectStoreNames.contains("appData")) {
            db.createObjectStore("appData");
        }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}
async function saveData() {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
        const tx = db.transaction("appData", "readwrite");
        const store = tx.objectStore("appData");
        store.put(data, "main"); // key = "main"
        tx.oncomplete = () => resolve(true);
        tx.onerror = (event) => reject(event.target.error);
    });
}
async function loadData() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("appData", "readonly");
        const store = tx.objectStore("appData");
        const request = store.get("main");

        request.onsuccess = () => {
        resolve(request.result || { accountList: [], categoriesList: [], transactionList: [] });
        };
        request.onerror = (event) => reject(event.target.error);
    });
}
function clearData() {
    if (confirm("Clear All Data")) {
        data = {
            accountList: [],
            categoriesList: [],
            transactionList: []
        }
        renderPage();
    }
}

//#region Ultilities
function UUID() {
    const time = Date.now().toString(36).substring(1, 5);
    const rand = Math.random().toString(36).substring(2, 4);
    return rand + time;
}
function getYearMonth(dateTime) {
    const rawTime = new Date(dateTime);
    return `${rawTime.getFullYear()}-${rawTime.getMonth()+1}`
}
function getWeek(dateTime) {
    const date = new Date(dateTime);

    // Đặt ngày về thứ Năm để tránh lệch tuần khi nằm gần biên
    date.setHours(0, 0, 0, 0);
    // ISO week: tính từ thứ Hai
    // Tìm ngày thứ Năm của tuần hiện tại
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));

    // Lấy ngày đầu năm
    const week1 = new Date(date.getFullYear(), 0, 4);

    // Tính số tuần
    const weekNumber = 1 + Math.round(
        ((date.getTime() - week1.getTime()) / 86400000
        - 3 + ((week1.getDay() + 6) % 7)) / 7
    );

    const year = date.getFullYear();
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

function getDateTime() {
    const rawDate = new Date();

    const year   = rawDate.getFullYear();
    const month  = String(rawDate.getMonth() + 1).padStart(2, '0');
    const day    = String(rawDate.getDate()).padStart(2, '0');
    const hour   = String(rawDate.getHours()).padStart(2, '0');
    const minute = String(rawDate.getMinutes()).padStart(2, '0');
    const second = String(rawDate.getSeconds()).padStart(2, '0');

    const stringDateTime = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    return stringDateTime;
}


//#region Account
function addAccount() {
    const newAccount = {
        id: UUID(), 
        name: 'New Account', 
        value: 0, 
    }
    data.accountList.push(newAccount);
    renderPage();
}
function deleteAccount(accountId) {
    if (confirm("Delete Account")) {
        data.accountList = data.accountList.filter(account => account.id !== accountId);
        renderPage();
    }
}
function calcAccountBalance(account) {
    let balance = parseFloat(account.value);
    data.transactionList.forEach(transaction => {
        if (transaction.toId === account.id) {
            balance += parseFloat(transaction.value);
        }
        if (transaction.fromId === account.id) {
            balance -= parseFloat(transaction.value);
        }
    });
    return parseFloat(balance);
}

//#endregion Category
function addCategory() {
    const newCategory = {
        id: UUID(), 
        name: 'New Category', 
        type: null, 
        value: 0,
    }
    data.categoriesList.push(newCategory);
    renderPage();
}
function deleteCategory(categoryId) {
    if (confirm("Delete Category")) {
        data.categoriesList = data.categoriesList.filter(category => category.id !== categoryId);
        renderPage();
    }
}
function calcCategoryUse(category, yearMonth) {
    let use = 0;
    data.transactionList.forEach(transaction => {
        const rawDate = new Date(transaction.datetime);
        const stringMonth = `${rawDate.getFullYear()}-${rawDate.getMonth()+1}`
        if (stringMonth === yearMonth) {
            if (transaction.toId === category.id) {
                use += parseFloat(transaction.value);
            }
            if (transaction.fromId === category.id) {
                use += parseFloat(transaction.value);
            }
        }
    });
    return parseFloat(use);
}

//#region Transaction
function addTransaction() {
    const newTransaction = {
        id: UUID(), 
        type: null,
        fromId: null, 
        toId: null,
        value: 0,
        datetime: getDateTime(),
    }
    console.log(newTransaction);
    data.transactionList.push(newTransaction);
    const week = document.getElementById('select-week');
    week.value = getWeek(new Date());
    renderPage();
}

function deleteTransaction(transactionId) {
    if (confirm("Delete Transaction")) {
        data.transactionList = data.transactionList.filter(transaction => transaction.id !== transactionId);
        renderPage();
    }
}
function calcTransactionByYear(year) {
    const income = [];
    const expense = [];

    for (let month = 0; month < 12; month++) {
        let sumIncome = 0;
        let sumExpense = 0;

        data.transactionList.forEach(transaction => {
        const d = new Date(transaction.datetime);
        if (d.getFullYear() === year && d.getMonth() === month) {
            if (transaction.type === "Income") {
                sumIncome += parseFloat(transaction.value);
            }
            if (transaction.type === "Expense") {
                sumExpense += parseFloat(transaction.value);
            }
        }
        });

        income.push(sumIncome);
        expense.push(sumExpense);
    }

    return { income, expense };
}

//#region UI
function createInputName(object) {
    const inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.value = object.name;
    inputName.addEventListener('change', (e) => {
        object.name = e.target.value;
        renderPage();
    })
    return inputName;
}
function createInputValue(object) {
    const inputName = document.createElement('input');
    inputName.type = 'number';
    inputName.value = object.value;
    if (object.type) inputName.classList.add(object.type);
    inputName.addEventListener('change', (e) => {
        object.value = parseFloat(e.target.value);
        renderPage();
    })
    return inputName;
}

//#region AccountUI
function createDeleteAccountButton(account) {
    const deleteButton = document.createElement('button');
    deleteButton.title = 'Delete Account';
    deleteButton.textContent = 'x';

    deleteButton.addEventListener('click', () => {
        deleteAccount(account.id);
    });
    return deleteButton;
}
function createAccountBalance(account) {
    const balance = calcAccountBalance(account);
    const numberBalance = document.createElement('p');
    numberBalance.textContent = parseFloat(balance).toLocaleString();

    return numberBalance;
}
function createAccountPercent(account, total) {
    const balance = calcAccountBalance(account);
    let percent = 0;
    if (total) {
        percent = parseInt(balance * 100 / total);
    }

    const progress = document.createElement('progress');
    progress.value = percent;
    progress.max = 100;
    progress.textContent = percent;
    return progress;
}

//#region CategoryUI
function createDeleteCategoryButton(category) {
    const deleteButton = document.createElement('button');
    deleteButton.title = 'Delete Category';
    deleteButton.textContent = 'x';

    deleteButton.addEventListener('click', () => {
        deleteCategory(category.id);
    });
    return deleteButton;
}
function createSelectCategoryType(category) {
    const selectType = document.createElement('select');
    categoryType.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        selectType.appendChild(option)
    })
    selectType.value = category.type;
    selectType.classList.add(category.type);
    selectType.addEventListener('change', (e) => {
        category.type = e.target.value;
        renderPage();
    });
    return selectType;
}
function createCategoryUse(category, yearMonth) {
    const use = calcCategoryUse(category, yearMonth);
    const numberUse = document.createElement('p');
    numberUse.textContent = parseFloat(use).toLocaleString();

    return numberUse;
}

function createCategoryPercent(category, yearMotnh) {
    const use = calcCategoryUse(category, yearMotnh);
    let percent = 0;
    if (category.value) {
        percent = parseInt(use * 100 / category.value);
    }
    const progress = document.createElement('progress');
    progress.value = percent;
    progress.max = 100;
    return progress;
}

//#region TransactionUI
function createDeleteTransactionButton(transactionId) {
    const deleteButton = document.createElement('button');
    deleteButton.title = 'Delete Transaction';
    deleteButton.textContent = 'x';

    deleteButton.addEventListener('click', () => {
        deleteTransaction(transactionId);
    });
    return deleteButton;
}

function createSelectTransactionType(transaction) {
    const selectType = document.createElement('select');
    transactionType.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        selectType.appendChild(option)
    })
    selectType.value = transaction.type;
    if (transaction.type) selectType.classList.add(transaction.type);
    selectType.addEventListener('change', (e) => {
        transaction.type = e.target.value;
        renderPage();
    });
    return selectType;
}
function createSelectFromId(transaction) {
    const selectFrom = document.createElement('select');
    if (transaction.type === 'Income') {
        data.categoriesList.forEach(category => {
            if (category.type === 'Income') {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                selectFrom.appendChild(option)
            }
        });
        selectFrom.value = transaction.fromId;
    } else {
        data.accountList.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = account.name;
            selectFrom.appendChild(option)
        });
    } 
    selectFrom.value = transaction.fromId;
    selectFrom.addEventListener('change', (e) => {
        transaction.fromId = e.target.value;
        renderPage();
    });

    const div = document.createElement('div');
    div.className = 'fix';
    const labelFrom = document.createElement('label');
    labelFrom.textContent = 'From: ';
    div.append(labelFrom, selectFrom);

    return div;
}
function createSelectToId(transaction) {
    const selectTo = document.createElement('select');
    if (transaction.type === 'Expense') {
        data.categoriesList.forEach(category => {
            if (category.type === 'Expense') {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                selectTo.appendChild(option)
            }
        });
        selectTo.value = transaction.fromId;
    } else {
        data.accountList.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = account.name;
            selectTo.appendChild(option)
        });
    } 
    selectTo.value = transaction.toId;
    selectTo.addEventListener('change', (e) => {
        transaction.toId = e.target.value;
        renderPage();
    });

    const div = document.createElement('div');
    div.className = 'fix';
    const labelTo = document.createElement('label');
    labelTo.textContent = 'To: ';
    div.append(labelTo, selectTo);

    return div;
}
function createInputDateTime(transaction) {
    const input = document.createElement('input');
    input.type = 'datetime-local';
    input.value = transaction.datetime;

    input.addEventListener('change', (e) => {
        transaction.datetime = e.target.value;
        renderPage();
    });
    return input;
}

//#region SectionAccount
function renderAccount(account, total) {
    const li = document.createElement('li');
    li.id = account.id;

    const deleteButton = createDeleteAccountButton(account);
    li.appendChild(deleteButton);

    const divInput = document.createElement('div');
    divInput.className = 'div-input';

    const inputName = createInputName(account);
    divInput.appendChild(inputName);

    const inputValue = createInputValue(account);
    divInput.appendChild(inputValue);

    li.appendChild(divInput);

    const divShow = document.createElement('div');
    divShow.className = 'div-show';

    const balance = createAccountBalance(account);
    divShow.appendChild(balance);

    const percent = createAccountPercent(account, total);
    divShow.appendChild(percent);

    li.appendChild(divShow)

    return li;
}

function renderSectionAccount() {
    const numberSumInit = document.getElementById('account-sum-init');
    let sumInit = 0;
    data.accountList.forEach(account => sumInit += account.value);
    numberSumInit.textContent = sumInit.toLocaleString();

    const accountSum = document.getElementById('account-sum')
    let sum = 0;
    data.accountList.forEach(account => sum += calcAccountBalance(account))
    accountSum.textContent = sum.toLocaleString();

    const ul = document.getElementById('account-list');
    ul.innerHTML = '';

    data.accountList.forEach(account => {
        const li = renderAccount(account, sum);
        ul.appendChild(li)
    });
}
function sortAccounts() {
    data.accountList.sort((a, b) => calcAccountBalance(a) - calcAccountBalance(b));
    renderSectionAccount();
    saveData();
}

//#region SectionCategory
function renderCategory(category, yearMonth) {
    const li = document.createElement('li');
    li.id = category.id;

    const deleteButton = createDeleteCategoryButton(category);
    li.appendChild(deleteButton);

    const divInput = document.createElement('div');
    divInput.className = 'div-input';

    const inputName = createInputName(category);
    divInput.appendChild(inputName);

    const selectType = createSelectCategoryType(category);
    divInput.appendChild(selectType);

    const inputValue = createInputValue(category);
    divInput.appendChild(inputValue);

    li.appendChild(divInput);

    const divShow = document.createElement('div');
    divShow.className = 'div-show';

    const numberUse = createCategoryUse(category, yearMonth);
    divShow.appendChild(numberUse);

    const showPercent = createCategoryPercent(category, yearMonth);
    divShow.appendChild(showPercent);

    li.appendChild(divShow);

    return li;
}
function renderSectionCategories() {
    const yearMonth = document.getElementById('select-month');
    if (!yearMonth.value) {
        yearMonth.value = getYearMonth(new Date());
    }
    yearMonth.addEventListener('change', () => renderPage());

    const numberSumBudget = document.getElementById('categories-sum-budget');
    let sumBudget = 0;
    data.categoriesList.forEach(category => {
        if (category.type === 'Income') {
            sumBudget += category.value;
        }
        if (category.type === 'Expense') {
            sumBudget -= category.value;
        }
    });
    numberSumBudget.textContent = sumBudget.toLocaleString();

    const numberSumUse = document.getElementById('categories-sum-use');
    let sumUse = 0;
    data.categoriesList.forEach(category => {
            if (category.type === 'Income') {
                sumUse += calcCategoryUse(category, yearMonth.value);
            }
            if (category.type === 'Expense') {
                sumUse -= calcCategoryUse(category, yearMonth.value);
            }
        });
    numberSumUse.textContent = sumUse.toLocaleString();

    const ul = document.getElementById('categories-list');
    ul.innerHTML = '';

    data.categoriesList.forEach(category => {
        const li = renderCategory(category, yearMonth.value);
        ul.appendChild(li)
    });
}
function sortCategory() {
    data.categoriesList.sort((a, b) => {
        const typeCompare = b.type.localeCompare(a.type);
        if (typeCompare !== 0) {
            return typeCompare;
        }
        return a.value - b.value;
        });

    renderSectionCategories();
    saveData();
}
//#region SectionTransaction
function renderTransaction(transaction) {
    const li = document.createElement('li');
    li.id = transaction.id;

    const deleteButton = createDeleteTransactionButton(transaction.id);
    li.appendChild(deleteButton);

    const divInput = document.createElement('div');
    divInput.className = 'div-input';

    const inputDatetime = createInputDateTime(transaction);
    divInput.appendChild(inputDatetime);

    const selectType = createSelectTransactionType(transaction);
    divInput.appendChild(selectType);

    const selectFrom = createSelectFromId(transaction);
    divInput.appendChild(selectFrom);

    const selectTo = createSelectToId(transaction);
    divInput.appendChild(selectTo);

    const inputValue = createInputValue(transaction);
    divInput.appendChild(inputValue);

    li.appendChild(divInput);

    return li;
}

function renderSectionTransactions() {
    const selectWeek = document.getElementById('select-week');
    if (!selectWeek.value) {
        selectWeek.value = getWeek(new Date());
    }
    selectWeek.addEventListener('change', () => renderPage());

    const numberSum = document.getElementById('transactions-sum');
    let sum = 0;

    const ul = document.getElementById('transactions-list');
    ul.innerHTML = '';

    data.transactionList.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    data.transactionList.forEach(transaction => {
        if (getWeek(transaction.datetime) === selectWeek.value) {
            const li = renderTransaction(transaction);
            ul.appendChild(li);
            if (transaction.type === "Income") {
                sum += parseFloat(transaction.value);
            }
            if (transaction.type === "Expense") {
                sum -= parseFloat(transaction.value);
            }
        }
    });

    numberSum.textContent = sum.toLocaleString();
}
function showAllTransactions() {
    const ul = document.getElementById('transactions-list');
    ul.innerHTML = '';

    data.transactionList.forEach(transaction => {
        const li = renderTransaction(transaction);
        ul.appendChild(li);
    });
}

//#region ExportImport
async function exportJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "persional-finance-data.json";
    a.click();

    URL.revokeObjectURL(url);
}

function importJson() {
    // click vào input hidden để chọn file
    const inputFile = document.getElementById("file-import");
    inputFile.click();
    inputFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                data = JSON.parse(e.target.result);
                renderPage();
            } catch (err) {
                alert('File Wrong');
            }
        };
        reader.readAsText(file);
    })
}

//#region Navigation
function navigation() {
    const buttons = document.querySelectorAll('#navigation .btn');
    const sections = document.querySelectorAll('section');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        // bỏ active khỏi tất cả nút
        buttons.forEach(b => b.classList.remove('active'));
        // thêm active cho nút vừa nhấn
        btn.classList.add('active');

        // ẩn tất cả section
        sections.forEach(sec => sec.classList.remove('active'));
        // hiện section tương ứng
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
      });
    });

    // chọn mặc định nút 3 và section 3
    buttons[0].classList.add('active');
    sections[0].classList.add('active');
}

//#region IncomExpenseChart
class IncomExpenseChart {
    constructor(svgElement, income, expense, config) {
        this.svg = svgElement;
        this.income = income;
        this.expense = expense;
        this.months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        this.config = config;

        this.height = config.sizes.svgHeight;

        // Bắt buộc để browser tính width đúng
        this.svg.style.width = "100%";
        this.svg.style.height = `${this.height}px`;
        this.svg.style.display = "block"; // tránh inline svg gây width bất thường
        this.svg.style.background = this.config.colors.background;

        // Quan sát kích thước container để re-render
        this.resizeObserver = new ResizeObserver(() => {
        this.safeRender();
        });
        this.resizeObserver.observe(this.svg);
    }

    el(tag, attrs = {}) {
        const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) {
            if (v === null || v === undefined) continue;
            const val = typeof v === 'number' ? (Number.isFinite(v) ? String(v) : null) : String(v);
            if (val !== null) node.setAttribute(k, val);
        }
        return node;
    }


    getActualWidth() {
        // Ưu tiên boundingClientRect; nếu 0, thử clientWidth
        const w = this.svg.getBoundingClientRect().width || this.svg.clientWidth || 0;
        return Math.max(0, Math.floor(w));
    }

    scaleX(i, monthGap) {
        return this.config.sizes.marginLeft + i * monthGap;
    }

    scaleY(val, maxVal) {
        const innerHeight = this.height - this.config.sizes.marginTop - this.config.sizes.marginBottom;
        if (maxVal <= 0) {
            // fallback: vẽ tất cả ở baseline
            return this.config.sizes.marginTop + innerHeight;
        }
        return this.config.sizes.marginTop + innerHeight - (val / maxVal) * innerHeight;
    }

    // Render an toàn: nếu width=0 thì chờ đến khi có width > 0
    safeRender(maxWaitMs = 1000) {
        const start = performance.now();
        const tick = () => {
        const w = this.getActualWidth();
        if (w > 0) {
            this.render();
            return;
        }
        if (performance.now() - start >= maxWaitMs) {
            // fallback: đặt width giả định để không trắng trang
            this.svg.style.minWidth = "320px";
            this.render();
            return;
        }
        requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    render() {
        const actualWidth = this.getActualWidth();
        if (!actualWidth) return; // bảo vệ lần gọi sớm

        this.svg.innerHTML = ""; // xoá chart cũ

        const difference = this.income.map((val,i)=>val-this.expense[i]);
        let maxVal = Math.max(...this.income, ...this.expense, ...difference);
        if (maxVal <= 0) {
            maxVal = 1; // tránh chia cho 0
        }

        const innerHeight = this.height - this.config.sizes.marginTop - this.config.sizes.marginBottom;

        // khoảng cách động theo width thực tế
        const monthGap = (actualWidth - this.config.sizes.marginLeft - this.config.sizes.marginRight) / this.months.length;
        const barWidth = 20; // giữ bar cố định
        const offset = 5;    // expense lệch sang phải 1 chút

        // Vẽ bar (income dưới, expense trên)
        this.months.forEach((m,i)=>{
        const xBase = this.scaleX(i, monthGap);
        const yIncome = this.scaleY(this.income[i], maxVal);
        const yExpense = this.scaleY(this.expense[i], maxVal);

        this.svg.appendChild(this.el('rect',{
            x:xBase,
            y:yIncome,
            width:barWidth,
            height:this.config.sizes.marginTop+innerHeight-yIncome,
            fill:this.config.colors.income,
            rx:this.config.sizes.barRadius,
            ry:this.config.sizes.barRadius
        }));

        this.svg.appendChild(this.el('rect',{
            x:xBase + offset,
            y:yExpense,
            width:barWidth,
            height:this.config.sizes.marginTop+innerHeight-yExpense,
            fill:this.config.colors.expense,
            rx:this.config.sizes.barRadius,
            ry:this.config.sizes.barRadius
        }));

        const label = this.el('text',{
            x:xBase + barWidth/2,
            y:this.config.sizes.marginTop+innerHeight+20,
            fill:this.config.colors.label,
            'text-anchor':'middle'
        });
        label.textContent = m;
        this.svg.appendChild(label);
        });

        // Line Difference
        const pathD = difference.map((d,i)=>{
        const x = this.scaleX(i, monthGap)+barWidth/2;
        const y = this.scaleY(d, maxVal);
        return `${i===0?'M':'L'} ${x} ${y}`;
        }).join(' ');

        this.svg.appendChild(this.el('path',{
        d:pathD,
        stroke:this.config.colors.difference,
        'stroke-width':2,
        fill:'none'
        }));

        // Points Difference
        difference.forEach((d,i)=>{
        this.svg.appendChild(this.el('circle',{
            cx:this.scaleX(i, monthGap)+barWidth/2,
            cy:this.scaleY(d,maxVal),
            r:this.config.sizes.pointRadius,
            fill:this.config.colors.difference,
            stroke:'#fff',
            'stroke-width':1.5
        }));
        });
    }
}

//#region PieChart
class PieChart {
    constructor(svgElement, objectList, config = {}) {
        this.svg = svgElement;
        this.objectList = objectList; // [{id:1, name:"Bank A", value:1000}, ...]
        this.config = Object.assign({
        colors: [
            "#cc6666ff", 
            "#c29149ff", 
            "#cfc275ff", 
            "#7eb858ff", 
            "#6fb5d1ff", 
            "#766fdbff",
            "#dd71c6ff",
            "#b17b8dff",
            "#ad8f7aff",
        ],
        radius: 100,
        centerX: 170,
        centerY: 150,
        labelColor: "#333",
        explodeOffset: 10 // khoảng cách dịch ra ngoài
        }, config);

        this.svg.setAttribute("width", this.config.centerX * 2);
        this.svg.setAttribute("height", this.config.centerY * 2);
    }

    el(tag, attrs = {}) {
        const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (const [k, v] of Object.entries(attrs)) {
        node.setAttribute(k, v);
        }
        return node;
    }

    render() {
        this.svg.innerHTML = "";

        const width  = this.svg.clientWidth  || this.svg.getBoundingClientRect().width  || this.config.centerX * 2;
        const height = this.svg.clientHeight || this.svg.getBoundingClientRect().height || this.config.centerY * 2;

        const cx = width / 2;
        const cy = height / 2;

        const total = this.objectList.reduce((sum, obj) => sum + obj.value, 0);
        if (total <= 0) {
            const msg = this.el("text", {
                x: cx,
                y: cy,
                fill: this.config.labelColor,
                "text-anchor": "middle",
                "alignment-baseline": "middle"
            });
            msg.textContent = "No balance data";
            this.svg.appendChild(msg);
            return;
        }

        let startAngle = 0;
        this.objectList.forEach((object, i) => {
        const value = object.value;
        const sliceAngle = (value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        const midAngle = startAngle + sliceAngle / 2;

        // vector dịch chuyển (explode)
        const dx = this.config.explodeOffset * Math.cos(midAngle);
        const dy = this.config.explodeOffset * Math.sin(midAngle);

        const x1 = cx + this.config.radius * Math.cos(startAngle) + dx;
        const y1 = cy + this.config.radius * Math.sin(startAngle) + dy;
        const x2 = cx + this.config.radius * Math.cos(endAngle) + dx;
        const y2 = cy + this.config.radius * Math.sin(endAngle) + dy;

        const largeArc = sliceAngle > Math.PI ? 1 : 0;

        const pathData = [
            `M ${cx + dx} ${cy + dy}`,
            `L ${x1} ${y1}`,
            `A ${this.config.radius} ${this.config.radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            "Z"
        ].join(" ");

        const path = this.el("path", {
            d: pathData,
            fill: this.config.colors[i % this.config.colors.length]
        });
        this.svg.appendChild(path);

        // Label cũng dịch theo
        const lx = cx + (this.config.radius + 10) * Math.cos(midAngle) + dx;
        const ly = cy + (this.config.radius + 10) * Math.sin(midAngle) + dy;

        const label = this.el("text", {
            x: lx,
            y: ly,
            fill: this.config.labelColor,
            "text-anchor": "middle",
            "alignment-baseline": "middle",
            "font-size": "12"
        });
        label.textContent = object.name;
        this.svg.appendChild(label);

        startAngle = endAngle;
        });
    }
}


//#region SectionChart
function createChart() {
    const selectYear = document.getElementById('select-year');
    selectYear.innerHTML = '';

    const now = new Date();
    const nowYear = now.getFullYear();
    const listYear = [nowYear, nowYear - 1, nowYear - 2];

    listYear.forEach(y => {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (viewYear === y) option.checked = true;
        selectYear.appendChild(option);
    });

    // hàm vẽ chart theo năm
    function renderChart(yearInt) {
        const { income, expense } = calcTransactionByYear(yearInt);

        if (income && expense) {
            const config = {
                colors:{
                    income:"rgb(188, 221, 213)",
                    expense:"rgb(230, 206, 206)",
                    difference:"rgb(37, 37, 37)",
                    label:"rgb(37, 37, 37)",
                    background: "rgb(233, 233, 233)",
                },
                sizes:{
                    svgHeight:300,
                    barRadius:4,
                    pointRadius:4,
                    marginTop:20,
                    marginRight:0,
                    marginBottom:80,
                    marginLeft:0
                },
                spacing:{monthGap:50}
                };

            const chart = new IncomExpenseChart(document.getElementById('income-expense-chart'), income, expense, config);
            chart.render();

            // render lại khi resize
            window.addEventListener("resize", () => chart.render());
        }


    }

    // Income Expense Chart
    renderChart(viewYear);

    // Account Chart
    const dataAccount = data.accountList.map(acc => {
        return {
            name: acc.name,
            value: calcAccountBalance(acc),
        }
    })
    const accountChart = new PieChart(document.getElementById("account-chart"), dataAccount);
    accountChart.render();

    // Expense Chart
    const dataExpense = data.categoriesList
        .filter(cat => cat.type === "Expense")
        .map(cat => ({
            name: cat.name,
            value: calcCategoryUse(cat, getYearMonth(new Date())),
        }));
    const expenseChart = new PieChart(document.getElementById("expense-chart"), dataExpense);
    expenseChart.render();

    // khi chọn năm khác thì vẽ lại
    selectYear.addEventListener("change", () => {
        const yearInt = parseInt(selectYear.value, 10);
        renderChart(yearInt);
    });
}


//#region RenderPage
function renderPage() {
    renderSectionAccount();
    renderSectionCategories();
    renderSectionTransactions();
    saveData();
    createChart();
}

window.addEventListener("DOMContentLoaded", async () => {
    viewYear = 2025
    const loaded = await loadData();
    if (loaded) {
        data = loaded; // gán lại dữ liệu từ IndexedDB
    }
    renderPage();
    navigation();
});




