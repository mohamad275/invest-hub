# FundLink App Configuration Guide

This guide covers the app configuration updates needed for production deployment.

## ✅ Completed Updates

### 1. App Identity
- **Name**: Changed from "bolt-expo-starter" to "FundLink"
- **Slug**: Updated to "fundlink"
- **Bundle ID**: Set to `com.fundlink.app`
- **Package Name**: Set to `com.fundlink.app`

### 2. App Metadata
- **Description**: "Connect startups with investors - FundLink platform"
- **Keywords**: startup, investor, funding, networking, mobile-app
- **Author**: FundLink Team

### 3. Platform Configuration
- **iOS**: Bundle identifier and tablet support
- **Android**: Adaptive icon configuration
- **Web**: Metro bundler with single output

### 4. Permissions
- **Image Picker**: Added permission description for photo access
- **Document Picker**: Configured for production iCloud environment

## 🔧 Required Manual Steps

### 1. App Icons
You need to create proper app icons. Current setup uses placeholder icons.

**Required Sizes:**
- **iOS**: 1024x1024 (App Store), 180x180 (iPhone), 167x167 (iPad Pro)
- **Android**: 512x512 (Play Store), 192x192 (adaptive icon)
- **Web**: 32x32 (favicon)

**Recommended Tools:**
- [App Icon Generator](https://appicon.co/)
- [Figma](https://figma.com) for design
- [Canva](https://canva.com) for quick creation

### 2. Splash Screen
Update the splash screen image in `assets/images/icon.png` with your FundLink logo.

### 3. App Store Metadata (Future)
When ready for app store submission:

**iOS App Store:**
- App description
- Keywords
- Screenshots
- App preview videos
- Privacy policy URL

**Google Play Store:**
- Short description
- Full description
- Screenshots
- Feature graphic
- Privacy policy URL

## 🚀 Build Configuration

### Development Build
```bash
npm run dev
```

### Production Builds
```bash
# Web
npm run build:web

# Android
npm run build:android

# iOS
npm run build:ios
```

### Environment Variables
Make sure your `.env` file is properly configured:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_ENVIRONMENT=production
```

## 📱 Platform-Specific Notes

### iOS Configuration
- Bundle identifier: `com.fundlink.app`
- Supports iPad
- Requires Apple Developer account for distribution

### Android Configuration
- Package name: `com.fundlink.app`
- Adaptive icon support
- Requires Google Play Console account

### Web Configuration
- Single-page application
- Metro bundler
- Responsive design

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Use environment variables for all sensitive data
3. **Bundle IDs**: Keep consistent across platforms
4. **Permissions**: Only request necessary permissions

## 📋 Pre-Launch Checklist

- [ ] Create proper app icons (all sizes)
- [ ] Update splash screen with FundLink branding
- [ ] Test on all target devices
- [ ] Verify all permissions work correctly
- [ ] Test app store build process
- [ ] Prepare app store metadata
- [ ] Set up analytics and crash reporting
- [ ] Create privacy policy and terms of service

## 🎨 Branding Guidelines

**Colors:**
- Primary: Use your brand color
- Secondary: Complementary colors
- Background: Light/dark theme support

**Typography:**
- Consistent font usage
- Readable sizes
- Proper contrast ratios

**Logo:**
- Scalable vector format
- Works in monochrome
- Clear at small sizes

## 📞 Support

For configuration issues:
1. Check Expo documentation
2. Review platform-specific guides
3. Test on physical devices
4. Verify environment variables

---

**Next Steps**: After completing app configuration, proceed with error handling improvements and testing.



