# အသုံးပြုသူ အခန်းကဏ္ဍအလိုက် လုပ်ဆောင်ချက်များ

ဤစာရွက်စာတမ်းသည် Royal Myawaddy Delivery Management System တွင် လက်ရှိ codebase အရ လုပ်ဆောင်ပေးထားသော role၊ စာမျက်နှာဝင်ရောက်ခွင့်နှင့် ခွင့်ပြုချက်များကို မြန်မာဘာသာဖြင့် ရေးသားထားခြင်း ဖြစ်ပါသည်။

> **လုံခြုံရေးနှင့် UI မတူညီနိုင်မှု:** Frontend ၏ menu သို့မဟုတ် ခလုတ်များကို ဖျောက်ထားခြင်းသည် လုံခြုံရေးမဟုတ်ပါ။ Backend policy အားလုပ်ဆောင်ခွင့်များကို အမြဲစစ်ဆေးထားပါသည်။

## ၁။ အခန်းကဏ္ဍများ

| Role | အဓိကတာဝန် |
|---|---|
| Admin | စနစ်၊ အသုံးပြုသူ၊ ပါဆယ်၊ အစီအမံနှင့် settings အားလုံးကို စီမံခန့်ခွဲခြင်း |
| Manager | ပါဆယ်လက်ခံခြင်း၊ စစ်ဆေးခြင်း၊ status လှုပ်ရှားခြင်းနှင့် parcel register/edit |
| Accountant | ပါဆယ်စစ်ဆေးခြင်း၊ status ပြောင်းလဲခြင်းနှင့် delivery staff ချိတ်ဆက်ခြင်း |
| Delivery Staff | မိမိသို့ချိတ်ထားသော delivery များကို ဆောင်ရွက်ခြင်းနှင့် ငွေ/လက်မှတ် handover တင်ခြင်း |

## ၂။ Admin

### သုံးနိုင်သော စာမျက်နှာများ
- Dashboard
- Parcels list၊ parcel detail၊ register နှင့် edit
- Deliveries list
- Users list/detail/create/edit
- Settings နှင့် delivery areas
- Profile

### လုပ်ဆောင်နိုင်သော အဓိကလုပ်ငန်းများ
- Dashboard၊ parcel statistic နှင့် delivery trend ကြည့်ခြင်း
- ပါဆယ်အသစ်ထည့်ခြင်း၊ ပြင်ခြင်းနှင့် စနစ်အတွင်းပါဆယ်အားလုံးကို ကြည့်ခြင်း
- ပါဆယ် ဖျက်ခြင်း (အတည်ပြု dialog ဖြင့်)
- ပါဆယ် status transition လုပ်ခြင်း
- Delivery staff သို့ပါဆယ်တစ်ခုချင်းချိတ်ခြင်းနှင့် ပြန်လည်ချိတ်ခြင်း
- Delivery assignment၊ မအောင်မြင်သော attempt နှင့် staff workload ကြည့်ခြင်း
- အသုံးပြုသူအကောင့် ဖန်တီး/ပြင်ခြင်း/active status ပြောင်းခြင်း၊ role သတ်မှတ်ခြင်း
- Delivery area၊ အခြား business settings နှင့် audit logs စီမံခြင်း

### ကန့်သတ်ချက်များ
- မိမိကိုယ်တိုင် inactive သို့မဟုတ် delete မလုပ်နိုင်ပါ။
- Terminal status ရှိပါက parcel ကို frontend မှ တိုက်ရိုက်တည်းဖြတ်ရန် မဖွင့်ထားသော်လည်း backend update API သည် terminal parcel များအားလုံးကို တားဆီးထားသည်။
- Admin အနေဖြင့် အခြား admin ၏ role ကို ပြောင်းလိုကောင်း ပြောင်းနိုင်သော်လည်း မိမိကိုယ်တိုင်ကို status ပိတ်ခြင်းနှင့် role ကို API ပုံစံဖြင့် မတိုးနိုင်စေရန် backend policy နဲ့ကာကွယ်ထားသည်။

## ၃။ Manager

### သုံးနိုင်သော စာမျက်နှာများ
- Dashboard
- Parcels list/detail/register/edit
- Deliveries listနှင့် assignment detail
- Profile

### လုပ်ဆောင်နိုင်သော အဓိကလုပ်ငန်းများ
- Mae Sot နှင့် Myawaddy သို့ရောက်လာသော parcel များကို စစ်ဆေးခြင်း
- Tracking number အလိုအလျောက် သို့မဟုတ် ကိုယ်တိုင်ထည့်ခြင်းနှင့် parcel အသစ်မှတ်ပုံတင်ခြင်း
- Recipient၊ address၊ priority၊ area၊ fee နှင့် COD အချက်အလက် ပြင်ဆင်ခြင်း
- ပါဆယ် ဖျက်ခြင်း (အတည်ပြု dialog ဖြင့်)
- ပါဆယ်ကို `VERIFIED` သို့ စစ်ဆေးအတည်ပြုခြင်း
- သတ်မှတ်ထားသော status transition ကို လုပ်ဆောင်ခြင်း
- Delivery staff workload၊ active assignment နှင့် delivery attempt ကြည့်ခြင်း
- `FAILED` ပါဆယ်များကို ပြန်လည်စီမံခြင်း

### ကန့်သတ်ချက်များ
- **Delivery staff assign/reassign မလုပ်နိုင်ပါ** — ဤလုပ်ဆောင်ချက်မှာ Accountant လုပ်ပိုင်ခွင့်ဖြစ်ပါသည်။
- `IN_TRANSIT` အခြေအနေရှိ ပါဆယ်ကို Manager က status မပြောင်းနိုင်ပါ။
- Terminal status (`DELIVERED`, `DAMAGED`) ပါဆယ်များကို edit မလုပ်နိုင်ပါ။
- Users နှင့် Settings UI မရှိပါ။ Backend Users list policy ထဲက Manager ကို view policy သတ်မှတ်ထားသော်လည်း frontend route/admin menu သည် Manager ဝင်ရောက်ခွင့် မပေးထားပါ။
- Delivery area API ကို Manager ကို backend အနေဖြင့် စီမံခန့်ခွဲခွင့်ပေးထားသော်လည်း Settings page/area management UI ကို admin-only route တွင်သာ ဖွင့်ထားပါသည်။

## ၄။ Accountant

### သုံးနိုင်သော စာမျက်နှာများ
- Dashboard (ပါဆယ် statistics — received, verified, out_for_delivery, failed)
- Parcels list နှင့် parcel detail
- Deliveries list နှင့် assignment detail
- Profile

### လုပ်ဆောင်နိုင်သော အဓိကလုပ်ငန်းများ
- ပါဆယ် status ကြည့်ခြင်း (RECEIVED, VERIFIED, PENDING_ASSIGNMENT, ASSIGNED, OUT_FOR_DELIVERY, DELIVERED, FAILED)
- ပါဆယ် status ပြောင်းလဲခြင်း (IN_TRANSIT မှလွဲ၍ — delivery staff သာ ပြောင်းနိုင်)
- Delivery staff ကို ပါဆယ်တစ်ခုချင်း ချိတ်ဆက်ခြင်းနှင့် ပြန်လည်ချိတ်ဆက်ခြင်း (Assign / Reassign)
- Delivery assignment detail ကြည့်ခြင်း

### ကန့်သတ်ချက်များ
- ပါဆယ်အသစ်ထည့်ခြင်း (create) မလုပ်နိုင်ပါ။
- ပါဆယ်ပြင်ဆင်ခြင်း (edit) နှင့် ဖျက်ခြင်း (delete) မလုပ်နိုင်ပါ။
- IN_TRANSIT status ကို တိုက်ရိုက်သတ်မှတ်ခွင့်မရှိပါ — assign လုပ်သောအခါ auto-set ဖြစ်ပါသည်။
- Users management၊ Settings နှင့် Audit Logs ကို ကြည့်ခွင့်မရှိပါ။
- Manager ၏ area/settings စီမံချက်များ မပါဝင်ပါ။

## ၅။ Delivery Staff

### သုံးနိုင်သော စာမျက်နှာများ
- Dashboard
- My Assignments
- Assignment Detail
- Cash Handovers
- Profile

### လုပ်ဆောင်နိုင်သော အဓိကလုပ်ငန်းများ
- မိမိ active assignment ပါသည့် parcel အသေးစိတ်ကိုသာ ကြည့်ခြင်း
- Tracking number၊ recipient၊ address၊ delivery instructions၊ area နှင့် phone information ကြည့်ခြင်း
- Google Maps address link ရှိပါက address ကို maps တွင်ဖွင့်ခြင်း
- Delivery attempt တွင် `DELIVERED` သို့မဟုတ် `FAILED` ရလဒ်ကို မှတ်တမ်းတင်ခြင်း
- Failed reason၊ recipient confirmation၊ recipient name နှင့် လမ်းညွှန်ရေးသားခြင်း
- Photo/signature/recipient-name proof of delivery တင်ခြင်း
- မိမိ dashboard နှင့် attempts ကြည့်ခြင်း

### ကန့်သတ်ချက်များ
- မိမိ assignment မဟုတ်သော parcel များ၊ assignment များနှင့် အခြား staff ၏ handover/payment များကို ကြည့်/ပြင်မရပါ။
- Active assignment ဖြင့်သာ attempt record လုပ်နိုင်ပါသည်။
- Assignment တင်ထားလျက် `ASSIGNED` သို့မဟုတ် `OUT_FOR_DELIVERY` ရှိသော parcel ကိုရော status transition အပိုင်းကို စာရင်းအုပ်စုဖြင့်သာ လုပ်ဆောင်နိုင်ပါသည်။
- Parcel list/register/edit၊ deliveries manager list၊ users၊ reports နှင့် settings တွင် ဝင်ရောက်ခွင့်မရှိပါ။

## ၆။ စာမျက်နှာဝင်ရောက်ခွင့် အကျဉ်း

| စာမျက်နှာ/လုပ်ဆောင်မှု | Admin | Manager | Accountant | Delivery Staff |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Parcels List | ✅ | ✅ | ✅ | ❌ |
| Parcel Detail / Tracking | ✅ | ✅ | ✅ | ✅ (ကိုယ်တိုင် assign ချည်ထားပါက) |
| Parcel Register / Edit | ✅ | ✅ | ❌ | ❌ |
| Terminal parcel edit | ❌ | ❌ | ❌ | ❌ |
| Parcel status ပြောင်းခြင်း | ✅ | ✅ (IN_TRANSIT မှလွဲ) | ✅ (IN_TRANSIT မှလွဲ) | ✅ (IN_TRANSIT သာ) |
| Staff assign/reassign | ✅ | ❌ | ✅ | ❌ |
| Deliveries/Assignments list | ✅ | ✅ | ✅ | ❌ |
| My Assignments | ❌ | ❌ | ❌ | ✅ |
| Assignment Detail | ✅ | ✅ | ✅ | ✅ (ကိုယ်တိုင်) |
| Delivery Fee / COD (ပါဆယ်အချက်အလက်) | ✅ | ✅ | ✅ (ကြည့်ရုံ) | ❌ |
| Users Management | ✅ | ❌ | ❌ | ❌ |
| Settings/Audit Logs | ✅ | ❌ | ❌ | ❌ |
| Profile | ✅ | ✅ | ✅ | ✅ |

## ၇။ လက်ရှိတည်ဆောက်ထားမှုနှင့် မှတ်ချက်များ

- `Reports` navigation သို့မဟုတ် frontend route သည် လက်ရှိ code တွင် မပါရှိသေးပါ။ ရှိသည့် ReportsPage ဖိုင်သည် route မချိတ်ထား၍ သုံးနိုင်ခြင်းမရှိပါ။
- ငွေကြေးလုပ်ငန်းများ (payments, expenses, cash handovers) ကို စနစ်မှ ဖယ်ရှားထားပါသည်။ ပါဆယ်တွင် delivery fee နှင့် COD အချက်အလက်ကိုသာ သိမ်းဆည်းပါသည်။
- Frontend ဝင်ရောက်ခွင့်သည် UI ကန့်သတ်ချက်သာ ဖြစ်ပြီး အစစ်အမှန် အခွင့်အရေးအတည်ပြုချက်မှာ backend policy/controller validation မှ ပေါ်လွင်ပါသည်။
- Role အသစ်မထပ်ထည့်မီ User role အမျိုးအစားနှင့် backend policy များကို ရှိနေသော `admin / manager / accountant / delivery_staff` တန်ဖိုးများနှင့် sync လုပ်ထားရပါမည်။
