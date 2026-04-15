# الحسن المساعد الشخصي

## نظرة عامة
تطبيق موبايل مبني بـ **Expo / React Native** يعمل كمساعد شخصي ذكي مع ميزات أمان متقدمة.

## الميزات الرئيسية
- عرض موقع المحفظة داخل WebView أصلي (أو iframe على الويب)
- التحقق بالبصمة أو بصمة الوجه (expo-local-authentication)
- كشف انقطاع الإنترنت (@react-native-community/netinfo)
- دعم الإشعارات الفورية (expo-notifications)
- دعم اللغتين العربية والإنجليزية (i18n)
- دعم الوضع المظلم والفاتح

## التقنيات المستخدمة
- **Framework**: Expo SDK 54 / React Native 0.81
- **Language**: TypeScript
- **Navigation**: Expo Router v6
- **Runtime**: Node.js 20

## هيكل المشروع
```
app/
  _layout.tsx      # تخطيط الجذر مع المزودين
  index.tsx        # الشاشة الرئيسية (WebView + المصادقة)
components/
  ErrorBoundary.tsx    # معالج الأخطاء
  ErrorFallback.tsx    # واجهة عرض الخطأ
  SettingsDrawer.tsx   # درج الإعدادات
hooks/
  useColors.ts     # إدارة الألوان والثيم
  useSettings.ts   # إدارة الإعدادات
constants/
  colors.ts        # تعريفات الألوان
  i18n.ts          # ترجمات النصوص
assets/            # الصور والخطوط
```

## تشغيل المشروع
```bash
EXPO_NO_TELEMETRY=1 npx expo start --web --port 5000 --localhost
```

## ملاحظات الإعداد
- تم تحديث Node.js إلى الإصدار 20 (مطلوب من React Native 0.81)
- تم إصلاح إعداد Babel لاستخدام `react-native-worklets/plugin` بدلاً من `react-native-reanimated/plugin`
- تم إزالة `jsxImportSource: 'nativewind'` من babel.config.js (لم تكن nativewind مثبتة)
- تم تثبيت `react-native-worklets@0.4.0` (الإصدار المتوافق مع reanimated 4.0.x)
- تم إنشاء `components/ErrorFallback.tsx` الذي كان مفقوداً
- التطبيق يعمل على المنفذ 5000 للويب

## URL الموقع
`https://almufeed-net.infinityfreeapp.com/wallet/index.php`
