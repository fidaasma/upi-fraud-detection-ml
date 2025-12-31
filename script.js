// DOM Elements
const screens = document.querySelectorAll('.screen');
const sendMoneyBtn = document.getElementById('sendMoneyBtn');
const backBtns = document.querySelectorAll('.back-btn');
const upiInput = document.getElementById('upiInput');
const amountInput = document.getElementById('amountInput');
const continueToAmountBtn = document.getElementById('continueToAmount');
const continueToConfirmBtn = document.getElementById('continueToConfirm');
const payBtn = document.getElementById('payBtn');
const doneBtn = document.getElementById('doneBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

let currentBalance = 24500;
const balanceAmountEl = document.getElementById('balanceAmount');

// Display Elements
const confirmUpi = document.getElementById('confirmUpi');
const confirmAvatar = document.getElementById('confirmAvatar');
const confirmAmount = document.getElementById('confirmAmount');
const confirmTime = document.getElementById('confirmTime');
const confirmDevice = document.getElementById('confirmDevice');
const confirmLocation = document.getElementById('confirmLocation');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const resultAmount = document.getElementById('resultAmount');
const resultUpi = document.getElementById('resultUpi');
const statusBarTime = document.getElementById('statusBarTime');

// State
let currentScreen = 0;
let transactionData = {
  upiId: '',
  amount: 0,
  time: '',
  device: 'Samsung Galaxy S23',
  location: 'Mumbai, India'
};

// Utility Functions
function updateTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  statusBarTime.textContent = `${hours}:${minutes}`;
}

function formatTime(date) {
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

function showScreen(index) {
  screens.forEach((screen, i) => {
    screen.classList.toggle('active', i === index);
  });
  currentScreen = index;
}

function goBack() {
  if (currentScreen > 0) {
    showScreen(currentScreen - 1);
  }
}

function showLoading(show) {
  loadingOverlay.classList.toggle('active', show);
}

function validateUPI(upi) {
  // Basic UPI ID validation
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  return upiRegex.test(upi);
}

function validateAmount(amount) {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 100000;
}

// Generate feature array for API
function generateFeatures(timeInSeconds, amount) {
  const features = new Array(30).fill(0);
  features[0] = timeInSeconds;
  features[29] = amount;
  
  // Add some small random values to other indices for simulation
  for (let i = 1; i < 29; i++) {
    features[i] = Math.random() * 0.5;
  }
  
  return features;
}

// API Call
async function checkTransaction(features) {
  try {
    const response = await fetch('/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ features: features })
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    // Return a default response in case of error
    return { prediction: 0 };
  }
}

// Event Listeners
sendMoneyBtn.addEventListener('click', () => {
  showScreen(1);
  upiInput.focus();
});

backBtns.forEach(btn => {
  btn.addEventListener('click', goBack);
});

upiInput.addEventListener('input', () => {
  continueToAmountBtn.disabled = !validateUPI(upiInput.value.trim());
});

continueToAmountBtn.addEventListener('click', () => {
  if (validateUPI(upiInput.value.trim())) {
    transactionData.upiId = upiInput.value.trim();
    showScreen(2);
    amountInput.focus();
  }
});

amountInput.addEventListener('input', () => {
  continueToConfirmBtn.disabled = !validateAmount(amountInput.value);
});

continueToConfirmBtn.addEventListener('click', () => {
  if (validateAmount(amountInput.value)) {
    const amount = parseFloat(amountInput.value);
    transactionData.amount = amount;
    transactionData.time = formatTime(new Date());
    
    // Update confirm screen
    confirmUpi.textContent = transactionData.upiId;
    confirmAvatar.textContent = transactionData.upiId.charAt(0).toUpperCase();
    confirmAmount.textContent = `₹${amount.toLocaleString('en-IN')}`;
    document.getElementById('payAmount').textContent = amount.toLocaleString('en-IN');

    confirmTime.textContent = transactionData.time;
    confirmDevice.textContent = transactionData.device;
    confirmLocation.textContent = transactionData.location;
    
    showScreen(3);
  }
});

payBtn.addEventListener('click', async () => {
  showLoading(true);
  
  // Get current time in seconds since midnight
  const now = new Date();
  const timeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  
  // Generate features array
  const features = generateFeatures(timeInSeconds, transactionData.amount);
  
  // Make API call
  const result = await checkTransaction(features);
  
  // Simulate network delay for better UX
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  showLoading(false);
  
  // Determine if fraud (prediction === 1 means fraud)
  const isFraud = result.prediction === "Fraud";
  
  // Update result screen
  if (isFraud) {
    resultIcon.className = 'result-icon warning';
    resultIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    `;
    resultTitle.textContent = 'Suspicious Transaction';
    resultMessage.textContent = '⚠️ This transaction seems suspicious. Please proceed carefully.';
  } else {
    resultIcon.className = 'result-icon success';
    resultIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    `;
    currentBalance -= transactionData.amount;
balanceAmountEl.textContent = `₹${currentBalance.toLocaleString('en-IN')}`;

    resultTitle.textContent = 'Transaction Safe';
    resultMessage.textContent = '✅ Transaction looks safe. You can proceed with confidence.';
  }
  
  resultAmount.textContent = `₹${transactionData.amount.toLocaleString('en-IN')}`;
  resultUpi.textContent = transactionData.upiId;
  
  showScreen(4);
});

doneBtn.addEventListener('click', () => {
  // Reset form
  upiInput.value = '';
  amountInput.value = '';
  continueToAmountBtn.disabled = true;
  continueToConfirmBtn.disabled = true;
  
  // Go back to home
  showScreen(0);
});

// Allow Enter key to proceed
upiInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !continueToAmountBtn.disabled) {
    continueToAmountBtn.click();
  }
});

amountInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !continueToConfirmBtn.disabled) {
    continueToConfirmBtn.click();
  }
});

// Initialize
updateTime();
setInterval(updateTime, 1000);
showScreen(0);
