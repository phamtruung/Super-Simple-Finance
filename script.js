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
    const year = rawDate.getFullYear();
    const month = rawDate.getMonth() + 1;
    const day = rawDate.getDate();
    const hour = rawDate.getHours();
    const minute = rawDate.getMinutes();
    const second = rawDate.getSeconds();
    const stringDateTime = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
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
    const yearMonth = document.getElementById('select-month');
    yearMonth.value = getYearMonth(new Date());
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
    const ul = document.getElementById('transactions-list');
    ul.innerHTML = '';

    data.transactionList.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    data.transactionList.forEach(transaction => {
        if (getWeek(transaction.datetime) === selectWeek.value) {
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

//#region Chart
class ChartSVG {
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
    for (const [k,v] of Object.entries(attrs)) node.setAttribute(k,v);
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
    const maxVal = Math.max(...this.income, ...this.expense, ...difference);

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
    const pathD = difference
      .map((d,i)=>`${i===0?'M':'L'} ${this.scaleX(i, monthGap)+barWidth/2} ${this.scaleY(d,maxVal)}`)
      .join(' ');
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


function createChart() {
  const income = [500,600,550,700,800,750,900,950,1000,1100,1050,1200];
  const expense = [400,450,500,480,600,620,700,680,750,800,780,850];

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
      marginBottom:40,
      marginLeft:0
    },
    spacing:{monthGap:50}
  };

  const chart = new ChartSVG(document.getElementById('chart'), income, expense, config);

  // render sau khi trang load xong
  window.addEventListener("load", () => {
    chart.render();
  });

  // render lại khi resize
  window.addEventListener("resize", () => {
    chart.render();
  });
}

//#region RenderPage
function renderPage() {
    renderSectionAccount();
    renderSectionCategories();
    renderSectionTransactions();
    createChart();
    saveData();

}

window.addEventListener("DOMContentLoaded", async () => {
    const loaded = await loadData();
    if (loaded) {
        data = loaded; // gán lại dữ liệu từ IndexedDB
    }
    renderPage();
    navigation();
});




