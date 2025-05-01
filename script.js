const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatInput = document.querySelector(".chat-input textarea");
const chatbox = document.querySelector(".chatbox");
const voiceBtn = document.getElementById("voice-btn");
const sendBtn = document.getElementById("send-btn");
const languageSelect = document.getElementById("language-select");

let userMessage = null;
const API_KEY = "AIzaSyBsZrZLwvQSjZgmukPdURAcNRKjmx9GScA";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const inputInitHeight = chatInput.scrollHeight;

// Language configuration
const languageConfig = {
  'en-US': { 
    greeting: 'Hello! How can I assist you today?', 
    placeholder: 'Send a Message',
    listening: 'Listening...',
    error: 'Oops! Something went wrong. Please try again.'
  },
  'es-ES': { 
    greeting: '¡Hola! ¿Cómo puedo ayudarte hoy?', 
    placeholder: 'Enviar un mensaje',
    listening: 'Escuchando...',
    error: '¡Vaya! Algo salió mal. Por favor, inténtalo de nuevo.'
  },
  'fr-FR': { 
    greeting: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?', 
    placeholder: 'Envoyer un message',
    listening: 'Écoute...',
    error: 'Oups ! Quelque chose a mal tourné. Veuillez réessayer.'
  },
  'de-DE': { 
    greeting: 'Hallo! Wie kann ich Ihnen heute helfen?', 
    placeholder: 'Nachricht senden',
    listening: 'Hören...',
    error: 'Hoppla! Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.'
  },
  'hi-IN': { 
    greeting: 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?', 
    placeholder: 'संदेश भेजें',
    listening: 'सुन रहा हूँ...',
    error: 'क्षमा करें! कुछ गलत हो गया। कृपया पुनः प्रयास करें।'
  },
  'bho': { 
    greeting: 'प्रणाम! हम राउर मदद कइसे कर सकीले?', 
    placeholder: 'संदेश भेजीं',
    listening: 'सुनतानी...',
    error: 'माफ करीं! कुछ गड़बड़ हो गईल। फिर से कोसिस करीं।'
  }
};

let currentLanguage = 'en-US';

// Initialize with default language
updateGreeting();

function updateGreeting() {
  const greetingElement = document.querySelector(".chat.incoming p");
  if (greetingElement) {
    greetingElement.textContent = languageConfig[currentLanguage].greeting;
  }
  chatInput.placeholder = languageConfig[currentLanguage].placeholder;
}

const createChatLi = (message, className) => {
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", className);
  let chatContent =
    className === "outgoing"
      ? `<p></p>`
      : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
  chatLi.innerHTML = chatContent;
  chatLi.querySelector("p").textContent = message;
  return chatLi;
};

const formatResponse = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
};

const generateResponse = (incomingChatLi) => {
  const messageElement = incomingChatLi.querySelector("p");
  const languagePrefix = {
    'en-US': 'Respond in English',
    'es-ES': 'Responde en Español',
    'fr-FR': 'Réponds en Français',
    'de-DE': 'Antworte auf Deutsch',
    'hi-IN': 'हिंदी में उत्तर दें',
    'bho': 'भोजपुरी में जबाब दीं'
  };

  // Show typing indicator
  messageElement.textContent = "Typing...";
  scrollToBottom();

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${languagePrefix[currentLanguage]}: ${userMessage}`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40
      }
    }),
  };

  fetch(API_URL, requestOptions)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      const responseText = data.candidates[0].content.parts[0].text;
      messageElement.innerHTML = formatResponse(responseText);
      speakResponse(responseText);
      scrollToBottom();
    })
    .catch(error => {
      console.error("Error:", error);
      messageElement.classList.add("error");
      messageElement.textContent = languageConfig[currentLanguage].error;
      scrollToBottom();
    });
};

const scrollToBottom = () => {
  chatbox.scrollTop = chatbox.scrollHeight;
};

const handleChat = () => {
  userMessage = chatInput.value.trim();
  if (!userMessage) return;

  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;

  const outgoingChatLi = createChatLi(userMessage, "outgoing");
  chatbox.appendChild(outgoingChatLi);
  scrollToBottom();

  setTimeout(() => {
    const incomingChatLi = createChatLi("Typing...", "incoming");
    chatbox.appendChild(incomingChatLi);
    generateResponse(incomingChatLi);
  }, 100);
};

// Add scroll event listener to chatbox
chatbox.addEventListener("scroll", () => {
  const isAtBottom = chatbox.scrollHeight - chatbox.scrollTop <= chatbox.clientHeight + 100;
  if (isAtBottom) {
    chatbox.classList.add("at-bottom");
  } else {
    chatbox.classList.remove("at-bottom");
  }
});

// Speech Recognition
let recognition;

const startVoiceInput = () => {
  if (!('webkitSpeechRecognition' in window)) {
    alert("Speech recognition not supported in your browser");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = currentLanguage === 'bho' ? 'hi-IN' : currentLanguage;
  recognition.interimResults = false;
  
  voiceBtn.classList.add('listening');
  chatInput.placeholder = languageConfig[currentLanguage].listening;
  
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    chatInput.value = transcript;
    voiceBtn.classList.remove('listening');
    chatInput.placeholder = languageConfig[currentLanguage].placeholder;
  };
  
  recognition.onerror = (e) => {
    console.error("Speech recognition error", e.error);
    voiceBtn.classList.remove('listening');
    chatInput.placeholder = languageConfig[currentLanguage].placeholder;
  };
  
  recognition.onend = () => {
    voiceBtn.classList.remove('listening');
    chatInput.placeholder = languageConfig[currentLanguage].placeholder;
  };
  
  recognition.start();
};

// Text-to-Speech
const speakResponse = (text) => {
  if (!('speechSynthesis' in window)) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = currentLanguage === 'bho' ? 'hi-IN' : currentLanguage;
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
};

// Event Listeners
chatInput.addEventListener("input", () => {
  chatInput.style.height = `${inputInitHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleChat();
  }
});

sendBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () =>
  document.body.classList.remove("show-chatbot")
);
chatbotToggler.addEventListener("click", () =>
  document.body.classList.toggle("show-chatbot")
);

// Voice button event listener
voiceBtn.addEventListener("click", startVoiceInput);

// Language selector event listener
languageSelect.addEventListener("change", (e) => {
  currentLanguage = e.target.value;
  updateGreeting();
});

// Home button and team modal functionality
const homeToggler = document.querySelector(".home-toggler");
const teamModal = document.querySelector(".team-modal");
const closeTeamBtn = document.querySelector(".close-team-btn");

homeToggler.addEventListener("click", () => {
  teamModal.classList.add("active");
});

closeTeamBtn.addEventListener("click", () => {
  teamModal.classList.remove("active");
});

// Close modal when clicking outside
teamModal.addEventListener("click", (e) => {
  if (e.target === teamModal) {
    teamModal.classList.remove("active");
  }
});