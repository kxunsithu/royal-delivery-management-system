export function printHtml(html: string) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Popup ပိတ်ထားသည်။ Print လုပ်ရန် popup ကို ခွင့်ပြုပါ။');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
  }, 300);
}