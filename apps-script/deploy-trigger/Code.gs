/**
 * Bound to the Google Sheet as an "on edit" trigger.
 * Triggers a Netlify build when the Scholars or Stats tab is edited.
 *
 * SETUP:
 * 1. Open the Google Sheet
 * 2. Extensions → Apps Script
 * 3. Paste this code
 * 4. Set NETLIFY_BUILD_HOOK_URL below
 * 5. Triggers → Add Trigger → onSheetEdit → From spreadsheet → On edit
 */

const NETLIFY_BUILD_HOOK_URL = 'YOUR_NETLIFY_BUILD_HOOK_URL';
const DEBOUNCE_MINUTES = 5;

function onSheetEdit(e) {
  const sheet = e.source.getActiveSheet();
  const name = sheet.getName();

  if (name !== 'Scholars' && name !== 'Stats') return;

  const props = PropertiesService.getScriptProperties();
  const lastTrigger = props.getProperty('last_build_trigger');
  if (lastTrigger) {
    const elapsed = (Date.now() - parseInt(lastTrigger)) / (1000 * 60);
    if (elapsed < DEBOUNCE_MINUTES) {
      Logger.log('Debounced — last build triggered ' + Math.round(elapsed) + 'm ago');
      return;
    }
  }

  try {
    UrlFetchApp.fetch(NETLIFY_BUILD_HOOK_URL, { method: 'post' });
    props.setProperty('last_build_trigger', Date.now().toString());
    Logger.log('Netlify build triggered by edit to ' + name + ' tab');
  } catch (err) {
    Logger.log('Failed to trigger build: ' + err.message);
  }
}
