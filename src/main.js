import './styles.css';

class SancoChatbot {
  constructor() {
    this.isOpen = false;
    this.messages = [
      { type: 'bot', text: 'Hello! How can I help you today?' }
    ];
    this.init();
  }

  init() {
    // Create host element
    const host = document.createElement('div');
    host.id = 'sanco-chatbot-root';
    document.body.appendChild(host);

    // Create shadow root
    this.shadow = host.attachShadow({ mode: 'open' });

    // Inject styles (Vite will handle the actual injection of the CSS file into the bundle)
    // Note: with vite-plugin-css-injected-by-js, we need to manually move styles into shadow DOM
    // Or we can rely on the plugin to inject it into <head>, but then we'd need to link it.
    // However, the plugin usually injects into head. For Shadow DOM, we need to clones styles or use adoptedStyleSheets.

    this.render();
    this.setupEventListeners();
    this.handleStyleInjection();
  }

  handleStyleInjection() {
    // Collect all styles from document head that were injected by Vite and move them to shadow root
    // This is a common pattern for shadow dom widgets
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'STYLE') {
            const styleClone = node.cloneNode(true);
            this.shadow.appendChild(styleClone);
          }
        });
      });
    });

    observer.observe(document.head, { childList: true });

    // Also grab existing styles
    document.querySelectorAll('style').forEach(style => {
      const styleClone = style.cloneNode(true);
      this.shadow.appendChild(styleClone);
    });
  }

  render() {
    this.shadow.innerHTML = `
      <div class="widget-container">
        <div class="chat-window ${this.isOpen ? 'open' : ''}">
          <div class="chat-header">
            <div class="status-dot"></div>
            <div class="chat-header-info">
              <h3>Sanco Assistant</h3>
              <p>Online | Ask us anything</p>
            </div>
          </div>
          <div class="chat-content" id="chat-content">
            ${this.messages.map(m => `
              <div class="message ${m.type}">${m.text}</div>
            `).join('')}
          </div>
          <div class="chat-footer">
            <input type="text" class="chat-input" placeholder="Type a message..." id="message-input">
            <button class="send-button" id="send-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
          <div class="chat-watermark">
            Powered by <span>Propulsion</span>
          </div>
        </div>
        <button class="launcher-button ${this.isOpen ? 'open' : ''}" id="launcher">
          <svg id="launcher-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
    `;
  }

  setupEventListeners() {
    const launcher = this.shadow.getElementById('launcher');
    const sendButton = this.shadow.getElementById('send-button');
    const input = this.shadow.getElementById('message-input');
    const chatWindow = this.shadow.querySelector('.chat-window');

    launcher.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      chatWindow.classList.toggle('open', this.isOpen);
      launcher.classList.toggle('open', this.isOpen);

      // Update icon
      if (this.isOpen) {
        launcher.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        setTimeout(() => input.focus(), 300);
      } else {
        launcher.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
      }
    });

    const sendMessage = async () => {
      const text = input.value.trim();
      if (!text) return;

      this.addMessage('user', text);
      input.value = '';
      const API_URL = 'http://localhost:8000/api/v1/chat/message';

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: text }),
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        // Assuming the backend returns { reply: "..." } or { message: "..." }
        // Adjust based on actual API response structure
        this.addMessage('bot', data.reply || data.response || data.message || "I received your message!");
      } catch (error) {
        console.error('Error:', error);
        this.addMessage('bot', "Sorry, I'm having trouble connecting to the assistant. Please try again later.");
      }
    };

    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  addMessage(type, text) {
    this.messages.push({ type, text });
    const content = this.shadow.getElementById('chat-content');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.textContent = text;
    content.appendChild(msgDiv);
    content.scrollTop = content.scrollHeight;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'complete') {
  new SancoChatbot();
} else {
  window.addEventListener('load', () => new SancoChatbot());
}
