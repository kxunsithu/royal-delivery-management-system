export interface PrintableParcel {
  tracking_number: string
  sender_name?: string | null
  sender_phone?: string | null
  recipient_name: string
  recipient_phone: string
  delivery_address: string
  delivery_area?: { name?: string; name_mm?: string } | null
  description?: string | null
  quantity?: number
  weight?: number | null
  notes?: string | null
  delivery_fee: number
  cod_amount: number
  is_cod: boolean
  status: string
  condition?: string
  priority?: string
  received_at?: string | null
  received_by?: { name?: string } | null
  damage_description?: string | null
}

const labels = (lang: string) => {
  const my = lang === 'my'
  return {
    title: my ? 'ပါဆယ် လက်ခံဘောက်ချာ' : 'Parcel Receipt',
    tracking: my ? 'Tracking နံပါတ်' : 'Tracking Number',
    recipient: my ? 'လက်ခံသူ' : 'Recipient',
    phone: my ? 'ဖုန်းနံပါတ်' : 'Phone',
    address: my ? 'ပို့ဆောင်ရမည့် လိပ်စာ' : 'Delivery Address',
    area: my ? 'ပို့ဆောင်ရမည့် ဧရိယာ' : 'Delivery Area',
    sender: my ? 'ပို့သူ' : 'Sender',
    description: my ? 'ပါဆယ် ဖော်ပြချက်' : 'Description',
    quantity: my ? 'အရေအတွက်' : 'Quantity',
    weight: my ? 'အလေးချိန် (kg)' : 'Weight (kg)',
    condition: my ? 'အခြေအနေ' : 'Condition',
    priority: my ? 'ဦးစားပေး' : 'Priority',
    deliveryFee: my ? 'ပို့ဆောင်ခ' : 'Delivery Fee',
    cod: my ? 'COD ငွေပမာဏ' : 'COD Amount',
    status: my ? 'အခြေအနေ' : 'Status',
    receivedAt: my ? 'လက်ခံရရှိသည့် ရက်စွဲ' : 'Received At',
    receivedBy: my ? 'လက်ခံသူ (Staff)' : 'Received By',
    notes: my ? 'မှတ်ချက်' : 'Notes',
    printedAt: my ? 'ပုံနှိပ်သည့် ရက်စွဲ' : 'Printed At',
    footer: my ? 'ဤဘောက်ချာကို Royal\'s Myawaddy Delivery မှ ထုတ်ပေးခြင်းဖြစ်ပါသည်။' : 'Issued by Royal\'s Myawaddy Delivery.',
  }
}

function money(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

function dt(s?: string | null) {
  if (!s) return '-'
  try { return new Date(s).toLocaleString() } catch { return s }
}

function priorityLabel(priority: string | undefined, lang: string) {
  if (!priority) return '-'
  if (lang !== 'my') return priority.charAt(0) + priority.slice(1).toLowerCase()
  return ({ NORMAL: 'ပုံမှန်', HIGH: 'အရေးကြီး', URGENT: 'အရေးပေါ်' } as Record<string, string>)[priority] ?? priority
}

export function printParcelReceipt(parcel: PrintableParcel, lang: string = 'en') {
  const L = labels(lang)
  const areaName = lang === 'my' && parcel.delivery_area?.name_mm
    ? parcel.delivery_area.name_mm
    : (parcel.delivery_area?.name ?? '-')

  const rows: Array<[string, string]> = [
    [L.tracking, parcel.tracking_number],
  ]
  if (parcel.sender_name) rows.push([L.sender, `${parcel.sender_name}${parcel.sender_phone ? ' (' + parcel.sender_phone + ')' : ''}`])
  rows.push([L.recipient, parcel.recipient_name])
  rows.push([L.phone, parcel.recipient_phone])
  rows.push([L.address, parcel.delivery_address])
  rows.push([L.area, areaName])
  if (parcel.description) rows.push([L.description, parcel.description])
  rows.push([L.deliveryFee, money(parcel.delivery_fee)])
  if (parcel.is_cod) rows.push([L.cod, money(parcel.cod_amount)])

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${L.title} - ${parcel.tracking_number}</title>
  <style>
    body { font-family: Arial, "Noto Sans Myanmar", sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .sub { color: #555; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; font-size: 13px; }
    td:first-child { font-weight: 600; width: 40%; color: #333; }
    .footer { margin-top: 20px; font-size: 11px; color: #777; text-align: center; }
    .print-btn { margin-top: 16px; padding: 8px 16px; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <h1>${L.title}</h1>
  <div class="sub">${L.printedAt}: ${dt(new Date().toISOString())}</div>
  <table>
    ${rows.map(([k, v]) => `<tr><td>${k}</td><td>${String(v).replace(/</g, '&lt;')}</td></tr>`).join('')}
  </table>
  <div class="footer">${L.footer}</div>
  <button class="print-btn" onclick="window.print()">${L.title}</button>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=700,height=900')
  if (!w) return
  w.document.write(html)
  w.document.close()
}