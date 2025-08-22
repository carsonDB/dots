# Deployment Guide

## Vercel Deployment

This application is configured for deployment on Vercel as a Progressive Web App (PWA) named "finger reader".

### Prerequisites

1. A Vercel account (free tier available)
2. OpenRouter API key for AI functionality
3. GitHub repository with the project code

### Deployment Steps

1. **Prepare Repository**:
   - Ensure your code is pushed to a GitHub repository
   - Verify the build works locally: `npm run build`

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your repository
   - Set project name to "finger-reader" (or your preferred name)

3. **Configure Build Settings** (should auto-detect):
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Configure Environment Variables**:
   - In the Vercel dashboard, go to your project settings
   - Navigate to "Environment Variables"
   - Add the following variable for all environments (Production, Preview, Development):
     ```
     Name: VITE_OPENROUTER_API_KEY
     Value: your_openrouter_api_key_here
     ```
   - Get your API key from [OpenRouter](https://openrouter.ai/)

5. **Deploy**:
   - Click "Deploy" to start the initial deployment
   - Vercel will automatically build and deploy your application
   - Future pushes to main branch will trigger automatic deployments

### PWA Features

The application includes:
- **Service Worker**: Automatic caching and offline functionality
- **Web App Manifest**: Install prompt and standalone app experience
- **Responsive Design**: Optimized for mobile and desktop
- **API Caching**: Smart caching of AI API responses

### Testing PWA Functionality

After deployment, thoroughly test the PWA features:

#### 1. Install Prompt Testing
- **Desktop**: Visit the deployed URL in Chrome/Edge - look for install icon in address bar
- **Mobile**: Visit on mobile browser - should see "Add to Home Screen" prompt
- **iOS Safari**: Use "Share" → "Add to Home Screen"
- **Android Chrome**: Look for automatic install banner or use menu option

#### 2. Offline Capability Testing
- Install the PWA on your device
- Turn off internet connection or enable airplane mode
- Open the installed app - it should load the cached interface
- Try searching - should show appropriate offline message
- Reconnect internet - functionality should resume

#### 3. Mobile Experience Verification
- **Responsive Design**: Test on various screen sizes (phone, tablet, desktop)
- **Touch Interactions**: Verify all buttons and segments are touch-friendly
- **Performance**: App should load quickly and feel native
- **Standalone Mode**: When installed, app should open without browser UI

#### 4. Performance and PWA Score Testing
- Use Chrome DevTools Lighthouse audit
- Target scores: Performance >90, PWA >90, Accessibility >90
- Test on both mobile and desktop
- Verify service worker is properly registered
- Check manifest.json is correctly loaded

#### 5. Functionality Testing
- **Search**: Enter queries and verify AI responses
- **Expansion**: Click segments to expand and verify hierarchical navigation
- **Navigation**: Test back button and navigation flow
- **Error Handling**: Test with invalid API key or network issues
- **Loading States**: Verify loading indicators work properly

### Environment Variables

Required environment variables:
- `VITE_OPENROUTER_API_KEY`: Your OpenRouter API key for AI functionality

### Build Configuration

The application uses:
- **Vite** for building and bundling
- **vite-plugin-pwa** for PWA functionality
- **Workbox** for service worker generation
- **Code splitting** for optimized loading

### Troubleshooting

- **Build Failures**: Check that all dependencies are properly installed
- **API Errors**: Verify your OpenRouter API key is correctly set
- **PWA Issues**: Ensure HTTPS is enabled (automatic on Vercel)
- **Performance**: Monitor bundle size and consider lazy loading for large components