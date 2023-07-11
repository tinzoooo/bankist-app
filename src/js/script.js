'use strict';

// BANKIST APP

// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');
const containerModal = document.querySelector('.modal');
const containerOverlay = document.querySelector('.overlay');

const loginForm = document.querySelector('.login');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');
const btnOpenModal = document.querySelector('.register');
const btnCloseModal = document.querySelector('.btn--close-modal');
const btnRegister = document.querySelector('.btn__register');
const btnLogout = document.querySelector('.logout');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

// variables

let accounts, currentAccount, timer;
let sorted = false;

/////////////////////////////////////////////////
// Modal functions

function openModal(e) {
  e.preventDefault();
  containerModal.classList.remove('hidden');
  containerOverlay.classList.remove('hidden');
}

function closeModal() {
  containerModal.classList.add('hidden');
  containerOverlay.classList.add('hidden');
}

function closeModalKey(e) {
  if (e.key === 'Escape' && !containerModal.classList.contains('hidden')) {
    closeModal();
  }
}

// Helper function

const startTimeOut = () => {
  const tick = () => {
    let min = String(Math.trunc(time / 60)).padStart(2, 0);
    let sec = String(time % 60).padStart(2, 0);

    labelTimer.textContent = `${min}:${sec}`;

    if (time === 0) {
      clearInterval(timer);
      labelWelcome.textContent = 'Log in to get started';
      containerApp.style.opacity = 0;
    }
    time--;
  };

  let time = 300;

  tick();
  timer = setInterval(tick, 1000);

  return timer;
};

/////////////////////////////////////////////////
// Functions

async function getAccounts() {
  await fetch('https://64abe0509edb4181202eb803.mockapi.io/accounts')
    .then(res => res.json())
    .then(data => {
      accounts = data;
    });
}
getAccounts();

/////////////////////////////////////////////////

function register(e) {
  e.preventDefault();

  const username = document.querySelector('.fullname').value.trim();
  const pin = document.querySelector('.pin').value.trim();

  const data = {
    owner: username,
    movements: [1000],
    interestRate: 1.1,
    pin: pin,

    movementsDates: [new Date().toISOString()],
    currency: 'EUR',

    locale:
      navigator.languages && navigator.languages.length
        ? navigator.languages[0]
        : navigator.language,

    username: username
      .toLowerCase()
      .split(' ')
      .map(name => name[0])
      .join(''),
  };

  /////////////////////////////////////////////////

  async function postData(url = '') {
    if (username && pin) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      alert('Successfully registered, you need to login now');

      window.location.href = '/';

      return response.json();
    } else {
      alert('Something missing');
    }
  }
  postData('https://64abe0509edb4181202eb803.mockapi.io/accounts');
}

/////////////////////////////////////////////////

function formattMovementsData(date, locale) {
  const calcDatePassed = (data1, data2) =>
    Math.round(Math.abs(data1 - data2) / (1000 * 60 * 60 * 24));
  const daysPassed = calcDatePassed(new Date(), date);

  if (daysPassed === 0) return 'Today';
  if (daysPassed === 1) return 'Yesterday';
  if (daysPassed <= 7) return `${daysPassed} days ago`;

  return new Intl.DateTimeFormat(locale).format(date);
}

/////////////////////////////////////////////////

function formattedMov(value, locale, currency) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
}

/////////////////////////////////////////////////

function displayMovements(acc, sort = false) {
  containerMovements.innerHTML = '';

  const movs = sort
    ? acc.movements.slice().sort((a, b) => a - b)
    : acc.movements;

  movs.forEach(function (mov, i) {
    const type = mov > 0 ? 'deposit' : 'withdrawal';

    const now = new Date(acc.movementsDates[i]);
    const displayDate = formattMovementsData(now, acc.locale);

    const html = `
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">${
      i + 1
    } ${type}</div>
        <div class="movements__date">${displayDate}</div>
        <div class="movements__value">${formattedMov(
          mov,
          acc.locale,
          acc.currency
        )}</div>
      </div>
    `;

    containerMovements.insertAdjacentHTML('afterbegin', html);
  });
}

/////////////////////////////////////////////////

function calcDisplayBalance(acc) {
  acc.balance = acc.movements.reduce((acc, mov) => acc + mov, 0);
  labelBalance.textContent = formattedMov(
    acc.balance,
    acc.locale,
    acc.currency
  );
}

/////////////////////////////////////////////////

function calcDisplaySummary(acc) {
  const incomes = acc.movements
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumIn.textContent = formattedMov(incomes, acc.locale, acc.currency);

  const out = acc.movements
    .filter(mov => mov < 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumOut.textContent = formattedMov(out, acc.locale, acc.currency);

  const interest = acc.movements
    .filter(mov => mov > 0)
    .map(deposit => (deposit * acc.interestRate) / 100)
    .filter(int => {
      return int >= 1;
    })
    .reduce((acc, int) => acc + int, 0);
  labelSumInterest.textContent = formattedMov(
    interest,
    acc.locale,
    acc.currency
  );
}

/////////////////////////////////////////////////

function updateUI(acc) {
  // Display movements
  displayMovements(acc);
  // Display balance
  calcDisplayBalance(acc);
  // Display summary
  calcDisplaySummary(acc);
}

/////////////////////////////////////////////////

function login(e) {
  e.preventDefault();

  currentAccount = accounts.find(
    acc => acc.username === inputLoginUsername.value
  );

  if (+currentAccount?.pin === +inputLoginPin.value) {
    loginForm.classList.add('none');
    btnLogout.classList.remove('none');

    // Display UI and message
    labelWelcome.textContent = `Welcome back, ${
      currentAccount.owner.split(' ')[0]
    }`;
    containerApp.style.opacity = 100;

    const now = new Date();

    const options = {
      hour: 'numeric',
      minute: 'numeric',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    };

    labelDate.textContent = new Intl.DateTimeFormat(
      currentAccount.locale,
      options
    ).format(now);

    // Start timer
    if (timer) clearInterval(timer);
    timer = startTimeOut();

    // Update UI
    updateUI(currentAccount);
  } else {
    alert('Invalid username or pin');
  }
}

/////////////////////////////////////////////////

function transfer(e) {
  e.preventDefault();
  const amount = +inputTransferAmount.value;
  const receiverAcc = accounts.find(
    acc => acc.username === inputTransferTo.value
  );

  inputTransferAmount.value = inputTransferTo.value = '';

  if (
    amount > 0 &&
    receiverAcc &&
    currentAccount.balance >= amount &&
    receiverAcc?.username !== currentAccount.username
  ) {
    // Doing the transfer
    currentAccount.movements.push(-amount);
    receiverAcc.movements.push(amount);

    currentAccount.movementsDates.push(new Date().toISOString());
    receiverAcc.movementsDates.push(new Date().toISOString());

    /////////////////////////////////////////////////

    async function updateMovementCurrentAccount() {
      const response = await fetch(
        `https://64abe0509edb4181202eb803.mockapi.io/accounts/${currentAccount.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentAccount),
        }
      );
      await response.json();
    }

    updateMovementCurrentAccount();

    /////////////////////////////////////////////////

    async function updateMovementReceiverAcc() {
      const response = await fetch(
        `https://64abe0509edb4181202eb803.mockapi.io/accounts/${receiverAcc.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(receiverAcc),
        }
      );
      await response.json();
    }

    updateMovementReceiverAcc();

    // Reset timer
    if (timer) clearInterval(timer);
    timer = startTimeOut();

    // Update UI
    updateUI(currentAccount);
  }
}

/////////////////////////////////////////////////

function loan(e) {
  e.preventDefault();

  const amount = +inputLoanAmount.value;

  if (amount > 0 && currentAccount.movements.some(mov => mov >= amount * 0.1)) {
    // Add movement
    currentAccount.movements.push(amount);
    currentAccount.movementsDates.push(new Date().toISOString());

    async function updateMovement() {
      const response = await fetch(
        `https://64abe0509edb4181202eb803.mockapi.io/accounts/${currentAccount.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentAccount),
        }
      );
      await response.json();
    }

    updateMovement();

    // Reset timer
    if (timer) clearInterval(timer);
    timer = startTimeOut();

    // Update UI
    updateUI(currentAccount);
  }
  inputLoanAmount.value = '';
}

/////////////////////////////////////////////////

function close(e) {
  e.preventDefault();
  const currentID = +currentAccount.id;
  if (
    inputCloseUsername.value === currentAccount.username &&
    +inputClosePin.value === +currentAccount.pin
  ) {
    const index = accounts.findIndex(
      acc => acc.username === currentAccount.username
    );
    // Delete account
    async function deleteAccount() {
      const response = await fetch(
        `https://64abe0509edb4181202eb803.mockapi.io/accounts/${currentID}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      response.json();
    }
    accounts.splice(index, 1);
    deleteAccount();
  }
  logout();
}

/////////////////////////////////////////////////

function sort() {
  displayMovements(currentAccount, !sorted);
  sorted = !sorted;
}

/////////////////////////////////////////////////

function logout() {
  window.location.replace('/');
}

/////////////////////////////////////////////////
// Event listeners

document.addEventListener('keydown', closeModalKey);
containerOverlay.addEventListener('click', closeModal);

btnOpenModal.addEventListener('click', openModal);
btnCloseModal.addEventListener('click', closeModal);

btnRegister.addEventListener('click', register);
btnLogin.addEventListener('click', login);

btnTransfer.addEventListener('click', transfer);
btnLoan.addEventListener('click', loan);
btnClose.addEventListener('click', close);

btnSort.addEventListener('click', sort);
btnLogout.addEventListener('click', logout);
