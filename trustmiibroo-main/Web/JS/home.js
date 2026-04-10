const input = document.getElementById('pwdInput');
const strengthSection = document.getElementById('strengthSection');
const strengthBar = document.getElementById('strengthBar');
const clearBtn = document.getElementById('clearBtn');
const toggleVisBtn = document.getElementById('toggleVisBtn');
const reqUpper = document.getElementById('req-upper');
const reqDigit = document.getElementById('req-digit');
const reqSymbol = document.getElementById('req-symbol');
const time = document.getElementById('time');
const crackInfo = document.getElementById('crackInfo');
const regexUpper = /[A-Z]/;
const regexDigit = /[0-9]/;
const regexSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
const strengthColors = ['#ff4d4d', '#ff944d', '#ffd24d', '#a3ff4d', '#00c49a'];
input.addEventListener('focus', () => {
    strengthSection.classList.add('show');
});
input.addEventListener('blur', (e) => {
    setTimeout(() => {
        if (document.activeElement !== input) {
            strengthSection.classList.remove('show');
        }
    }, 100);
});
clearBtn.addEventListener('click', (e) => {
    input.value = '';
    input.dispatchEvent(new Event('input')); 
    input.focus(); 
});
toggleVisBtn.addEventListener('click', (e) => {
    if (input.type === 'password') {
        input.type = 'text';
        toggleVisBtn.textContent = '🙉';
    } else {
        input.type = 'password';
        toggleVisBtn.textContent = '🙈';
    }
    input.focus(); 
});
input.addEventListener('input', () => {
    const val = input.value;
    if (regexUpper.test(val)) reqUpper.classList.add('valid');
    else reqUpper.classList.remove('valid');
    if (regexDigit.test(val)) reqDigit.classList.add('valid');
    else reqDigit.classList.remove('valid');
    if (regexSymbol.test(val)) reqSymbol.classList.add('valid');
    else reqSymbol.classList.remove('valid');
    if (val === ''){
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = 'transparent';
        time.style.display = 'none';
        crackInfo.style.display = 'none';
        return;
    }
    const result = zxcvbn(val);
    const score = result.score;
    const widthPercentage = (score === 0) ? 20 : (score + 1) * 20;
    strengthBar.style.width = `${widthPercentage}%`;
    strengthBar.style.backgroundColor = strengthColors[score];
    time.style.display = 'block';
    let crackingTime = result.crack_times_display.
    offline_slow_hashing_1e4_per_second;
    time.textContent = `${crackingTime}`;
    crackInfo.style.display = 'block';
});
// Function to securely check if a password has been leaked
async function checkPasswordLeak(password) {
    const reqLeak = document.getElementById('req-leak');
    
    // Reset if input is empty
    if (!password) {
        reqLeak.classList.add('valid');
        reqLeak.innerHTML = '<div class="checkbox">✓</div> No leaks found';
        reqLeak.style.color = '';
        return;
    }

    // 1. Hash the password using SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // 2. Split into prefix (first 5) and suffix (the rest)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    try {
        // 3. Fetch matching suffixes from the HIBP Pwned Passwords API
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const text = await response.text();

        // 4. Check if our exact suffix is in the returned list
        const splitText = text.split('\n');
        const match = splitText.find(line => line.startsWith(suffix));

        if (match) {
            // Extract how many times it was leaked
            const leakCount = match.split(':')[1].trim();
            reqLeak.classList.remove('valid');
            reqLeak.innerHTML = `<div class="checkbox" style="color: #ff4d4d; border-color: #ff4d4d;">✕</div> Leaked ${Number(leakCount).toLocaleString()} times!`;
            reqLeak.style.color = '#ff4d4d'; // Turn text red
        } else {
            // Password is safe
            reqLeak.classList.add('valid');
            reqLeak.innerHTML = '<div class="checkbox">✓</div> No leaks found';
            reqLeak.style.color = ''; // Reset text color
        }
    } catch (error) {
        console.error("Error checking for leaks:", error);
    }
}
// Add this variable near the top of your file with your other constants
let leakCheckTimeout = null;

// Update your existing input event listener
input.addEventListener('input', () => {
    const val = input.value;
    
    // --- Your existing regex checks ---
    if (regexUpper.test(val)) reqUpper.classList.add('valid');
    else reqUpper.classList.remove('valid');
    
    if (regexDigit.test(val)) reqDigit.classList.add('valid');
    else reqDigit.classList.remove('valid');
    
    if (regexSymbol.test(val)) reqSymbol.classList.add('valid');
    else reqSymbol.classList.remove('valid');
    
    if (val === ''){
        strengthBar.style.width = '0%';
        strengthBar.style.backgroundColor = 'transparent';
        time.style.display = 'none';
        crackInfo.style.display = 'none';
        checkPasswordLeak(''); // Reset the leak UI
        return;
    }
    
    // --- Your existing zxcvbn logic ---
    const result = zxcvbn(val);
    const score = result.score;
    const widthPercentage = (score === 0) ? 20 : (score + 1) * 20;
    strengthBar.style.width = `${widthPercentage}%`;
    strengthBar.style.backgroundColor = strengthColors[score];
    time.style.display = 'block';
    let crackingTime = result.crack_times_display.offline_slow_hashing_1e4_per_second;
    time.textContent = `${crackingTime}`;
    crackInfo.style.display = 'block';

    // --- NEW: The Leak Check Debounce Logic ---
    // Clear the previous timer if the user is still typing
    clearTimeout(leakCheckTimeout);
    
    // Set a new timer to check the database 500ms after they stop typing
    leakCheckTimeout = setTimeout(() => {
        checkPasswordLeak(val);
    }, 500);
});
// --- Password Generator Logic ---

// Tab Switching
const tabScratch = document.getElementById('tab-scratch');
const tabInput = document.getElementById('tab-input');
const modeScratch = document.getElementById('mode-scratch');
const modeInput = document.getElementById('mode-input');

tabScratch.addEventListener('click', () => {
    tabScratch.classList.add('active');
    tabInput.classList.remove('active');
    modeScratch.classList.add('active');
    modeInput.classList.remove('active');
});

tabInput.addEventListener('click', () => {
    tabInput.classList.add('active');
    tabScratch.classList.remove('active');
    modeInput.classList.add('active');
    modeScratch.classList.remove('active');
});

// Update Slider Value Display
const lengthSlider = document.getElementById('gen-length');
const lengthValDisplay = document.getElementById('length-val');

lengthSlider.addEventListener('input', () => {
    lengthValDisplay.textContent = lengthSlider.value;
});

// Copy to Clipboard functionality
const copyBtn = document.getElementById('copy-btn');
const genResult = document.getElementById('gen-result');

copyBtn.addEventListener('click', () => {
    if (genResult.value) {
        genResult.select();
        document.execCommand('copy');
        
        // Brief visual feedback
        const originalIcon = copyBtn.textContent;
        copyBtn.textContent = '✅';
        setTimeout(() => {
            copyBtn.textContent = originalIcon;
        }, 1500);
    }
});
// --- Password Generation Algorithms ---
const btnGenerate = document.getElementById('btn-generate');

// Elements for "From Scratch"

const incUpper = document.getElementById('inc-upper');
const incNum = document.getElementById('inc-num');
const incSym = document.getElementById('inc-sym');

// Elements for "From Input"
const baseWordInput = document.getElementById('gen-base-word');

// Base character sets
const lowerChars = "abcdefghijklmnopqrstuvwxyz";
const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numChars = "0123456789";
const symChars = "!@#$%^&*()_+-=[]{};':\\|,.<>/?";

btnGenerate.addEventListener('click', () => {
    // Check which tab is currently active
    const isScratchMode = document.getElementById('mode-scratch').classList.contains('active');
    
    let newPassword = "";

    if (isScratchMode) {
        // ------------------------------------------------
        // ALGORITHM 1: Generate From Scratch
        // ------------------------------------------------
        let charset = lowerChars; // Lowercase is always included
        
        // Add other character types if the checkboxes are checked
        if (incUpper.checked) charset += upperChars;
        if (incNum.checked) charset += numChars;
        if (incSym.checked) charset += symChars;
        
        const length = parseInt(lengthSlider.value);
        
        // Pick random characters from our built charset
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            newPassword += charset[randomIndex];
        }

    } else {
        // ------------------------------------------------
        // ALGORITHM 2: Generate From Input (Leetspeak)
        // ------------------------------------------------
        const baseWord = baseWordInput.value.trim();
        
        if (!baseWord) {
            alert("Please enter a base word or phrase first!");
            return;
        }
        
        // A dictionary to swap common letters for symbols/numbers
        const leetMap = {
            'a': '@', 'A': '@',
            'e': '3', 'E': '3',
            'i': '1', 'I': '1',
            'o': '0', 'O': '0',
            's': '$', 'S': '$',
            't': '7', 'T': '7'
        };
        
        // Transform the user's word
        for (let i = 0; i < baseWord.length; i++) {
            const char = baseWord[i];
            // If the character is in our map, swap it. Otherwise, keep it.
            newPassword += leetMap[char] || char;
        }
        
        // Capitalize the first letter to add complexity
        if (newPassword.length > 0 && /[a-zA-Z]/.test(newPassword[0])) {
            newPassword = newPassword.charAt(0).toUpperCase() + newPassword.slice(1);
        }
        
        // Append a random 4-digit number and a symbol to ensure it passes basic security checks
        const randomNumbers = Math.floor(1000 + Math.random() * 9000); // Generates 1000-9999
        newPassword += "-" + randomNumbers + "!";
    }

    // Output the generated password to the text box
    genResult.value = newPassword;
}); 