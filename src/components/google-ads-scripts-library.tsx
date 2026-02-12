"use client";

import { useEffect, useState } from "react";

const SEARCH_TERMS_SCRIPT = `/**
 * Search Terms - Aktuálne vs. Predchádzajúce obdobie (v1)
 * Autor: Pavol Jakubko + AI Assistant
 * CIEĽ:
 * - Stiahnuť search termy (Search + Shopping + Pmax) za posledných 30 dní
 * - Porovnať ich s predchádzajúcim obdobím (rovnako dlhým)
 * - Zapísať do jedného listu v Google Sheets:
 *      - metriky za aktuálne obdobie
 *      - metriky za predchádzajúce obdobie
 *      - rozdiely (delta)
 * NÁVOD:
 * 1. Vytvor si tabuľku v Google Sheets a pomenuj ju
 * 2. Vlož URL Google Sheetu do SPREADSHEET_URL v časti USER CONFIG
 * 3. V prípade potreby uprav LOOKBACK_DAYS a minimálne filtre
 * 4. Spusti skript v Google Ads
 */
// ======================= USER CONFIG =======================
/** URL Google Sheetu, kam sa majú ukladať dáta */
var SPREADSHEET_URL = "TU_VLOŽ_URL_GOOGLE_SHEETU";
/** Počet dní pre jedno obdobie (posledných 30 dní) */
var LOOKBACK_DAYS = 30;
/** Minimálne filtre pre AKTUÁLNE obdobie (predošlé berieme bez filtrov, aby delty dávali zmysel) */
var MIN_IMPRESSIONS_CURRENT = 20;
var MIN_CLICKS_CURRENT = 0;
var MIN_CONVERSIONS_CURRENT = 0;
/** Názov listu, kam sa zapisuje report */
var SHEET_NAME = "STS_Search_Terms";
// ======================= MAIN =======================
function main() {
  if (!SPREADSHEET_URL || SPREADSHEET_URL.indexOf("https://docs.google.com/spreadsheets/") !== 0) {
    throw new Error("Prosím, nastav platnú SPREADSHEET_URL premennú na URL Google Sheetu.");
  }
  var accountName = AdsApp.currentAccount().getName();
  Logger.log("Spúšťam export search termov pre účet: " + accountName);
  var spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  var sheet = getOrCreateSheet_(spreadsheet, SHEET_NAME);
  deleteEmptySheets_(spreadsheet);
  // Dátové obdobia
  var currentPeriod = getDateRange_(LOOKBACK_DAYS, 0);
  var previousPeriod = getDateRange_(LOOKBACK_DAYS, LOOKBACK_DAYS);
  Logger.log("Aktuálne obdobie:   " + currentPeriod.from + " → " + currentPeriod.to);
  Logger.log("Predchádzajúce obd: " + previousPeriod.from + " → " + previousPeriod.to);
  // Načítanie dát – Search + Shopping + PMax
  var currentData = [];
  var previousData = [];
  // Aktuálne obdobie
  currentData = currentData.concat(fetchSearchTerms_(currentPeriod, true));
  currentData = currentData.concat(fetchPMaxSearchCategories_(currentPeriod, true));
  // Predchádzajúce obdobie
  previousData = previousData.concat(fetchSearchTerms_(previousPeriod, false));
  previousData = previousData.concat(fetchPMaxSearchCategories_(previousPeriod, false));
  Logger.log("Počet riadkov – aktuálne obdobie: " + currentData.length);
  Logger.log("Počet riadkov – predchádzajúce obdobie: " + previousData.length);
  // Mapovanie previous datasetu pre rýchly lookup
  var previousMap = {};
  previousData.forEach(function(row) {
    var key = makeKey_(row); // searchTerm + campaignName + adGroupName
    previousMap[key] = row;
  });
  // Príprava hlavičiek
  var headers = [
    "Search Term",
    "Campaign Name",
    "Ad Group Name",
    "Campaign Type",
    "Impr (current)",
    "Impr (previous)",
    "Δ Impr",
    "Clicks (current)",
    "Clicks (previous)",
    "Δ Clicks",
    "Conv (current)",
    "Conv (previous)",
    "Δ Conv",
    "Conv Value (current)",
    "Conv Value (previous)",
    "Δ Conv Value",
    "CTR (current)",
    "CTR (previous)",
    "Δ CTR (p.p.)",
    "CR (current)",
    "CR (previous)",
    "Δ CR (p.p.)"
  ];
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatHeaderRow_(sheet, headers.length);
  // Príprava výsledného datasetu – len search termy z aktuálneho obdobia
  var output = [];
  currentData.forEach(function(cur) {
    var key = makeKey_(cur);
    var prev = previousMap[key] || null;
    var searchTerm = cur.searchTerm;
    var campaignName = cur.campaignName;
    var adGroupName = cur.adGroupName;
    var campaignType = cur.campaignType;
    var imprNow = cur.impressions;
    var clicksNow = cur.clicks;
    var convNow = cur.conversions;
    var valueNow = cur.convValue;
    var imprPrev = prev ? prev.impressions : 0;
    var clicksPrev = prev ? prev.clicks : 0;
    var convPrev = prev ? prev.conversions : 0;
    var valuePrev = prev ? prev.convValue : 0;
    var ctrNow = imprNow > 0 ? clicksNow / imprNow : 0;
    var ctrPrev = imprPrev > 0 ? clicksPrev / imprPrev : 0;
    var crNow = clicksNow > 0 ? convNow / clicksNow : 0;
    var crPrev = clicksPrev > 0 ? convPrev / clicksPrev : 0;
    output.push([
      searchTerm,
      campaignName,
      adGroupName,
      campaignType,
      imprNow,
      imprPrev,
      imprNow - imprPrev,
      clicksNow,
      clicksPrev,
      clicksNow - clicksPrev,
      convNow,
      convPrev,
      convNow - convPrev,
      valueNow,
      valuePrev,
      valueNow - valuePrev,
      ctrNow,
      ctrPrev,
      (ctrNow - ctrPrev) * 100, // v percentuálnych bodoch
      crNow,
      crPrev,
      (crNow - crPrev) * 100 // v percentuálnych bodoch
    ]);
  });
  // Zoradenie podľa Impr (current) desc
  output.sort(function(a, b) {
    return b[4] - a[4]; // index 4 = Impr (current)
  });
  if (output.length > 0) {
    sheet.getRange(2, 1, output.length, headers.length).setValues(output);
  }
  Logger.log("Hotovo. Zapísaných riadkov: " + output.length);
}
// ======================= DATA FETCHING =======================
/**
 * Načíta search termy pre dané obdobie.
 * Vráti pole objektov:
 * {
 *   searchTerm, campaignName, adGroupName, campaignType,
 *   impressions, clicks, conversions, convValue
 * }
 */
function fetchSearchTerms_(dateRange, isCurrentPeriod) {
  var data = [];
  var whereClauses = [
    "campaign.status = 'ENABLED'",
    "segments.date BETWEEN '" + dateRange.from + "' AND '" + dateRange.to + "'",
    "campaign.advertising_channel_type IN ('SEARCH', 'SHOPPING')" // podľa potreby
  ];
  // 👉 Používame existujúce premenné MIN_IMPRESSIONS_CURRENT, MIN_CLICKS_CURRENT, MIN_CONVERSIONS_CURRENT
  if (MIN_IMPRESSIONS_CURRENT > 0) {
    whereClauses.push("metrics.impressions >= " + MIN_IMPRESSIONS_CURRENT);
  }
  if (MIN_CLICKS_CURRENT > 0) {
    whereClauses.push("metrics.clicks >= " + MIN_CLICKS_CURRENT);
  }
  if (MIN_CONVERSIONS_CURRENT > 0) {
    whereClauses.push("metrics.conversions >= " + MIN_CONVERSIONS_CURRENT);
  }
  var query =
    "SELECT " +
      "campaign.name, " +
      "campaign.id, " +
      "campaign.advertising_channel_type, " +
      "ad_group.name, " +
      "search_term_view.search_term, " +
      "metrics.impressions, " +
      "metrics.clicks, " +
      "metrics.conversions, " +
      "metrics.conversions_value " +
    "FROM search_term_view " +
    "WHERE " + whereClauses.join(" AND ");
  var it = AdsApp.search(query);
  while (it.hasNext()) {
    var row = it.next();
    var searchTerm = row.searchTermView.searchTerm;
    var campaignName = row.campaign.name;
    var adGroupName = row.adGroup.name;
    var campaignType = row.campaign.advertisingChannelType;
    var impressions = row.metrics.impressions;
    var clicks = row.metrics.clicks;
    var conversions = row.metrics.conversions;
    var convValue = row.metrics.conversionsValue;
    data.push({
      searchTerm: searchTerm,
      campaignName: campaignName,
      adGroupName: adGroupName,
      campaignType: campaignType,
      impressions: impressions,
      clicks: clicks,
      conversions: conversions,
      convValue: convValue
    });
  }
  return data;
}
/**
 * PMax search terms cez campaign_search_term_view
 * - reálne PMax search termy, nie kategórie
 * - filtrujeme len PERFORMANCE_MAX
 */
function fetchPMaxSearchCategories_(dateRange, isCurrentPeriod) {
  var data = [];
  var whereClauses = [
    "campaign.advertising_channel_type = 'PERFORMANCE_MAX'",
    "segments.date BETWEEN '" + dateRange.from + "' AND '" + dateRange.to + "'"
  ];
  // rovnaký prah na impresie ako pri ostatných search termoch
  if (typeof MIN_IMPRESSIONS_CURRENT !== 'undefined' && MIN_IMPRESSIONS_CURRENT > 0) {
    whereClauses.push("metrics.impressions >= " + MIN_IMPRESSIONS_CURRENT);
  }
  var query =
    "SELECT " +
      "campaign.id, " +
      "campaign.name, " +
      "campaign.advertising_channel_type, " +
      "campaign_search_term_view.search_term, " +
      "segments.search_term_match_source, " +
      "metrics.impressions, " +
      "metrics.clicks, " +
      "metrics.conversions, " +
      "metrics.conversions_value " +
    "FROM campaign_search_term_view " +
    "WHERE " + whereClauses.join(" AND ");
  Logger.log("PMax search terms query:\n" + query);
  try {
    var report = AdsApp.report(query);
    var rows = report.rows();
    var count = 0;
    while (rows.hasNext()) {
      var row = rows.next();
      var searchTerm = row["campaign_search_term_view.search_term"];
      var campaignName = row["campaign.name"];
      var campaignType = row["campaign.advertising_channel_type"];
      var impressions = Number(row["metrics.impressions"]) || 0;
      var clicks = Number(row["metrics.clicks"]) || 0;
      var conversions = Number(row["metrics.conversions"]) || 0;
      var convValue = Number(row["metrics.conversions_value"]) || 0;
      data.push({
        searchTerm: searchTerm,
        campaignName: campaignName,
        adGroupName: "(PMax search term)", // aby sa kľúč líšil od klasických ad groups
        campaignType: campaignType,
        impressions: impressions,
        clicks: clicks,
        conversions: conversions,
        convValue: convValue
      });
      count++;
    }
    Logger.log("Načítaných PMax search termov pre obdobie " + dateRange.from + " → " + dateRange.to + ": " + count);
  } catch (e) {
    Logger.log("Chyba pri fetchPMaxSearchCategories_: " + e);
  }
  return data;
}
// ======================= HELPERS =======================
/**
 * Kľúč na spárovanie riadkov medzi obdobiami:
 * searchTerm + campaignName + adGroupName
 */
function makeKey_(row) {
  return [row.searchTerm, row.campaignName, row.adGroupName].join("||").toLowerCase();
}
/**
 * Vytvorí alebo vráti existujúci list.
 */
function getOrCreateSheet_(spreadsheet, name) {
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }
  return sheet;
}
/**
 * Vygeneruje date range pre GAQL query.
 * days = dĺžka intervalu (napr. 30)
 * offsetDays = koľko dní dozadu posunúť koniec intervalu
 *   - offsetDays = 0        → posledných 30 dní vrátane dneška-?
 *   - offsetDays = 30       → 30 dní pred tým (predchádzajúce obdobie)
 */
function getDateRange_(days, offsetDays) {
  var tz = AdsApp.currentAccount().getTimeZone();
  var to = new Date();
  if (offsetDays && offsetDays > 0) {
    to.setDate(to.getDate() - offsetDays);
  }
  var from = new Date(to);
  from.setDate(from.getDate() - (days - 1));
  function f(date) {
    return Utilities.formatDate(date, tz, "yyyy-MM-dd");
  }
  return {
    from: f(from),
    to: f(to)
  };
}
/**
 * Naformatuje hlavičkový riadok (bold + svetlomodré pozadie).
 */
function formatHeaderRow_(sheet, numColumns) {
  sheet
    .getRange(1, 1, 1, numColumns)
    .setFontWeight("bold")
    .setBackground("#e6f3ff")
    .setHorizontalAlignment("center");
}
/**
 * Zmaže prázdne hárky v súbore (napr. defaultný "Hárok 1" / "Sheet1").
 * Prázdny = len 1 bunka a tá je prázdna.
 * Nikdy nemaže hlavný reportovací hárok (SHEET_NAME).
 */
function deleteEmptySheets_(spreadsheet) {
  var sheets = spreadsheet.getSheets();
  sheets.forEach(function(sh) {
    var name = sh.getName();
    if (name === SHEET_NAME) return; // náš hlavný hárok nechávame
    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    // Hárok je „prázdny“, ak má len 1x1 bunku a tá je bez hodnoty
    if (lastRow === 1 && lastCol === 1) {
      var value = sh.getRange(1, 1).getValue();
      if (!value) {
        spreadsheet.deleteSheet(sh);
        Logger.log("Zmazaný prázdny hárok: " + name);
      }
    }
    // alebo úplne čistý (bez bunkiek)
    if (lastRow === 0 && lastCol === 0) {
      spreadsheet.deleteSheet(sh);
      Logger.log("Zmazaný prázdny hárok: " + name);
    }
  });
}`;

export function GoogleAdsScriptsLibrary() {
  const [openItem, setOpenItem] = useState<"search" | "full" | null>(null);
  const [copiedItem, setCopiedItem] = useState<"search" | "full" | null>(null);
  const [fullDataScript, setFullDataScript] = useState("");
  const [fullDataError, setFullDataError] = useState("");

  useEffect(() => {
    if (openItem !== "full" || fullDataScript) return;
    fetch("/scripts/full_data_export.gs")
      .then(async (res) => {
        if (!res.ok) throw new Error("Nepodarilo sa nacitat script Full_Data_Export.");
        return res.text();
      })
      .then((text) => {
        setFullDataScript(text);
        setFullDataError("");
      })
      .catch((err: Error) => setFullDataError(err.message));
  }, [openItem, fullDataScript]);

  async function onCopy(item: "search" | "full") {
    const text = item === "search" ? SEARCH_TERMS_SCRIPT : fullDataScript;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 1500);
  }

  return (
    <div className="script-accordion">
      <div id="search-terms-script">
        <button
          type="button"
          className={openItem === "search" ? "script-accordion-header is-open" : "script-accordion-header"}
          onClick={() => setOpenItem((prev) => (prev === "search" ? null : "search"))}
        >
          <span>Google Ads Script: Search_Terms_Script</span>
          <span className={openItem === "search" ? "history-arrow is-open" : "history-arrow"}>▾</span>
        </button>

        {openItem === "search" ? (
          <div className="script-accordion-body">
            <div className="button-row">
              <button type="button" className="btn btn-secondary" onClick={() => onCopy("search")}>
                {copiedItem === "search" ? "Skopírované" : "Kopírovať script"}
              </button>
            </div>
            <pre className="script-code">{SEARCH_TERMS_SCRIPT}</pre>
          </div>
        ) : null}
      </div>

      <div id="full-data-export-script">
        <button
          type="button"
          className={openItem === "full" ? "script-accordion-header is-open" : "script-accordion-header"}
          onClick={() => setOpenItem((prev) => (prev === "full" ? null : "full"))}
        >
          <span>Google Ads Script: Full_Data_Export</span>
          <span className={openItem === "full" ? "history-arrow is-open" : "history-arrow"}>▾</span>
        </button>

        {openItem === "full" ? (
          <div className="script-accordion-body">
            <div className="button-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onCopy("full")}
                disabled={!fullDataScript}
              >
                {copiedItem === "full" ? "Skopírované" : "Kopírovať script"}
              </button>
            </div>
            {fullDataError ? <p className="error-box">{fullDataError}</p> : null}
            <pre className="script-code">{fullDataScript || "Nacitam script..."}</pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
