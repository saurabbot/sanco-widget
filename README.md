# Sanco Chatbot Widget

A highly scalable, lightweight chatbot widget built with Vite and Vanilla JS. It uses a Shadow DOM to ensure style isolation and can be easily embedded into any website.

## Features

- **Shadow DOM Isolation**: Styles won't leak in or out of the widget.
- **Vite Powered**: Fast development and optimized production builds.
- **Vanilla JS**: No heavy framework dependencies.
- **Real-time Communication**: Connects to the Sanco Backend for AI-powered responses.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Development

Start the development server with hot-reload:

```bash
npm run dev
```

The demo page will be available at `http://localhost:5173`.

### 3. Production Build

Build the widget for production:

```bash
npm run build
```

This will generate a `dist/` folder containing `widget.iife.js`. This single file contains everything (JS and CSS) needed to run the widget.

## Integration

To add the chatbot to any website, include the following script tag:

```html
<script src="path/to/your/dist/widget.iife.js"></script>
```

The widget will automatically initialize and appear in the bottom right corner of the screen.

## Configuration

The widget connects to the backend at `http://localhost:8000/api/v1/chat/message`. You can update this URL in `src/main.js` if your backend is hosted elsewhere.

