# الحسن المساعد الشخصي

## نظرة عامة
تطبيق موبايل مبني بـ **Expo SDK 54 / React Native 0.81** يعمل كمساعد شخصي ذكي مع ميزات أمان متقدمة ودعم Foreground Service على Android.

## الميزات الرئيسية
- عرض الرابط المحلي `http://127.0.0.1:8081` داخل WebView أصلي
- التحقق بالبصمة أو بصمة الوجه (expo-local-authentication)
- كشف انقطاع الإنترنت (@react-native-community/netinfo)
- دعم الإشعارات الفورية مع Background Remote Notifications
- Foreground Service مع Location Background Mode
- Background Fetch للمهام الخلفية (expo-task-manager)
- دعم اللغتين العربية والإنجليزية (i18n) مع RTL
- جسر اتصال ثنائي الاتجاه بين WebView والتطبيق الأصلي

## التقنيات المستخدمة
- **Framework**: Expo SDK 54 / React Native 0.81
- **Language**: TypeScript
- **Navigation**: Expo Router v6
- **Runtime**: Node.js 20
- **Build**: EAS Build (APK)

## هيكل المشروع
```
app/
  _layout.tsx      # تخطيط الجذر: Fonts, Notifications, Background Tasks
  index.tsx        # الشاشة الرئيسية: WebView + بصمة + اتصال
components/
  ErrorBoundary.tsx    # معالج الأخطاء
  ErrorFallback.tsx    # واجهة عرض الخطأ
  SettingsDrawer.tsx   # درج الإعدادات
hooks/
  useColors.ts     # إدارة الألوان والثيم
  useSettings.ts   # إدارة الإعدادات (AsyncStorage)
constants/
  colors.ts        # تعريفات الألوان
  i18n.ts          # ترجمات النصوص (ar/en)
utils/
  backgroundTasks.ts   # تسجيل مهام الخلفية و Foreground Service
assets/            # الصور والأيقونات
```

## تشغيل المشروع (ويب/تطوير)
```bash
EXPO_NO_TELEMETRY=1 npx expo start --web --port 5000
```

## بناء APK
```bash
eas build --platform android --profile preview
```

## ملاحظات تقنية مهمة
- `usesCleartextTraffic: true` مفعّل للسماح بـ HTTP على `127.0.0.1`
- `minSdkVersion: 26` | `targetSdkVersion: 34` | `compileSdkVersion: 34`
- `allowBackup: false` لحماية بيانات التطبيق
- Foreground Service مُعرَّف بـ types: DATA_SYNC, LOCATION, MICROPHONE, CAMERA, CONNECTED_DEVICE, HEALTH
- Background Location مُفعَّل عبر `expo-location` plugin
- Background Fetch مُسجَّل عبر `expo-task-manager`
- قناة الإشعارات: "الحسن المساعد الشخصي" بأعلى أولوية
- Deep Link Scheme: `alhassan-app://`
- Package ID: `com.waheeb.walletapp`
- EAS Project ID: `e2c9d7bd-9560-49a2-80e7-67183d3e2247`

## URL الرابط المحلي
`http://127.0.0.1:8081`
