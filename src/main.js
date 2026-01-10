import './styles.css';
import config from './config';

class SancoChatbot {
  constructor() {
    this.isOpen = false;
    this.domain = config.apiUrl;
    this.messages = [
        { type: 'bot', text: 'Hello! How can I help you today?' }
      ];
    this.isTyping = false;
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
          <div class="chat-actions">
            <a href="http://localhost:5173/meeting" target="_blank" rel="noopener noreferrer" class="talk-to-us-button" id="talk-to-us">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="button-icon">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
              Talk to us
            </a>
          </div>
          <div class="chat-watermark">
            Powered by <a href="https://propulsion.world/" target="_blank" rel="noopener noreferrer">Propulsion</a>
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
    const talkToUs = this.shadow.getElementById('talk-to-us');
    const watermarkLink = this.shadow.querySelector('.chat-watermark a');

    const getAllPreviousMessages = async () => {
      const storedSession = localStorage.getItem('sanco_chat_session');
      const API_URL = `${this.domain}/api/v1/chat/messages`;
      const response = await fetch(API_URL, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-UUID': storedSession || ''
        },
      });
      const data = await response.json();
      return data;
    }
    launcher.addEventListener('click', async () => {
      this.isOpen = !this.isOpen;
      chatWindow.classList.toggle('open', this.isOpen);
      launcher.classList.toggle('open', this.isOpen);

      this.trackEvent('widget_toggle', { action: this.isOpen ? 'open' : 'close' });

      const previousMessages = await getAllPreviousMessages();
      console.log(previousMessages);
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
      if (!text || this.isTyping) return;

      this.addMessage('user', text);
      input.value = '';
      this.showTypingIndicator();
      this.trackEvent('message_sent', { text_length: text.length });

      const storedSession = localStorage.getItem('sanco_chat_session');
      const API_URL = `${this.domain}/api/v1/chat/message`;

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-UUID': storedSession || ''
          },
          body: JSON.stringify({ message: text }),
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        
        if (data.session_uuid) {
          localStorage.setItem('sanco_chat_session', data.session_uuid);
        }

        this.hideTypingIndicator();
        this.addMessage('bot', data.reply || data.response || data.message || "I received your message!");
      } catch (error) {
        console.error('Error:', error);
        this.hideTypingIndicator();
        this.addMessage('bot', "Sorry, I'm having trouble connecting to the assistant. Please try again later.");
      }
    };
   

    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    talkToUs.addEventListener('click', () => {
      this.trackEvent('talk_to_us_click');
    });

    watermarkLink.addEventListener('click', () => {
      this.trackEvent('watermark_click');
    });

    // Track clicks on the host website (outside the shadow DOM)
    document.addEventListener('click', (e) => {
      // Filter for meaningful interactive elements
      const target = e.target.closest('a, button, [role="button"]');
      if (target && !this.shadow.contains(target)) {
        this.trackEvent('website_click', {
          element: target.tagName.toLowerCase(),
          text: target.innerText?.trim().slice(0, 50),
          href: target.href || null,
          id: target.id || null,
          path: window.location.pathname
        });
      }
    }, true); // Use capture to ensure we see the click even if stopPropagation is called later
  }

  async trackEvent(eventType, metaData = {}) {
    const storedSession = localStorage.getItem('sanco_chat_session');
    const API_URL = `${this.domain}/api/v1/analytics/events`;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-UUID': storedSession || ''
        },
        body: JSON.stringify({
          event_type: eventType,
          meta_data: metaData,
          session_uuid: storedSession || null
        }),
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.session_uuid) {
        localStorage.setItem('sanco_chat_session', data.session_uuid);
      }
    } catch (error) {
      console.error('Analytics Error:', error);
    }
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

  showTypingIndicator() {
    this.isTyping = true;
    const content = this.shadow.getElementById('chat-content');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    content.appendChild(typingDiv);
    content.scrollTop = content.scrollHeight;
  }

  hideTypingIndicator() {
    this.isTyping = false;
    const indicator = this.shadow.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'complete') {
  new SancoChatbot();
} else {
  window.addEventListener('load', () => new SancoChatbot());
}
