const transactionType = ['Income', 'Expense', 'Transfer'];
const categoryType = ['Income', 'Expense'];
let data = {
    accountList: [],
    categoriesList: [],
    transactionList: []
}

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
function getDateTime() {
    const today = new Date();
    const yearMonth = document.getElementById('select-month');
    const stringDateTime = `${yearMonth.value}-${today.getDate()}T07:00`;
    return stringDateTime
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
    data.accountList = data.accountList.filter(account => account.id !== accountId);
    renderPage();
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
    data.categoriesList = data.categoriesList.filter(category => category.id !== categoryId);
    renderPage();
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
    data.transactionList.push(newTransaction);
    renderPage();
}

function deleteTransaction(transactionId) {
    data.transactionList = data.transactionList.filter(transaction => transaction.id !== transactionId);
    renderPage();
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
    inputName.classList.add(object.type);
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
    selectType.classList.add(transaction.type);
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

    return selectFrom;
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
    return selectTo;
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

    const wrap = document.createElement('div');

    const inputName = createInputName(account);
    wrap.appendChild(inputName);

    const labelInit = document.createElement('label');
    labelInit.textContent = ':';
    wrap.append(labelInit);

    const inputValue = createInputValue(account);
    wrap.appendChild(inputValue);

    li.appendChild(wrap);

    const percent = createAccountPercent(account, total);
    li.appendChild(percent);

    const balance = createAccountBalance(account);
    li.appendChild(balance);

    return li;
}

function renderSectionAccount() {
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

//#region SectionCategory
function renderCategory(category, yearMonth) {
    const li = document.createElement('li');
    li.id = category.id;

    const deleteButton = createDeleteCategoryButton(category);
    li.appendChild(deleteButton);

    const wrap = document.createElement('div');

    const selectType = createSelectCategoryType(category);
    wrap.appendChild(selectType);

    const inputName = createInputName(category);
    wrap.appendChild(inputName);

    const labelBudget = document.createElement('label');
    labelBudget.textContent = ':';
    wrap.append(labelBudget);

    const inputValue = createInputValue(category);
    wrap.appendChild(inputValue);

    li.appendChild(wrap);

    const showPercent = createCategoryPercent(category, yearMonth);
    li.appendChild(showPercent);

    const numberUse = createCategoryUse(category, yearMonth);
    li.appendChild(numberUse);

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

//#region SectionTransaction
function renderTransaction(transaction) {
    const li = document.createElement('li');
    li.id = transaction.id;

    const deleteButton = createDeleteTransactionButton(transaction.id);
    li.appendChild(deleteButton);

    const wrap = document.createElement('div');

    const inputDatetime = createInputDateTime(transaction);
    wrap.appendChild(inputDatetime);

    const selectType = createSelectTransactionType(transaction);
    wrap.appendChild(selectType);

    const labelFrom = document.createElement('label');
    labelFrom.textContent = 'From: ';
    wrap.appendChild(labelFrom);

    const selectFrom = createSelectFromId(transaction);
    wrap.appendChild(selectFrom);

    const arrow = document.createElement('span');
    arrow.textContent = '=>';
    wrap.appendChild(arrow);

    const labelTo = document.createElement('label');
    labelTo.textContent = 'To: ';
    wrap.appendChild(labelTo);

    const selectTo = createSelectToId(transaction);
    wrap.appendChild(selectTo);

    const labelInit = document.createElement('label');
    labelInit.textContent = ':';
    wrap.append(labelInit);
    
    const inputValue = createInputValue(transaction);
    wrap.appendChild(inputValue);

    li.appendChild(wrap);

    return li;
}

function renderSectionTransactions() {
    const yearMonth = document.getElementById('select-month');

    const ul = document.getElementById('transactions-list');
    ul.innerHTML = '';

    data.transactionList.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    data.transactionList.forEach(transaction => {
        if (getYearMonth(transaction.datetime) === yearMonth.value) {
            const li = renderTransaction(transaction);
            ul.appendChild(li);
        }
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

//#region Chart
function createBar(x, height, color) {
    const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bar.setAttribute("x", `${x}`);
    bar.setAttribute("y", "0");
    bar.setAttribute("width", "20");
    bar.setAttribute("height", `${height}`);
    bar.setAttribute("fill", color);
    return bar;
}

function createChart() {
    const divChart = document.getElementById('income-expense-chart');
    divChart.innerHTML = '';

    for (let i = 1; i <= 12; i++) {
        // tạo svg với namespace
        const svgMonth = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgMonth.setAttribute("width", "40");
        svgMonth.setAttribute("height", "120");
        svgMonth.setAttribute("transform", "scale(1,-1")

        const barIncome = createBar(0, 100, "rgb(188, 221, 213)");
        const barExpense = createBar(20, 150, "rgb(230, 206, 206)");

        svgMonth.appendChild(barIncome);
        svgMonth.appendChild(barExpense);
        divChart.appendChild(svgMonth);
    }
}


//#region RenderPage
function renderPage() {
    createChart();
    renderSectionAccount();
    renderSectionCategories();
    renderSectionTransactions();
    saveData();
}

window.addEventListener("DOMContentLoaded", async () => {
    const loaded = await loadData();
    if (loaded) {
        data = loaded; // gán lại dữ liệu từ IndexedDB
    }
    renderPage();
});

