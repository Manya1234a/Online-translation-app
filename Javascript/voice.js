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
async function translateText(sourceText) {
    const sourceLang = sourceLanguageSelect.value;
    const targetLang = targetLanguageSelect.value;

    if (sourceText.trim() === "") return ""; // No text to translate

    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sourceText)}&langpair=${sourceLang}|${targetLang}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.responseStatus === 200) {
            const translatedText = data.responseData.translatedText;
            document.getElementById('input-text').value = translatedText;
            speakText(translatedText, targetLang);
        } else {
            console.error('Translation API error:', data);
            document.getElementById('input-text').value = 'Translation failed.';
        }
    } catch (error) {
        console.error('Error with translation API:', error);
        document.getElementById('input-text').value = 'Translation failed.';
    }
}

// Variables for Web Speech API and waveform
const recordBtn = document.getElementById('record-btn');
const inputText = document.getElementById('input-text');
const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');
let recognition;
let recognizing = false;
let animationId;

// Initialize Speech Recognition (Web Speech API)
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US'; // Default source language is English
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        recognizing = true;
        inputText.placeholder = 'Listening...';
        startWaveformAnimation();
    };

    recognition.onresult = (event) => {
        recognizing = false;
        const transcript = event.results[0][0].transcript;
        inputText.value = transcript;
        stopWaveformAnimation();
        translateText(transcript);
    };

    recognition.onerror = (event) => {
        recognizing = false;
        stopWaveformAnimation();
        console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
        recognizing = false;
        stopWaveformAnimation();
        inputText.placeholder = 'Speak';
    };
}

// Handle record button click
recordBtn.addEventListener('click', () => {
    if (recognizing) {
        recognition.stop();
        return;
    }
    inputText.value = '';
    recognition.lang = document.getElementById('source-language').value;
    recognition.start();
});

// Speech Synthesis API for playing back translated text
function speakText(text, lang) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
}

// Waveform animation
function startWaveformAnimation() {
    const waveHeight = canvas.height / 2;
    const waveWidth = canvas.width;
    let offset = 0;

    function drawWaveform() {
        ctx.clearRect(0, 0, waveWidth, canvas.height);

        ctx.beginPath();
        for (let i = 0; i < waveWidth; i++) {
            const x = i;
            const y = waveHeight + Math.sin(i * 0.02 + offset) * 20;
            ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#FF4F81';
        ctx.lineWidth = 3;
        ctx.stroke();
        offset += 0.1;

        animationId = requestAnimationFrame(drawWaveform);
    }

    drawWaveform();
}

// Stop waveform animation
function stopWaveformAnimation() {
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
