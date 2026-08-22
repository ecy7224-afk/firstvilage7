var FIELDS = [
  "id", "market", "name", "ticker", "price", "high", "low", "alertPct",
  "targetPrice", "stopLoss", "ma20", "ma60", "ma120",
  "per", "pbr", "dividendYield", "avgVolume", "curVolume", "earningsDate",
  "isHolding", "shares", "avgCost", "note"
];

function doGet(e) {
  var token = e.parameter.token;
  if (token !== getToken()) return json({ error: "unauthorized" });
  var items = readItems();
  var exchangeRate = Number(readSetting("exchangeRate")) || 1380;
  return json({ items: items, exchangeRate: exchangeRate });
}

function doPost(e) {
  var payload = JSON.parse(e.postData.contents);
  if (payload.token !== getToken()) return json({ error: "unauthorized" });
  writeItems(payload.items || []);
  writeSetting("exchangeRate", payload.exchangeRate || 1380);
  return json({ ok: true });
}

function readItems() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Watchlist");
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var items = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) obj[headers[j]] = row[j];
    items.push(obj);
  }
  return items;
}

function writeItems(items) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Watchlist");
  sheet.clearContents();
  sheet.appendRow(FIELDS);
  items.forEach(function (it) {
    var row = FIELDS.map(function (f) {
      return it[f] !== undefined && it[f] !== null ? it[f] : "";
    });
    sheet.appendRow(row);
  });
}

function readSetting(key) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");
  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return null;
}

function writeSetting(key, value) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");
  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

function getToken() {
  return readSetting("token");
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
