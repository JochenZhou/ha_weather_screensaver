# Smart Weather Display PWA Walkthrough

I have generated a Progressive Web App (PWA) for your Smart Weather Display.

## Project Structure

- **Framework**: React + Vite
- **Styling**: Tailwind CSS (v4)
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa
- **Lunar Calendar**: lunar-javascript (bundled for offline use)

## How to Run

### Development
To start the development server:
```bash
npm run dev
```
Open the URL shown in the terminal (usually `http://localhost:5173`).

### Production Build & PWA Test
To build the app and test the PWA functionality (Service Workers):
```bash
npm run build
npm run preview
```
Open the URL (usually `http://localhost:4173`). You should see an "Install App" icon in your browser address bar (if supported).

## Key Changes & Features

1.  **PWA Configuration**:
    - Added `manifest.webmanifest` generation.
    - Configured Service Worker for offline caching.
    - Added PWA icons (`pwa-192x192.png`, `pwa-512x512.png`).
    - Updated `index.html` with mobile viewport and theme color settings.

2.  **Code Adaptations**:
    - **Offline Support**: Replaced the dynamic CDN loading of `lunar-javascript` with a direct npm import. This ensures the lunar calendar works offline.
    - **Tailwind CSS v4**: Configured the project to use the latest Tailwind CSS v4 with `@tailwindcss/postcss`.

3.  **Premium Visuals**:
    - All animations and styles from your request have been preserved and integrated into the React component.

## Configuration

The app stores configuration in `localStorage`. You can click the settings icon to configure:
- Home Assistant URL
- Long-Lived Access Token
- Weather Entity ID
- Location Name

## Demo Mode

You can enable **Demo Mode** in settings to preview all weather animations without connecting to Home Assistant.

## Troubleshooting: CORS Error

If you see a "Network Error" or "CORS" error when connecting to Home Assistant, it means your Home Assistant instance is blocking the connection from the browser.

To fix this, you need to add the following to your Home Assistant's `configuration.yaml` file and restart Home Assistant:

```yaml
http:
  cors_allowed_origins:
    - http://localhost:5173
    - http://localhost:4173
    - https://your-pwa-domain.com  # Add your production domain here later
```
