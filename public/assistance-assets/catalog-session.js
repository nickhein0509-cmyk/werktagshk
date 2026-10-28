// Keep an already opened private catalogue from showing the previous account's
// data after another tab signs out or switches users. Authorization stays on the server.
function accountId(raw) { try { return JSON.parse(raw)?.user?.id ?? null; } catch { return null; } }
let current = null;
try { current = accountId(localStorage.getItem('werktag-learning-auth')); } catch { /* Legacy capability session. */ }
let leaving = false;
async function lock() {
  if (leaving) return;
  leaving = true;
  const message = document.createElement('p');
  message.textContent = 'Dein Konto hat sich geändert. Die Komponentenliste ist gesperrt.';
  const link = document.createElement('a'); link.href = '/konto'; link.textContent = 'Mein Konto öffnen';
  document.body.replaceChildren(message, link);
  try { await fetch('/assistenz/logout', { method: 'POST', credentials: 'same-origin', signal: AbortSignal.timeout(8000) }); } catch { /* Next entry checks the session again. */ }
  location.replace('/konto');
}
window.addEventListener('storage', event => {
  if (event.key === null || (event.key === 'werktag-learning-auth' && accountId(event.newValue) !== current)) void lock();
});
window.addEventListener('pageshow', event => { if (event.persisted) location.replace('/assistenz/components'); });
