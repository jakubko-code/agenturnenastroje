/**
 * Google Ads → Google Sheets full data export (v1)
 * 
 * Upravil: Pavol Jakubko + AI Assistant
 * 
 * Pridaný export 'pmax_search_terms', 'shopping_search_terms' 
 * Limit nastavený na min. 10 impresií
 * Pridané odstránenie prázdneho Google Sheet Hárku 1
 * Pridané zoradenie podľa odporúčanej metriky
 * 
 * NÁVOD:
 * 1. Vytvor si tabuľku v Google Sheets a pomenuj ju (napr. [Klient] - full data export)
 * 2. Vlož URL Google Sheetu do SPREADSHEET_URL, nižšie v časti Základne nastavenie
 * 3. Daj Overiť a spusti skript
 * 4. URL adresu Google Sheetu následne vlož do AI nástroja: AI: Audit Google Ads účtu
 * 
 */
function extractSpreadsheetId_(urlOrId) {
  if (!urlOrId) throw new Error('Missing spreadsheet URL/ID');
  if (urlOrId.indexOf('https://') !== 0) return urlOrId.trim();
  var m = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!m) throw new Error('Could not parse spreadsheet ID from URL: ' + urlOrId);
  return m[1];
}
function backoffSleep_(attempt) {
  var ms = Math.min(1000 * Math.pow(2, attempt), 10000); // 1s,2s,4s,8s,10s cap
  Utilities.sleep(ms);
}
function robustOpenSpreadsheetById_(id, maxAttempts) {
  maxAttempts = maxAttempts || 6;
  var lastErr;
  for (var a = 0; a < maxAttempts; a++) {
    try { return SpreadsheetApp.openById(id); }
    catch (e) { lastErr = e; Logger.log('openById attempt ' + (a + 1) + ' failed: ' + e); backoffSleep_(a); }
  }
  throw new Error('Failed to open spreadsheet after ' + maxAttempts + ' attempts: ' + lastErr);
}
function robustGetSheetByName_(ss, name, maxAttempts) {
  maxAttempts = maxAttempts || 6;
  var lastErr;
  for (var a = 0; a < maxAttempts; a++) {
    try { return ss.getSheetByName(name) || null; }
    catch (e) { lastErr = e; Logger.log('getSheetByName[' + name + '] attempt ' + (a + 1) + ' failed: ' + e); backoffSleep_(a); }
  }
  throw new Error('Failed getSheetByName[' + name + '] after ' + maxAttempts + ' attempts: ' + lastErr);
}
function robustInsertSheet_(ss, name, maxAttempts) {
  maxAttempts = maxAttempts || 6;
  var lastErr;
  for (var a = 0; a < maxAttempts; a++) {
    try {
      var existing = ss.getSheetByName(name);
      if (existing) return existing;
      return ss.insertSheet(name);
    } catch (e) {
      lastErr = e; Logger.log('insertSheet[' + name + '] attempt ' + (a + 1) + ' failed: ' + e); backoffSleep_(a);
    }
  }
  throw new Error('Failed insertSheet[' + name + '] after ' + maxAttempts + ' attempts: ' + lastErr);
}
function ensureSheet_(ss, name) {
  var sh = robustGetSheetByName_(ss, name);
  if (sh) return sh;
  return robustInsertSheet_(ss, name);
}

// ------------ Základné nastavenie ------------------
// Časť Config odporúčam neupravovať
function main() {
  var SPREADSHEET_URL = 'TU_VLOŽ_URL_ADRESU_GOOGLE_SHEETU';
  // ---------- Config ----------
  var THROTTLE_MS = 700;      // be gentle to Sheets
  var HEAVY_LIMIT = 120000;   // cap heavy tabs; set null to disable
  // ---------- Date helpers (account timezone) ----------
  var TZ = AdsApp.currentAccount().getTimeZone();
  function fmt_(d) { return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); }
  function rangeLastNDays_(n) {
    var end = new Date(); end.setDate(end.getDate() - 1); // yesterday
    var start = new Date(); start.setDate(start.getDate() - n);
    return { start: fmt_(start), end: fmt_(end) };
  }
  var R30 = rangeLastNDays_(30);
  function limit_(q) { return (HEAVY_LIMIT && HEAVY_LIMIT > 0) ? (q + '\nLIMIT ' + HEAVY_LIMIT) : q; }
  // Open by ID with retries
  var _targetId = extractSpreadsheetId_(SPREADSHEET_URL);
  var ss = robustOpenSpreadsheetById_(_targetId, 6);
  // ---------- GAQL queries (Lean set; aggregated over R30 where noted) ----------
  var QUERIES = [
    {
      name: 'campaign',
      query: `
        SELECT
          customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone,
          campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.bidding_strategy_type,
          campaign_budget.amount_micros,
          metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc,
          metrics.cost_micros, metrics.conversions, metrics.conversions_value,
          metrics.all_conversions, metrics.all_conversions_value, metrics.view_through_conversions,
          metrics.search_impression_share, metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share
        FROM campaign
        WHERE segments.date BETWEEN '${R30.start}' AND '${R30.end}'
          AND metrics.impressions >= 10`
    },
    {
      name: 'search_is',
      query: `
        SELECT
          customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone,
          campaign.id, campaign.name,
          metrics.search_impression_share, metrics.search_top_impression_share, metrics.search_absolute_top_impression_share,
          metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share
        FROM campaign
        WHERE segments.date BETWEEN '${R30.start}' AND '${R30.end}'
          AND metrics.impressions >= 10`
    },
    {
      name: 'keywords',
      query: limit_(`
        SELECT
          customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone,
          segments.device, segments.ad_network_type,
          campaign.id, campaign.name,
          ad_group.id, ad_group.name,
          ad_group_criterion.criterion_id,
          ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status,
          metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc,
          metrics.cost_micros, metrics.conversions, metrics.conversions_value,
          metrics.all_conversions, metrics.all_conversions_value
        FROM keyword_view
        WHERE segments.date BETWEEN '${R30.start}' AND '${R30.end}'
          AND metrics.impressions >= 10
          AND ad_group_criterion.status != 'REMOVED'`)
    },
    {
      name: 'search_terms',
      query: limit_(`
        SELECT
          customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone,
          campaign.id, campaign.name,
          ad_group.id, ad_group.name,
          search_term_view.search_term,
          segments.keyword.info.match_type,
          metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value
        FROM search_term_view
        WHERE segments.date BETWEEN '${R30.start}' AND '${R30.end}'
          AND metrics.impressions >= 10`)
    },
    {
      name: 'pmax_search_terms',
      query: limit_(`
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          campaign.id,
          campaign.name,
          campaign.advertising_channel_type,
          campaign_search_term_view.search_term,
          segments.search_term_match_source,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign_search_term_view
        WHERE segments.date BETWEEN '${R30.start}' AND '${R30.end}'
          AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
          AND metrics.impressions >= 10
      `)
    },
    {
      name: 'shopping_search_terms',
      query: limit_(`
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          campaign.id,
          campaign.name,
          campaign.advertising_channel_type,
          campaign_search_term_view.search_term,
          segments.search_term_match_source,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign_search_term_view
        WHERE segments.date BETWEEN '${R30.start}' AND '${R30.end}'
          AND campaign.advertising_channel_type = 'SHOPPING'
          AND metrics.impressions >= 10
      `)
    },
    {
      name: 'ads',
      query: `
        SELECT
          customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone,
          campaign.id, campaign.name,
          ad_group.id, ad_group.name,
          ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.policy_summary.approval_status,
          ad_group_ad.ad.type, ad_group_ad.ad.final_urls,
          metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros,
          metrics.conversions, metrics.conversions_value
        FROM ad_group_ad
        WHERE segments.date BETWEEN '${R30.start}' AND '${R30.end}'
          AND metrics.impressions >= 10`
    },
    {
      name: 'ads_search_display',
      query: limit_(`
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          campaign.id,
          campaign.name,
          campaign.advertising_channel_type,
          ad_group.id,
          ad_group.name,
          ad_group_ad.ad.id,
          ad_group_ad.status,
          ad_group_ad.policy_summary.approval_status,
          ad_group_ad.ad.type,
          ad_group_ad.ad.final_urls,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.average_cpc,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM ad_group_ad
        WHERE segments.date BETWEEN '${R30.start}' AND '${R30.end}'
          AND campaign.advertising_channel_type IN ('SEARCH','DISPLAY')
          AND ad_group_ad.status IN ('ENABLED','PAUSED')
          AND metrics.impressions >= 10
        ORDER BY metrics.impressions DESC
      `)
    },
    {
      name: 'ads_pmax_shopping',
      query: limit_(`
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          campaign.id,
          campaign.name,
          campaign.advertising_channel_type,
          ad_group.id,
          ad_group.name,
          ad_group_ad.ad.id,
          ad_group_ad.status,
          ad_group_ad.policy_summary.approval_status,
          ad_group_ad.ad.type,
          ad_group_ad.ad.final_urls,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.average_cpc,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM ad_group_ad
        WHERE segments.date BETWEEN '${R30.start}' AND '${R30.end}'
          AND campaign.advertising_channel_type IN ('PERFORMANCE_MAX','SHOPPING')
          AND ad_group_ad.status IN ('ENABLED','PAUSED')
          AND metrics.impressions >= 10
        ORDER BY metrics.impressions DESC
      `)
    },
    {
      name: 'landing_pages',
      query: `
        SELECT
          customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone,
          landing_page_view.unexpanded_final_url,
          metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros,
          metrics.conversions, metrics.conversions_value
        FROM landing_page_view
        WHERE segments.date BETWEEN '${R30.start}' AND '${R30.end}'
          AND metrics.impressions >= 10`
    },
    {
      name: 'campaign_device_network',
      query: `
        SELECT
          customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone,
          segments.device, segments.ad_network_type,
          campaign.id, campaign.name,
          metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros,
          metrics.conversions, metrics.conversions_value
        FROM campaign
        WHERE segments.date BETWEEN '${R30.start}' AND '${R30.end}'
          AND metrics.impressions >= 10`
    },
    {
      name: 'campaign_geo',
      query: `
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          campaign.id,
          campaign.name,
          campaign.advertising_channel_type,
          campaign_criterion.location.geo_target_constant,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM location_view
        WHERE segments.date BETWEEN '${R30.start}' AND '${R30.end}'
          AND metrics.impressions >= 10`
    },
    {
      name: 'conversion_actions',
      query: `
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          segments.conversion_action,
          segments.conversion_action_name,
          segments.conversion_action_category,
          metrics.conversions,
          metrics.conversions_value,
          metrics.all_conversions,
          metrics.all_conversions_value
        FROM customer
        WHERE segments.date BETWEEN '${R30.start}' AND '${R30.end}'`
    }
  ];

  // Export core tabs via AWQL/GAQL report API
  for (var i = 0; i < QUERIES.length; i++) {
    var q = QUERIES[i];
    var sheet = ensureSheet_(ss, q.name);
    sheet.clearContents();
    try {
      var report = AdsApp.report(q.query);
      report.exportToSheet(sheet);
      SpreadsheetApp.flush();
      Utilities.sleep(200);
      autoResizeColumns_(sheet);
      // 🔽 NOVÉ: zoradenie podľa odporúčanej metriky
      switch (q.name) {
        case 'campaign':
        case 'keywords':
        case 'search_terms':
        case 'pmax_search_terms':
        case 'shopping_search_terms':
        case 'campaign_device_network':
        case 'campaign_geo':
          sortSheetByHeader_(sheet, 'metrics.cost_micros', true);
          break;
        case 'search_is':
          sortSheetByHeader_(sheet, 'metrics.search_impression_share', true);
          break;
        case 'ads':
        case 'ads_search_display':
        case 'ads_pmax_shopping':
          sortSheetByHeader_(sheet, 'metrics.impressions', true);
          break;
        case 'landing_pages':
          sortSheetByHeader_(sheet, 'metrics.conversions_value', true);
          break;
        case 'conversion_actions':
          sortSheetByHeader_(sheet, 'metrics.conversions_value', true);
          break;
      }
    } catch (e) {
      sheet.getRange(1, 1, 1, 1).setValue('ERROR: ' + e);
      Logger.log('Failed tab "' + q.name + '": ' + e);
    }
    Utilities.sleep(THROTTLE_MS);
  }
  // RSA assets: CLEAN schema (manual writer), last 30 days
  try { exportRsaAssetsClean_(ss, R30); }
  catch (e) {
    var sh = ensureSheet_(ss, 'rsa_assets');
    sh.clearContents();
    sh.getRange(1, 1, 1, 1).setValue('ERROR: ' + e);
    Logger.log('Failed tab "rsa_assets": ' + e);
  }
  // Quality Score (keyword attributes) — attributes only (static; no date)
  try { exportQualityScoreKeywords_(ss); }
  catch (e) {
    var qs = ensureSheet_(ss, 'quality_score_keywords');
    qs.clearContents();
    qs.getRange(1, 1, 1, 1).setValue('ERROR: ' + e);
    Logger.log('Failed tab "quality_score_keywords": ' + e);
  }
  // Post-process: micros normalization & derived metrics
  normalizeMicrosAll_(ss);
  computeDerivedMetricsAll_(ss);
  // Build ad → LP map from ads
  try { buildAdToLpMap_(ss); }
  catch (e) {
    var mapSh = ensureSheet_(ss, 'ad_to_lp_map');
    mapSh.clearContents();
    mapSh.getRange(1, 1, 1, 1).setValue('ERROR: ' + e);
    Logger.log('Failed building ad_to_lp_map: ' + e);
  }
  // Tidy
  removeDefaultSheet_(ss);
  Logger.log('Export complete (Lean v6).');
}

///////////////////////////////
// RSA assets (CLEAN schema) //
///////////////////////////////
function exportRsaAssetsClean_(ss, rangeObj) {
  var sheet = ss.getSheetByName('rsa_assets') || ss.insertSheet('rsa_assets');
  sheet.clearContents();
  var headers = [
    'customer.id', 'customer.descriptive_name', 'customer.currency_code', 'customer.time_zone',
    'campaign.id', 'campaign.name', 'ad_group.id', 'ad_group.name', 'ad_id',
    'field_type', 'performance_label', 'asset_id', 'asset_type', 'asset_text',
    'impressions', 'clicks', 'cost_micros', 'cost', 'conversions', 'conversions_value'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var q = `
    SELECT
      customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone,
      campaign.id, campaign.name,
      ad_group.id, ad_group.name,
      ad_group_ad.ad.id,
      ad_group_ad_asset_view.field_type, ad_group_ad_asset_view.performance_label,
      asset.id, asset.type, asset.text_asset.text,
      metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value
    FROM ad_group_ad_asset_view
    WHERE segments.date BETWEEN '${rangeObj.start}' AND '${rangeObj.end}'
      AND metrics.impressions >= 10`;
  var report = AdsApp.report(q);
  var rows = report.rows();
  var out = [];
  var BATCH = 4000, count = 0;
  while (rows.hasNext()) {
    var r = rows.next();
    var costMicros = num_(r['metrics.cost_micros']);
    out.push([
      r['customer.id'], r['customer.descriptive_name'], r['customer.currency_code'], r['customer.time_zone'],
      r['campaign.id'], r['campaign.name'],
      r['ad_group.id'], r['ad_group.name'],
      r['ad_group_ad.ad.id'],
      r['ad_group_ad_asset_view.field_type'], r['ad_group_ad_asset_view.performance_label'],
      r['asset.id'], r['asset.type'], r['asset.text_asset.text'],
      num_(r['metrics.impressions']), num_(r['metrics.clicks']),
      costMicros, costMicros / 1e6,
      num_(r['metrics.conversions']), num_(r['metrics.conversions_value'])
    ]);
    count++;
    if (out.length >= BATCH) {
      sheet.getRange(sheet.getLastRow() + 1, 1, out.length, headers.length).setValues(out);
      out = [];
    }
  }
  if (out.length) sheet.getRange(sheet.getLastRow() + 1, 1, out.length, headers.length).setValues(out);
  SpreadsheetApp.flush();
  autoResizeColumns_(sheet);
  // 🔽 zoradenie RSA assets podľa impresií
  sortSheetByHeader_(sheet, 'impressions', true);
  Logger.log('rsa_assets rows: ' + count);
}

///////////////////////////////////////
// Quality Score (keyword attributes) //
///////////////////////////////////////
function exportQualityScoreKeywords_(ss) {
  var sheet = ss.getSheetByName('quality_score_keywords') || ss.insertSheet('quality_score_keywords');
  sheet.clearContents();
  var headers = [
    'customer.id', 'customer.descriptive_name', 'customer.currency_code', 'customer.time_zone',
    'campaign.id', 'campaign.name', 'ad_group.id', 'ad_group.name',
    'criterion_id', 'keyword_text', 'status',
    'quality_score', 'search_predicted_ctr', 'creative_quality_score', 'post_click_quality_score'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var q = `
    SELECT
      customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone,
      campaign.id, campaign.name,
      ad_group.id, ad_group.name,
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.status,
      ad_group_criterion.quality_info.quality_score,
      ad_group_criterion.quality_info.search_predicted_ctr,
      ad_group_criterion.quality_info.creative_quality_score,
      ad_group_criterion.quality_info.post_click_quality_score
    FROM ad_group_criterion
    WHERE ad_group_criterion.type = KEYWORD
      AND ad_group_criterion.status != 'REMOVED'`;
  var report = AdsApp.report(q);
  var rows = report.rows();
  var out = [];
  var BATCH = 5000, count = 0;
  while (rows.hasNext()) {
    var r = rows.next();
    out.push([
      r['customer.id'], r['customer.descriptive_name'], r['customer.currency_code'], r['customer.time_zone'],
      r['campaign.id'], r['campaign.name'],
      r['ad_group.id'], r['ad_group.name'],
      r['ad_group_criterion.criterion_id'],
      r['ad_group_criterion.keyword.text'],
      r['ad_group_criterion.status'],
      r['ad_group_criterion.quality_info.quality_score'],
      r['ad_group_criterion.quality_info.search_predicted_ctr'],
      r['ad_group_criterion.quality_info.creative_quality_score'],
      r['ad_group_criterion.quality_info.post_click_quality_score']
    ]);
    count++;
    if (out.length >= BATCH) {
      sheet.getRange(sheet.getLastRow() + 1, 1, out.length, headers.length).setValues(out);
      out = [];
    }
  }
  if (out.length) sheet.getRange(sheet.getLastRow() + 1, 1, out.length, headers.length).setValues(out);
  SpreadsheetApp.flush();
  autoResizeColumns_(sheet);
  // 🔽 zoradenie QS podľa skóre
  sortSheetByHeader_(sheet, 'quality_score', true);
  Logger.log('quality_score_keywords rows: ' + count);
}

//////////////////////////////
// ad → landing page mapping //
//////////////////////////////
function buildAdToLpMap_(ss) {
  var adsSh = ss.getSheetByName('ads');
  if (!adsSh) return;
  var mapSh = ss.getSheetByName('ad_to_lp_map') || ss.insertSheet('ad_to_lp_map');
  mapSh.clearContents();
  var headers = [
    'customer.id', 'customer.descriptive_name', 'customer.currency_code', 'customer.time_zone',
    'campaign.id', 'campaign.name', 'ad_group.id', 'ad_group.name', 'ad_id',
    'final_url_raw', 'final_url_norm', 'domain', 'expanded_url_raw', 'expanded_url_norm'
  ];
  mapSh.getRange(1, 1, 1, headers.length).setValues([headers]);
  var data = adsSh.getDataRange().getValues();
  if (data.length < 2) return;
  var H = {};
  data[0].forEach(function(h, i) { H[String(h).trim()] = i; });
  function col(name) { return H[name] != null ? H[name] : -1; }
  var out = [];
  var BATCH = 4000;
  for (var r = 1; r < data.length; r++) {
    var cust = data[r][col('customer.id')];
    var cname = data[r][col('customer.descriptive_name')];
    var curr = data[r][col('customer.currency_code')];
    var tz = data[r][col('customer.time_zone')];
    var camp = data[r][col('campaign.id')];
    var campN = data[r][col('campaign.name')];
    var ag = data[r][col('ad_group.id')];
    var agN = data[r][col('ad_group.name')];
    var adid = data[r][col('ad_group_ad.ad.id')];
    var finalUrls = data[r][col('ad_group_ad.ad.final_urls')];
    if (finalUrls && typeof finalUrls === 'string') {
      finalUrls.split(',').forEach(function(uRaw) {
        var uTrim = uRaw.trim();
        var uClean = stripTrackingParams_(uTrim);
        var norm = normalizeUrl_(uClean);
        out.push([
          cust, cname, curr, tz,
          camp, campN, ag, agN, adid,
          uTrim, norm, extractDomain_(norm),
          '', '' // reserved for future expanded URL join
        ]);
      });
    }
    if (out.length >= BATCH) {
      mapSh.getRange(mapSh.getLastRow() + 1, 1, out.length, headers.length).setValues(out);
      out = [];
    }
  }
  if (out.length) mapSh.getRange(mapSh.getLastRow() + 1, 1, out.length, headers.length).setValues(out);
  SpreadsheetApp.flush();
  autoResizeColumns_(mapSh);
}

///////////////////////////
// Post-processing utils //
///////////////////////////
function normalizeMicrosAll_(ss) {
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    var values = sh.getDataRange().getValues();
    if (values.length < 2) continue;
    var headers = values[0];
    var microsIdx = [];
    for (var i = 0; i < headers.length; i++) {
      if (String(headers[i]).toLowerCase().indexOf('_micros') > -1) microsIdx.push(i);
    }
    if (!microsIdx.length) continue;
    var lastCol = headers.length;
    for (var k = 0; k < microsIdx.length; k++) {
      var hName = String(headers[microsIdx[k]]).replace('_micros', '');
      sh.getRange(1, lastCol + 1 + k).setValue(hName);
    }
    for (var r = 1; r < values.length; r++) {
      for (var k = 0; k < microsIdx.length; k++) {
        var v = values[r][microsIdx[k]];
        var out = (typeof v === 'number') ? v / 1e6 : (v === '' ? '' : Number(v) / 1e6);
        sh.getRange(r + 1, lastCol + 1 + k).setValue(out);
      }
    }
    SpreadsheetApp.flush();
    autoResizeColumns_(sh);
  }
}
function computeDerivedMetricsAll_(ss) {
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    var values = sh.getDataRange().getValues();
    if (values.length < 2) continue;
    var headers = values[0];
    var idx = {};
    for (var i = 0; i < headers.length; i++) idx[String(headers[i]).trim().toLowerCase()] = i;
    var clicksIdx = idx['metrics.clicks'] != null ? idx['metrics.clicks'] : idx['clicks'];
    var convIdx = idx['metrics.conversions'] != null ? idx['metrics.conversions'] : idx['conversions'];
    var valueIdx = idx['metrics.conversions_value'] != null ? idx['metrics.conversions_value'] : idx['conversions_value'];
    var costIdx = idx['cost'] != null ? idx['cost'] : (idx['metrics.cost'] != null ? idx['metrics.cost'] : -1);
    if ((costIdx >= 0) && (convIdx >= 0 || valueIdx >= 0 || clicksIdx >= 0)) {
      var newHeaders = [];
      if (convIdx >= 0) newHeaders.push('CPA');
      if (valueIdx >= 0) newHeaders.push('ROAS');
      if (clicksIdx >= 0 && convIdx >= 0) newHeaders.push('CVR');
      if (newHeaders.length) {
        sh.getRange(1, headers.length + 1, 1, newHeaders.length).setValues([newHeaders]);
        for (var r = 1; r < values.length; r++) {
          var row = [];
          var cost = Number(values[r][costIdx]) || 0;
          var conv = convIdx >= 0 ? Number(values[r][convIdx]) || 0 : null;
          var val = valueIdx >= 0 ? Number(values[r][valueIdx]) || 0 : null;
          var clk = clicksIdx >= 0 ? Number(values[r][clicksIdx]) || 0 : null;
          if (convIdx >= 0) row.push(conv > 0 ? (cost / conv) : '');
          if (valueIdx >= 0) row.push(cost > 0 ? (val / cost) : '');
          if (clicksIdx >= 0 && convIdx >= 0) row.push(clk > 0 ? (conv / clk) : '');
          sh.getRange(r + 1, headers.length + 1, 1, row.length).setValues([row]);
        }
        SpreadsheetApp.flush();
        autoResizeColumns_(sh);
      }
    }
  }
}

////////////////////
// Misc utilities //
////////////////////
function num_(x) {
  if (x === null || x === undefined) return 0;
  if (typeof x === 'number') return x;
  var n = Number(x);
  return isNaN(n) ? 0 : n;
}
function normalizeUrl_(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    var u = new URL(url);
    var host = (u.hostname || '').toLowerCase();
    var path = (u.pathname || '').replace(/\/+$/, '');
    return 'https://' + host + (path ? path : '');
  } catch (e) {
    var noHash = url.split('#')[0];
    var noQuery = noHash.split('?')[0];
    return noQuery.replace(/\/+$/, '').toLowerCase();
  }
}
function stripTrackingParams_(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    var u = new URL(url);
    var params = u.searchParams;
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'gclid', 'gbraid', 'wbraid', 'msclkid', 'fbclid', 'yclid'].forEach(function(p) { params.delete(p); });
    u.search = params.toString();
    return u.toString();
  } catch (e) {
    return url;
  }
}
function extractDomain_(normUrl) {
  if (!normUrl) return '';
  try {
    var u = new URL(normUrl);
    return (u.hostname || '').toLowerCase();
  } catch (e) {
    var m = String(normUrl).replace(/^https?:\/\//, '').split('/')[0];
    return (m || '').toLowerCase();
  }
}
function autoResizeColumns_(sheet) {
  try {
    var lastCol = sheet.getLastColumn();
    if (lastCol > 0) sheet.autoResizeColumns(1, lastCol);
  } catch (e) {
    Logger.log('Auto-resize skipped: ' + e);
  }
}
/**
 * Zoradí dáta v hárku podľa vybraného stĺpca (podľa headera).
 * headerName = presný text v prvom riadku (napr. "metrics.impressions").
 * Ak stĺpec neexistuje alebo hárok má <2 riadky, nič nerobí.
 */
function sortSheetByHeader_(sheet, headerName, descending) {
  try {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol === 0) return;
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var colIndex = -1;
    for (var i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === headerName) {
        colIndex = i + 1; // sort() používa 1-based index
        break;
      }
    }
    if (colIndex === -1) {
      Logger.log('sortSheetByHeader_: header "' + headerName + '" sa nenašiel v ' + sheet.getName());
      return;
    }
    var range = sheet.getRange(2, 1, lastRow - 1, lastCol);
    range.sort({
      column: colIndex,
      ascending: !descending
    });
    Logger.log('Zoradený hárok ' + sheet.getName() + ' podľa "' + headerName + '" (' + (descending ? 'DESC' : 'ASC') + ')');
  } catch (e) {
    Logger.log('Chyba sortSheetByHeader_ na ' + sheet.getName() + ': ' + e);
  }
}
function removeBlankSheet_(ss, name) {
  try {
    var sh = ss.getSheetByName(name);
    if (sh && sh.getLastRow() === 0 && ss.getSheets().length > 1) {
      ss.deleteSheet(sh);
    }
  } catch (e) {
    Logger.log('Skip removing ' + name + ': ' + e);
  }
}
/**
 * Odstráni prázdny hárok "Hárok1" alebo "Sheet1", ak existuje.
 * Nespôsobí chybu, ak hárok neexistuje alebo je jediný v dokumente.
 */
function removeDefaultSheet_(ss) {
  try {
    var sheets = ss.getSheets();
    // Ak je v dokumente iba jeden hárok, nemaž ho
    if (sheets.length <= 1) return;
    // Možné default názvy (SK aj EN)
    var names = ["Sheet1", "Hárok1"];
    names.forEach(function(name) {
      var sh = ss.getSheetByName(name);
      if (sh && sh.getLastRow() === 0) {
        ss.deleteSheet(sh);
        Logger.log("Odstránený prázdny defaultný hárok: " + name);
      }
    });
  } catch (e) {
    Logger.log("Chyba pri odstraňovaní defaultného hárku: " + e);
  }
}
