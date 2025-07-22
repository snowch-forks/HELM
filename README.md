# HELM Mathematics Workbooks - Progressive Web App (PWA)

This is an offline-capable version of the HELM (Helping Engineers Learn Mathematics) workbooks, converted into a Progressive Web App.

## How to Use Offline

### Automatic Offline Functionality
The website automatically becomes available offline once you visit it. Here's how it works:

1. **First Visit**: When you first load the website, a service worker is installed that enables offline functionality
2. **Caching**: The main page and essential resources are automatically cached
3. **Chapter Caching**: When you visit any chapter while online, it gets cached for offline use
4. **Offline Access**: When you're offline, you can still access:
   - The main table of contents page
   - Any chapters you've previously visited
   - All images and styling

### Automatic Offline Availability

All chapters are automatically made available offline:

1. **Automatic Download**: When you first visit the website, all chapters start downloading in the background automatically
2. **No User Action Required**: You don't need to visit each chapter individually - they're all cached automatically
3. **Progress Notification**: The website shows progress messages as chapters are being downloaded
4. **Complete Offline Access**: Once the background download completes, all chapters are available offline

### Install as an App

For the best offline experience, you can install this as an app on your device:

#### Desktop (Chrome, Edge, etc.)
1. Visit the website
2. Look for an "Install App" button in the bottom-right corner, or
3. Click the install icon in your browser's address bar
4. Click "Install" when prompted

#### Mobile (Android/iOS)
1. Visit the website in your mobile browser
2. Look for "Add to Home Screen" option in your browser menu
3. The app will be added to your home screen like a native app

### Offline Status Indicator

The website shows helpful status messages:
- **Blue info box**: Appears briefly when online to remind you about offline capabilities
- **Orange warning box**: Appears when you're offline, showing what's available

### Technical Details

This PWA includes:
- **Service Worker**: Handles caching and offline functionality
- **Web App Manifest**: Enables installation as an app
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Offline-First Strategy**: Serves cached content when available, falls back to network

### Browser Support

Works in all modern browsers that support service workers:
- Chrome 45+
- Firefox 44+
- Safari 11.1+
- Edge 17+

### Development

To run locally:
```bash
# Start a local server (Python 3)
python3 -m http.server 8000

# Or with Node.js
npx http-server

# Then visit http://localhost:8000
```

The PWA will work on localhost for development and testing.
