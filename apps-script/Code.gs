/**
 * Frederick Storage — holiday giveaway entries → Google Sheet
 *
 * A standalone Apps Script project owned by frederickcostorage@gmail.com that writes
 * to the "Frederick Storage Giveaway Entries" spreadsheet (SHEET_ID below). Deployed as a web app:
 *   Execute as: Me   ·   Who has access: Anyone
 * The site's /assets/js/config.js holds the deployment's /exec URL.
 *
 * Each entry: one row on the "Entries" tab, an email to the owner, and a
 * confirmation email to the person who entered (first entry only).
 */

var SHEET_ID = '1-eZsDqvldHYdMzEol6ytrlQNzW-cwy8Ft_kYczBYfyI';
var OWNER_EMAIL = 'frederickcostorage@gmail.com';
var SHEET_NAME = 'Entries';
var DRAW_DATE = 'January 5';
var SITE = 'https://frederick-storage.com';

var COLUMNS = [
  ['submitted_at', 'Submitted at'],
  ['first_name', 'First name'],
  ['last_name', 'Last name'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['size', 'Size in mind'],
  ['timing', 'When they need it'],
  ['opt_in', 'Email when open'],
  ['repeat', 'Repeat entry'],
  ['utm_source', 'utm_source'],
  ['utm_medium', 'utm_medium'],
  ['utm_campaign', 'utm_campaign'],
  ['page', 'Page'],
  ['referrer', 'Referrer']
];

/** Run once from the editor: creates the Entries tab and its header row. */
function setup() {
  var sheet = getSheet_();
  SpreadsheetApp.openById(SHEET_ID).setSpreadsheetTimeZone('America/Denver');
  sheet.getRange(1, 1, 1, COLUMNS.length)
    .setValues([COLUMNS.map(function (c) { return c[1]; })])
    .setFontWeight('bold')
    .setBackground('#3D5A73')
    .setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd h:mm am/pm');
  sheet.autoResizeColumns(1, COLUMNS.length);
}

function doGet() {
  return json_({ ok: true, service: 'Frederick Storage giveaway entries' });
}

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Hidden field only bots fill in: accept quietly, store nothing.
  if (p.company) return json_({ ok: true });

  var entry = {
    first_name: clean_(p.first_name, 80),
    last_name: clean_(p.last_name, 80),
    email: clean_(p.email, 200).toLowerCase(),
    phone: clean_(p.phone, 40),
    size: clean_(p.size, 60),
    timing: clean_(p.timing, 60),
    opt_in: p.opt_in === 'yes' ? 'Yes' : 'No',
    utm_source: clean_(p.utm_source, 120),
    utm_medium: clean_(p.utm_medium, 120),
    utm_campaign: clean_(p.utm_campaign, 120),
    page: clean_(p.page, 200),
    referrer: clean_(p.referrer, 300)
  };

  if (!entry.first_name || !entry.last_name) return json_({ ok: false, error: 'name' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) return json_({ ok: false, error: 'email' });
  if (p.agree !== 'yes') return json_({ ok: false, error: 'agree' });

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }

  var isRepeat;
  try {
    var sheet = getSheet_();
    isRepeat = emailExists_(sheet, entry.email);
    entry.repeat = isRepeat ? 'Yes' : '';
    entry.submitted_at = new Date();
    sheet.appendRow(COLUMNS.map(function (c) { return safeCell_(entry[c[0]]); }));
  } finally {
    lock.releaseLock();
  }

  // Emails are best effort: a mail failure must not lose the entry or show an error.
  try { notifyOwner_(entry); } catch (err) { console.error('owner email', err); }
  if (!isRepeat) {
    try { confirmEntrant_(entry); } catch (err) { console.error('confirmation email', err); }
  }

  return json_({ ok: true, repeat: isRepeat });
}

function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function emailExists_(sheet, email) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var col = COLUMNS.map(function (c) { return c[0]; }).indexOf('email') + 1;
  var values = sheet.getRange(2, col, last - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase() === email) return true;
  }
  return false;
}

function notifyOwner_(entry) {
  var lines = [
    'New holiday giveaway entry' + (entry.repeat ? ' (repeat email, not counted twice)' : '') + ':',
    '',
    'Name: ' + entry.first_name + ' ' + entry.last_name,
    'Email: ' + entry.email,
    'Phone: ' + (entry.phone || '—'),
    'Size in mind: ' + (entry.size || '—'),
    'When they need it: ' + (entry.timing || '—'),
    'Email when open: ' + entry.opt_in,
    'Came from: ' + (entry.utm_source || 'direct / unknown'),
    '',
    'All entries: ' + SpreadsheetApp.openById(SHEET_ID).getUrl()
  ];
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: 'Giveaway entry: ' + entry.first_name + ' ' + entry.last_name,
    body: lines.join('\n'),
    name: 'Frederick Storage website'
  });
}

function confirmEntrant_(entry) {
  var optInLine = entry.opt_in === 'Yes' ? 'We\'ll also let you know when we open for rentals.\n\n' : '';
  var body =
    'Hi ' + entry.first_name + ',\n\n' +
    'You\'re entered to win 3 months of free storage at Frederick Storage. ' +
    'We\'ll draw one winner on ' + DRAW_DATE + ' and email them that day.\n\n' +
    optInLine +
    'The official rules are at ' + SITE + '/rules/\n\n' +
    'Frederick Storage\n' +
    'Just off Colorado Boulevard, two minutes from downtown Frederick\n' +
    SITE;
  MailApp.sendEmail({
    to: entry.email,
    subject: 'You\'re entered',
    body: body,
    name: 'Frederick Storage',
    replyTo: OWNER_EMAIL
  });
}

function clean_(value, max) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
}

// Stop a value like "=IMPORTXML(...)" being read as a formula.
function safeCell_(value) {
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) return "'" + value;
  return value == null ? '' : value;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
