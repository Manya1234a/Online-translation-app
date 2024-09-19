// Language options for the translator
const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'hi', name: 'Hindi' },
    { code: 'zh', name: 'Chinese' }
];

// Populating the language dropdowns
const sourceLanguageSelect = document.getElementById('source-language');
const targetLanguageSelect = document.getElementById('target-language');

function populateLanguageSelect() {
    languageOptions.forEach(lang => {
        let sourceOption = new Option(lang.name, lang.code);
        let targetOption = new Option(lang.name, lang.code);
        sourceLanguageSelect.add(sourceOption);
        targetLanguageSelect.add(targetOption);
    });
}

populateLanguageSelect();
sourceLanguageSelect.value = 'en'; // Default source: English
targetLanguageSelect.value = 'es'; // Default target: Spanish

const sourceLangDiv = document.querySelector('.language-option:first-child');
const targetLangDiv = document.querySelector('.language-option:last-child');

function updateLanguageDivs() {
    sourceLangDiv.textContent = languageOptions.find(lang => lang.code === sourceLanguageSelect.value).name;
    targetLangDiv.textContent = languageOptions.find(lang => lang.code === targetLanguageSelect.value).name;
}

updateLanguageDivs();
sourceLanguageSelect.addEventListener('change', updateLanguageDivs);
targetLanguageSelect.addEventListener('change', updateLanguageDivs);

// Swapping source and target languages
const switchIcon = document.querySelector('.language-icon img');
switchIcon.addEventListener('click', () => {
    let tempLang = sourceLanguageSelect.value;
    sourceLanguageSelect.value = targetLanguageSelect.value;
    targetLanguageSelect.value = tempLang;
    updateLanguageDivs();
});

// Using MyMemory Translation API for real-time translation
async function translateText(sourceText, sourceLang, targetLang) {
    if (sourceText.trim() === "") return ""; // No text to translate

    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sourceText)}&langpair=${sourceLang}|${targetLang}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.responseStatus === 200) {
            return data.responseData.translatedText;
        } else {
            console.error('Translation API error:', data);
            return 'Translation failed.';
        }
    } catch (error) {
        console.error('Error with translation API:', error);
        return 'Translation failed.';
    }
}

// Storing translation history in localStorage with a delay
let historyTimer;
const HISTORY_DELAY = 2000; // 2 seconds delay for history creation
const MAX_HISTORY_SIZE = 3;

function storeTranslationHistory(sourceText, translatedText) {
    clearTimeout(historyTimer);
    historyTimer = setTimeout(() => {
        let translationHistory = JSON.parse(localStorage.getItem('translationHistory')) || [];
        const currentDate = new Date().toLocaleString();

        // Add new entry to the history
        translationHistory.push({
            date: currentDate,
            sourceText: sourceText,
            translatedText: translatedText
        });

        // Limit history to the most recent 10 entries
        if (translationHistory.length > MAX_HISTORY_SIZE) {
            translationHistory.shift(); // Remove oldest entry
        }

        localStorage.setItem('translationHistory', JSON.stringify(translationHistory));
    }, HISTORY_DELAY);
}

// Handling translation in real-time
const textToTranslate = document.querySelector('.text-to-translate');
const translatedText = document.querySelector('.translate-text');

textToTranslate.addEventListener('input', async () => {
    const sourceLang = sourceLanguageSelect.value;
    const targetLang = targetLanguageSelect.value;
    const text = textToTranslate.value;

    // Translate and update the translated box
    translatedText.value = await translateText(text, sourceLang, targetLang);
    // Store translation history after delay
    storeTranslationHistory(text, translatedText.value);
});

// Functionality for button icons
const speakBtns = document.querySelectorAll('.speak');
const copyBtns = document.querySelectorAll('.icon-btn img[src*="copy"]');
const shareBtns = document.querySelectorAll('.icon-btn img[src*="share"]');

function speakText(text, langCode) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = langCode;
    window.speechSynthesis.speak(speech);
}

// Speak button functionality
speakBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        const text = index === 0 ? textToTranslate.value : translatedText.value;
        const lang = index === 0 ? sourceLanguageSelect.value : targetLanguageSelect.value;
        speakText(text, lang);
    });
});

// Copy button functionality
copyBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        const text = index === 0 ? textToTranslate.value : translatedText.value;
        navigator.clipboard.writeText(text);
        alert('Text copied to clipboard!');
    });
});

// Share button functionality
shareBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        const text = index === 0 ? textToTranslate.value : translatedText.value;
        if (navigator.share) {
            navigator.share({
                text: text
            }).then(() => console.log('Shared successfully!'))
              .catch(err => console.error('Error sharing', err));
        } else {
            alert('Sharing not supported on this browser.');
        }
    });
});

// Modal for displaying history
const modal = document.getElementById('history-modal');
const openHistoryBtn = document.getElementById('open-history');
const closeBtn = document.querySelector('.close');

// Open modal
openHistoryBtn.addEventListener('click', () => {
    modal.style.display = 'block';
    displayTranslationHistoryModal(); // Display history in modal
});

// Close modal
closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Close modal if user clicks outside of it
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Display translation history in modal
function displayTranslationHistoryModal() {
    const history = JSON.parse(localStorage.getItem('translationHistory')) || [];
    const historyList = document.getElementById('history-list-modal');
    historyList.innerHTML = ''; // Clear list before displaying

    if (history.length === 0) {
        const listItem = document.createElement('li');
        listItem.textContent = "No history available.";
        historyList.appendChild(listItem);
        return;
    }

    history.forEach(entry => {
        const listItem = document.createElement('li');
        listItem.textContent = `${entry.date}: "${entry.sourceText}" → "${entry.translatedText}"`;
        historyList.appendChild(listItem);
    });
}

// Clear translation history
const clearHistoryModalBtn = document.getElementById('clear-history-modal');
clearHistoryModalBtn.addEventListener('click', () => {
    localStorage.removeItem('translationHistory'); // Clear history
    displayTranslationHistoryModal(); // Refresh modal
});

// Download translation history
const downloadHistoryModalBtn = document.getElementById('download-history-modal');
downloadHistoryModalBtn.addEventListener('click', downloadTranslationHistory);

function downloadTranslationHistory() {
    const history = JSON.parse(localStorage.getItem('translationHistory')) || [];
    let historyText = history.map(entry => `${entry.date}: "${entry.sourceText}" → "${entry.translatedText}"`).join('\n');

    const blob = new Blob([historyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'translation_history.txt';
    a.click();
    URL.revokeObjectURL(url); // Clean up
}


// Function to display the translation history modal
function displayTranslationHistoryModal() {
    const history = JSON.parse(localStorage.getItem('translationHistory')) || [];
    const historyList = document.getElementById('history-list-modal');
    historyList.innerHTML = ''; // Clear existing list items

    if (history.length === 0) {
        const listItem = document.createElement('li');
        listItem.textContent = "No history available.";
        historyList.appendChild(listItem);
        return;
    }

    history.forEach((entry, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            ${entry.date}: "${entry.sourceText}" → "${entry.translatedText}"
            <div class="history-actions">
                <button class="save-btn" data-index="${index}"><img class="star" src="/images/star.png"></button>
                <button class="delete-btn" data-index="${index}"><img class="dlt" src="/images/delete.png" alt="delete"></button>
            </div>
        `;
        historyList.appendChild(listItem);
    });

    // Add event listeners for Save and Delete buttons
    document.querySelectorAll('.save-btn').forEach(button => {
        button.addEventListener('click', handleSave);
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDelete);
    });
}


// Function to handle Save button click
function handleSave(event) {
    
    const history = JSON.parse(localStorage.getItem('translationHistory')) || [];
    const index = event.target.dataset.index;
    const entry = history[index];
    // Implement save functionality here
    alert(`Saved: ${entry.sourceText} → ${entry.translatedText}`);
     
}

// Function to handle Delete button click
function handleDelete(event) {
    const index = event.target.dataset.index;
    let history = JSON.parse(localStorage.getItem('translationHistory')) || [];
    
    // Remove the selected entry
    history.splice(index, 1);
    localStorage.setItem('translationHistory', JSON.stringify(history));
    
    // Refresh modal
    displayTranslationHistoryModal();
}

// Event listeners for Clear History and Download History buttons
document.getElementById('clear-history-modal').addEventListener('click', () => {
    localStorage.removeItem('translationHistory'); // Clear history
    displayTranslationHistoryModal(); // Refresh modal
});

document.getElementById('download-history-modal').addEventListener('click', downloadTranslationHistory);

// Function to download history as a text file
function downloadTranslationHistory() {
    const history = JSON.parse(localStorage.getItem('translationHistory')) || [];
    let historyText = history.map(entry => `${entry.date}: "${entry.sourceText}" → "${entry.translatedText}"`).join('\n');

    const blob = new Blob([historyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'translation_history.txt';
    a.click();
    URL.revokeObjectURL(url); // Clean up
}
document.getElementById("rotatingImage").addEventListener("click", function() {
  this.classList.toggle("rotate"); // Toggle the rotate class on click
});




