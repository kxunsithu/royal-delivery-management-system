# Expo OTA Auto Update လမ်းညွှန်

Royal Delivery Management System mobile application တွင် JavaScript/React Native UI ပြောင်းလဲချက်များကို APK/AAB အသစ် ထုတ်မထုတ်ဘဲ အလိုအလျောက် update လုပ်နိုင်ရန် Expo Updates (OTA) ကိုအသုံးပြုထားသည်။

## OTA Update မဖြစ်နိုင်သောအခြေအနေများ

အောက်ပါ native အပြောင်းအလဲများအတွက် app ကို နောက်အခါတွင် APK/AAB အသစ်ပြန်လည် build ရမည်။

- Native npm package အသစ်ထည့်ခြင်း၊ package ဖျက်ခြင်း၊ native dependency ပြောင်းခြင်း
- Android/iOS permission ပြောင်းခြင်း
- `app.json` ထဲရှိ Android package, iOS bundle identifier, app name/icon, SDK/native configuration ပြောင်းခြင်း
- Expo SDK သို့မဟုတ် React Native version upgrade

JavaScript code၊ UI၊ screen၊ API logic ပြောင်းလဲမှုများကို OTA ဖြင့် update လုပ်နိုင်သည်။

## လက်ရှိ Update Configuration

### EAS Build Channels

`mobile/eas.json` တွင် profile အလိုက် update channel ခွဲထားသည်။

| Profile | Channel | Android output |
|---|---|---|
| `preview` | `preview` | APK |
| `production` | `production` | AAB |
| `development` | `development` | Development build |

### Runtime Version

`mobile/app.json` တွင် runtime version policy ကို app version အဖြစ်သတ်မှတ်ထားသည်။ OTA update ကို `version` တူသော build များတွင်သာ တင်ပေးပါမည်။

- Native code/build configuration ကပြောင်းလဲပါက APK/AAB အသစ်ပြန် build ရသည်။
- Native build အသစ်နှင့် OTA update ကို အချိန်မတစ်ခုတည်း publish မပေးသင့်ပါ။

### Automatic Update

`mobile/app/_layout.tsx` တွင် app startup မှာ `expo-updates` ကို အသုံးပြု၍ update ရှိ/မရှိ စစ်ဆေးပြီး update တွေ့လျှင် download ပြီး app ကို reload လုပ်သည်။ Development mode (`__DEV__`) တွင် OTA စစ်ဆေးမှုကို ပိတ်ထားသည်။

## APK Build ထုတ်နည်း

```bash
cd mobile
eas login
eas build:configure
eas build -p android --profile preview
```

Build ပြီးသွားလျှင် EAS dashboard မှ APK ကို download လုပ်ပြီး device တွင် install လုပ်ရမည်။ Preview APK ကို update channel အဖြစ် `preview` ကိုသုံးထားသဖြင့် `eas update --channel preview` ဖြင့် publish မည့် update ကိုလက်ခံမည်။

## Code Update ပြီး OTA Publish လုပ်နည်း

1. Mobile source code ကို ပြင်ဆင်ပြီး type check ပြုလုပ်ပါ။

```bash
cd mobile
npm run typecheck
```

2. Preview channel သို့ OTA update publish လုပ်ပါ။

```bash
eas update --channel preview --message "UI bug fixes and feature update"
```

3. Device မှ app ကို ထပ်ဖွင့်ပါ။ Startup မှ update ရှိနေကြောင်း တွေ့လျှင် update ကို download ပြီး app အလိုအလျောက် reload ဖြစ်မည်။

အကယ်၍ အင်တာနက် စစ်ဆေးသည့်အခါ update မရှိသေးပါက နောက်တစ်ကြိမ် app ကို ပြန်ဖွင့်လျှင် ဆက်လက်စစ်ဆေးမည်။

## Production Update Publish

```bash
cd mobile
npm run typecheck
eas build -p android --profile production
eas update --channel production --message "Production update"
```

Production build ကို Play Store သို့တင်မည်ဆိုလျှင် AAB ကို `eas submit -p android --profile production` ဖြင့် submit လုပ်နိုင်သည်။

## Build ပြီး Publish မလုပ်မီ ချက်များ

- OTA publish မလုပ်ခင် preview channel အတွက် preview APK အသစ် install ထားခြင်းရှိ/မရှိ စစ်ဆေးပါ။
- Production OTA publish မလုပ်ခင် native config မပြောင်းလဲသေးကြောင်း သေချာစစ်ဆေးပါ။
- Update message ကို ပြောင်းသွားသော feature/bug ကို clearly ရေးရန် သင့်တော်သည်။
- `version` မပြောင်းဘဲ JavaScript-only update ကို publish လုပ်နိုင်သည်။ Native ကပြောင်းလျှင် build အသစ်နှင့် version increase လုပ်ပါ။

## အသုံးဝင်သော Command များ

```bash
# TypeScript validate
npm run typecheck

# Preview APK build
cd mobile && eas build -p android --profile preview

# Preview OTA update publish
cd mobile && eas update --channel preview --message "Preview update"

# Production OTA update publish
cd mobile && eas update --channel production --message "Production update"

# Update history ကြည့်ရန်
cd mobile && eas update:list

# ရွေးထားသော project အတွက် config များ စစ်ရန်
cd mobile && eas update:configure
```
