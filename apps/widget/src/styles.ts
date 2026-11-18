export function generateStyles(themeColor: string = '#2563EB'): string {
  return `
    :host {
      --cc-primary: ${themeColor};
      --cc-primary-hover: #1D4ED8;
      --cc-bg-light: #F8FAFC;
      --cc-surface: #FFFFFF;
      --cc-text: #0F172A;
      --cc-text-muted: #64748B;
      --cc-border: #E2E8F0;
      --cc-radius-lg: 18px;
      --cc-radius-md: 12px;
      --cc-radius-sm: 8px;
      --cc-shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
      --cc-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-family: var(--cc-font);
      box-sizing: border-box;
      z-index: 2147483640;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* Container Placement */
    .chatechat-wrapper {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      z-index: 2147483647;
      pointer-events: none;
    }

    .chatechat-wrapper.position-bottom-left {
      right: auto;
      left: 24px;
      align-items: flex-start;
    }

    /* Proactive Trigger Bubble */
    .proactive-bubble {
      pointer-events: auto;
      background: var(--cc-surface);
      color: var(--cc-text);
      border-radius: var(--cc-radius-md);
      padding: 12px 16px;
      margin-bottom: 12px;
      max-width: 280px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      border: 1px solid var(--cc-border);
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      animation: ccFadeSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transform-origin: bottom right;
    }

    .proactive-bubble.hidden {
      display: none;
    }

    .proactive-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--cc-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .proactive-content {
      font-size: 13px;
      line-height: 1.45;
      color: var(--cc-text);
    }

    .proactive-author {
      font-weight: 600;
      font-size: 12px;
      color: var(--cc-primary);
      margin-bottom: 2px;
    }

    .proactive-close {
      position: absolute;
      top: 6px;
      right: 6px;
      background: none;
      border: none;
      color: var(--cc-text-muted);
      cursor: pointer;
      font-size: 14px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .proactive-close:hover {
      background: #F1F5F9;
      color: var(--cc-text);
    }

    /* Floating Launcher Button */
    .launcher-btn {
      pointer-events: auto;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--cc-primary);
      color: #FFFFFF;
      border: none;
      outline: none;
      cursor: pointer;
      box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease;
      position: relative;
    }

    .launcher-btn:hover {
      transform: scale(1.06);
      background: var(--cc-primary-hover);
    }

    .launcher-btn:active {
      transform: scale(0.96);
    }

    .launcher-btn svg {
      width: 28px;
      height: 28px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    .launcher-btn .close-icon {
      display: none;
    }

    .launcher-btn.open .chat-icon {
      display: none;
    }
    .launcher-btn.open .close-icon {
      display: block;
    }

    /* Unread Badge */
    .badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #EF4444;
      color: white;
      font-size: 11px;
      font-weight: 700;
      min-width: 20px;
      height: 20px;
      border-radius: 10px;
      padding: 0 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #FFFFFF;
    }
    .badge.hidden {
      display: none;
    }

    /* Chat Window Container */
    .chat-window {
      pointer-events: auto;
      width: 380px;
      height: 590px;
      max-height: calc(100vh - 110px);
      background: var(--cc-surface);
      border-radius: var(--cc-radius-lg);
      box-shadow: var(--cc-shadow-lg);
      border: 1px solid var(--cc-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 16px;
      transform: scale(0.85) translateY(20px);
      opacity: 0;
      visibility: hidden;
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease, visibility 0.24s;
      transform-origin: bottom right;
    }

    .chat-window.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      visibility: visible;
    }

    /* Header */
    .chat-header {
      background: var(--cc-primary);
      color: #FFFFFF;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 4px rgba(0,0,0,0.06);
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-avatar {
      position: relative;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
    }

    .status-dot {
      position: absolute;
      bottom: 1px;
      right: 1px;
      width: 10px;
      height: 10px;
      background: #10B981;
      border-radius: 50%;
      border: 2px solid var(--cc-primary);
    }

    .header-details h3 {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.2;
    }

    .header-details p {
      font-size: 12px;
      opacity: 0.88;
      margin-top: 3px;
    }

    .header-actions button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      opacity: 0.85;
      padding: 6px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.15s, background-color 0.15s;
    }

    .header-actions button:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.15);
    }

    /* Pre-Chat Form */
    .prechat-form-container {
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
      background: var(--cc-bg-light);
    }

    .prechat-form-container.hidden {
      display: none;
    }

    .prechat-intro {
      text-align: center;
      margin-bottom: 20px;
    }
    .prechat-intro h4 {
      font-size: 17px;
      color: var(--cc-text);
      font-weight: 700;
      margin-bottom: 6px;
    }
    .prechat-intro p {
      font-size: 13px;
      color: var(--cc-text-muted);
    }

    .form-group {
      margin-bottom: 14px;
    }
    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--cc-text);
      margin-bottom: 6px;
    }
    .form-group input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--cc-border);
      border-radius: var(--cc-radius-sm);
      font-size: 14px;
      outline: none;
      background: white;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-group input:focus {
      border-color: var(--cc-primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .start-chat-btn {
      width: 100%;
      padding: 12px;
      margin-top: 6px;
      background: var(--cc-primary);
      color: white;
      border: none;
      border-radius: var(--cc-radius-sm);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .start-chat-btn:hover {
      background: var(--cc-primary-hover);
    }

    /* Message Area */
    .chat-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--cc-bg-light);
      overflow: hidden;
    }

    .chat-body.hidden {
      display: none;
    }

    .messages-list {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .messages-list::-webkit-scrollbar {
      width: 5px;
    }
    .messages-list::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 4px;
    }

    /* Message Item */
    .msg-row {
      display: flex;
      flex-direction: column;
      max-width: 80%;
      animation: ccFadeIn 0.2s ease-out;
    }

    .msg-row.visitor {
      align-self: flex-end;
      align-items: flex-end;
    }

    .msg-row.agent, .msg-row.bot {
      align-self: flex-start;
      align-items: flex-start;
    }

    .msg-bubble {
      padding: 10px 14px;
      border-radius: var(--cc-radius-md);
      font-size: 14px;
      line-height: 1.45;
      word-break: break-word;
      position: relative;
    }

    .msg-row.visitor .msg-bubble {
      background: var(--cc-primary);
      color: #FFFFFF;
      border-bottom-right-radius: 2px;
    }

    .msg-row.agent .msg-bubble {
      background: var(--cc-surface);
      color: var(--cc-text);
      border: 1px solid var(--cc-border);
      border-bottom-left-radius: 2px;
    }

    .msg-row.bot .msg-bubble {
      background: #EFF6FF;
      color: #1E3A8A;
      border: 1px solid #BFDBFE;
      border-bottom-left-radius: 2px;
    }

    .msg-author {
      font-size: 11px;
      font-weight: 600;
      color: var(--cc-text-muted);
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .bot-badge {
      font-size: 9px;
      background: #DBEAFE;
      color: #1E40AF;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .msg-time {
      font-size: 10px;
      color: var(--cc-text-muted);
      margin-top: 4px;
    }

    /* Typing Indicator */
    .typing-indicator {
      display: none;
      align-items: center;
      gap: 4px;
      padding: 8px 14px;
      background: var(--cc-surface);
      border: 1px solid var(--cc-border);
      border-radius: var(--cc-radius-md);
      width: fit-content;
      margin-bottom: 8px;
    }

    .typing-indicator.active {
      display: flex;
    }

    .typing-dot {
      width: 6px;
      height: 6px;
      background: var(--cc-text-muted);
      border-radius: 50%;
      animation: ccBounce 1.4s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }

    /* Input Footer */
    .chat-footer {
      background: var(--cc-surface);
      border-top: 1px solid var(--cc-border);
      padding: 10px 14px;
      position: relative;
    }

    .input-box {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .chat-textarea {
      flex: 1;
      height: 38px;
      max-height: 100px;
      border: none;
      outline: none;
      resize: none;
      font-family: inherit;
      font-size: 14px;
      color: var(--cc-text);
      line-height: 1.4;
      padding: 8px 4px;
      background: transparent;
    }
    .chat-textarea::placeholder {
      color: #94A3B8;
    }

    .action-btn {
      background: none;
      border: none;
      color: var(--cc-text-muted);
      cursor: pointer;
      padding: 6px;
      border-radius: var(--cc-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s, background-color 0.15s;
    }
    .action-btn:hover {
      color: var(--cc-primary);
      background: #F1F5F9;
    }

    .send-btn {
      background: var(--cc-primary);
      color: white;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s, transform 0.1s;
    }
    .send-btn:hover {
      background: var(--cc-primary-hover);
    }
    .send-btn:active {
      transform: scale(0.92);
    }

    /* Emoji Picker Drawer */
    .emoji-drawer {
      position: absolute;
      bottom: 56px;
      left: 12px;
      background: white;
      border: 1px solid var(--cc-border);
      border-radius: var(--cc-radius-md);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      padding: 8px;
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 6px;
      font-size: 20px;
      z-index: 10;
    }
    .emoji-drawer.hidden {
      display: none;
    }
    .emoji-item {
      cursor: pointer;
      padding: 4px;
      text-align: center;
      border-radius: 4px;
      transition: background-color 0.1s;
    }
    .emoji-item:hover {
      background: #F1F5F9;
    }

    /* Powered by ChateChat */
    .chat-powered-by {
      font-size: 11px;
      text-align: center;
      color: var(--cc-text-muted);
      padding: 4px 0 2px 0;
    }
    .chat-powered-by a {
      color: var(--cc-primary);
      text-decoration: none;
      font-weight: 600;
    }

    /* Animations */
    @keyframes ccFadeSlideIn {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes ccFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes ccBounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }

    /* Mobile Responsive Adaptation */
    @media (max-width: 480px) {
      .chatechat-wrapper {
        bottom: 16px;
        right: 16px;
      }
      .chat-window {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100vw;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
        margin-bottom: 0;
      }
    }
  `;
}
