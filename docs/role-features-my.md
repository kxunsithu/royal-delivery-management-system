# အသုံးပြုသူ အခန်းကဏ္ဍအလိုက် လုပ်ဆောင်ချက်များ

ဤစာရွက်စာတမ်းသည် Royal Myawaddy Delivery Management System တွင် လက်ရှိ codebase အရ လုပ်ဆောင်ပေးထားသော role၊ စာမျက်နှာဝင်ရောက်ခွင့်နှင့် ခွင့်ပြုချက်များကို မြန်မာဘာသာဖြင့် ရေးသားထားခြင်း ဖြစ်ပါသည်။

> **လုံခြုံရေးနှင့် UI မတူညီနိုင်မှု:** Frontend ၏ menu သို့မဟုတ် ခလုတ်များကို ဖျောက်ထားခြင်းသည် လုံခြုံရေးမဟုတ်ပါ။ Backend policy အားလုပ်ဆောင်ခွင့်များကို အမြဲစစ်ဆေးထားပါသည်။

## ၁။ အခန်းကဏ္ဍများ

| Role | အဓိကတာဝန် |
|---|---|
| Admin | စနစ်၊ အသုံးပြုသူ၊ ပါဆယ်၊ ငွေကြေး၊ အစီအမံနှင့် settings အားလုံးကို စီမံခန့်ခွဲခြင်း |
| Manager | ပါဆယ်လက်ခံခြင်း၊ စစ်ဆေးခြင်း၊ status လှုပ်ရှားခြင်းနှင့် delivery staff ချိတ်ဆက်ခြင်း |
| Accountant | သင့်တင့်ရေး၊ ငွေကြေးမှတ်တမ်း၊ expense နှင့် cash handover စိစစ်ခြင်း |
| Delivery Staff | မိမိသို့ချိတ်ထားသော delivery များကို ဆောင်ရွက်ခြင်းနှင့် ငွေ/လက်မှတ် handover တင်ခြင်း |

## ၂။ Admin

### သုံးနိုင်သော စာမျက်နှာများ
- Dashboard
- Parcels list၊ parcel detail၊ register နှင့် edit
- Deliveries list
- Finance၊ payments၊ expenses နှင့် cash handovers
- Users list/detail/create/edit
- Settings နှင့် delivery areas
- Profile

### လုပ်ဆောင်နိုင်သော အဓိကလုပ်ငန်းများ
- Dashboard၊ parcel statistic၊ financial statistic နှင့် delivery trend ကြည့်ခြင်း
- ပါဆယ်အသစ်ထည့်ခြင်း၊ ပြင်ခြင်းနှင့် စနစ်အတွင်းပါဆယ်အားလုံးကို ကြည့်ခြင်း
- ပါဆယ် ဖျက်ခြင်း (အတည်ပြု dialog ဖြင့်)
- ပါဆယ် status transition လုပ်ခြင်း
- Delivery staff သို့ပါဆယ်တစ်ခုချင်းချိတ်ခြင်းနှင့် ပြန်လည်ချိတ်ခြင်း
- Delivery assignment၊ မအောင်မြင်သော attempt နှင့် staff workload ကြည့်ခြင်း
- Payment/expense/cash handover မှတ်တမ်းများကို ကြည့်ခြင်း
- Expense အသစ်ဖန်တီးခြင်းနှင့် expense void လုပ်ခြင်း
- Cash handover submit၊ verify/dispute လုပ်ခြင်း
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
- သတ်မှတ်ထားသော status transition ကို လုပ်ဆောင်ခြင်း
- Parcel အသစ်ကို delivery staff ၏ assignment ထဲသို့ချိတ်ခြင်း၊ reassignment ပြုလုပ်ခြင်း
- Delivery staff workload၊ active assignment နှင့် delivery attempt ကြည့်ခြင်း
- `DELIVERY_FAILED` နှင့် `RETURN_TO_OFFICE` လုပ်ငန်းများကို ပြန်လည်စီမံခြင်း

### ကန့်သတ်ချက်များ
- `OUT_FOR_DELIVERY` ၏ parcel ကို Manager က status မပြောင်းနိုင်ပါ။
- Terminal status (`DELIVERED`, `DAMAGED`) ပါဆယ်များကို edit မလုပ်နိုင်ပါ။
- Users၊ Finance နှင့် Settings UI မရှိပါ။ Backend Users list policy ထဲက Manager ကို view policy သတ်မှတ်ထားသော်လည်း frontend route/admin menu သည် Manager ဝင်ရောက်ခွင့် မပေးထားပါ။
- Delivery area API ကို Manager ကို backend အနေဖြင့် စီမံခန့်ခွဲခွင့်ပေးထားသော်လည်း Settings page/area management UI ကို admin-only route တွင်သာ ဖွင့်ထားပါသည်။
- Expense၊ payment၊ finalized accounting transaction ကို တိုက်ရိုက်မပြင်နိုင်ပါ။

## ၄။ Accountant

### သုံးနိုင်သော စာမျက်နှာများ
- Dashboard
- Parcels list/detail သည် backend policy အရ ကြည့်နိုင်ခြင်း
- Finance
- Payments
- Expenses
- Cash Handovers
- Profile

### လုပ်ဆောင်နိုင်သော အဓိကလုပ်ငန်းများ
- Delivery fee နှင့် COD payment record ကြည့်ခြင်း
- Collected၊ Handed Over၊ Reconciled၊ Pending status များ ခွဲခြားကြည့်ခြင်း
- Daily/monthly collection နှင့် outstanding payment အကျဉ်းချုပ်ကြည့်ခြင်း
- Expense အသစ်ဖန်တီးခြင်း၊ expense list ကြည့်ခြင်း၊ void လုပ်ခြင်း
- Staff cash handover များကို submitted၊ verified၊ disputed အခြေအနေနှင့် စစ်ဆေးခြင်း
- Handover expected/submitted/verified amount နှင့် discrepancy ကို စစ်ဆေးခြင်း
- Financial summary/dashboard ကြည့်ခြင်း

### ကန့်သတ်ချက်များ
- Parcel register/edit/assign မလုပ်နိုင်ပါ။
- Delivery attempt ပြုလုပ်နိုင်ခြင်း၊ proof upload လုပ်နိုင်ခြင်း မရှိပါ။
- Users နှင့် Settings UI မရှိပါ။
- Handover တင်ခြင်း မပြုနိုင်ပါ။ Account ကို handover list verifyနိုင်သော်လည်း `submitHandover` policy မပါဝင်ပါ။
- Payments/status များကို တိုက်ရိုက်ပြင်နိုင်ခြင်းမရှိပါ။

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
- Delivery fee နှင့် COD တစ်လျှောက်ကို ခွဲခြားကောက်ခံချက်မှတ်တမ်းတင်ခြင်း
- Photo/signature/recipient-name proof of delivery တင်ခြင်း
- မိမိ dashboard၊ attempts၊ collected cash နှင့် pending handover ကြည့်ခြင်း
- Period သတ်မှတ်ပြီး cash handover submit တင်ခြင်း
- မိမိ၏ handover လက်ခံမှုအခြေအနေနှင့် မိမိ၏ payments ကိုသာ ကြည့်ခြင်း

### ကန့်သတ်ချက်များ
- မိမိ assignment မဟုတ်သော parcel များ၊ assignment များနှင့် အခြား staff ၏ handover/payment များကို ကြည့်/ပြင်မရပါ။
- Active assignment ဖြင့်သာ attempt record လုပ်နိုင်ပါသည်။
- Assignment တင်ထားလျက် `ASSIGNED` သို့မဟုတ် `OUT_FOR_DELIVERY` ရှိသော parcel ကိုရော status transition အပိုင်းကို စာရင်းအုပ်စုဖြင့်သာ လုပ်ဆောင်နိုင်ပါသည်။
- Parcel list/register/edit၊ deliveries manager list၊ finance admin/expenses၊ users၊ reports နှင့် settings တွင် ဝင်ရောက်ခွင့်မရှိပါ။
- Handover စိစစ်ခြင်း၊ accounting reconciliation ပြင်ခြင်းနှင့် expense ဖန်တီးခြင်း မလုပ်နိုင်ပါ။

## ၆။ စာမျက်နှာဝင်ရောက်ခွင့် အကျဉ်း

| စာမျက်နှာ/လုပ်ဆောင်မှု | Admin | Manager | Accountant | Delivery Staff |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Parcels List | ✅ | ✅ | ✅ | ❌ |
| Parcel Detail / Tracking | ✅ | ✅ | ✅ | ✅ (ကိုယ်တိုင် assign ချည်ထားပါက) |
| Parcel Register / Edit | ✅ | ✅ | ❌ | ❌ |
| Terminal parcel edit | ❌ | ❌ | ❌ | ❌ |
| Deliveries/Assignments list | ✅ | ✅ | ❌ | ❌ |
| My Assignments | ❌ | ❌ | ❌ | ✅ |
| Assignment Detail | ✅ | ✅ | ❌ | ✅ (ကိုယ်တိုင်) |
| Payments/Expenses | ✅ | ❌ | ✅ | ❌ |
| Cash Handover Submit | ✅ | ❌ | ❌ | ✅ |
| Cash Handover Verify | ✅ | ❌ | ✅ | ❌ |
| Financial Dashboard/Summary | ✅ | ❌ | ✅ | ❌ |
| Users Management | ✅ | ❌ | ❌ | ❌ |
| Settings/Audit Logs | ✅ | ❌ | ❌ | ❌ |
| Profile | ✅ | ✅ | ✅ | ✅ |

## ၇။ လက်ရှိတည်ဆောက်ထားမှုနှင့် မှတ်ချက်များ

- `Reports` navigation သို့မဟုတ် frontend route သည် လက်ရှိ code တွင် မပါရှိသေးပါ။ ရှိသည့် ReportsPage ဖိုင်သည် route မချိတ်ထား၍ သုံးနိုင်ခြင်းမရှိပါ။
- Backend ၏ `financialSummary` API တွင် financial report data ရှိသော်လည်း report navigation ထဲသို့ မတင်ထားပါ။
- Frontend ဝင်ရောက်ခွင့်သည် UI ကန့်သတ်ချက်သာ ဖြစ်ပြီး အစစ်အမှန် အခွင့်အရေးအတည်ပြုချက်မှာ backend policy/controller validation မှ ပေါ်လွင်ပါသည်။
- Role အသစ်မထပ်ထည့်မီ User role အမျိုးအစားနှင့် backend policy များကို ရှိနေသော `admin / manager / accountant / delivery_staff` တန်ဖိုးများနှင့် sync လုပ်ထားရပါမည်။
