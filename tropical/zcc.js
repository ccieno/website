/* Tropical Sky demo — pushes browsing context into Zoom Contact Center.
 *
 * MUST be loaded BEFORE the ZCC web tag <script>, because the SDK reads
 * window.zoomCampaignSdkConfig when it initialises.
 *
 * Each page sets window.TROPICAL_PAGE = { name, destination } before this file
 * runs. We keep a rolling trail of visited pages in sessionStorage so the flow
 * can see not just where the customer is, but where they've been.
 *
 * The entryParams keys below must exist as Custom Variables in
 * Contact Center Management > Variables, otherwise the flow won't see them.
 */
(function () {
  'use strict';

  var TRAIL_KEY = 'tropicalTrail';
  var MAX_TRAIL = 20;

  var page = window.TROPICAL_PAGE || {};
  var pageName = page.name || document.title || 'Unknown';
  var destination = page.destination || '';
  var path = window.location.pathname;

  // ---- rolling browsing trail -------------------------------------------
  var trail = [];
  try {
    trail = JSON.parse(sessionStorage.getItem(TRAIL_KEY) || '[]');
    if (!Array.isArray(trail)) trail = [];
  } catch (e) {
    trail = [];
  }

  var last = trail[trail.length - 1];
  if (!last || last.path !== path) {
    trail.push({
      name: pageName,
      path: path,
      destination: destination,
      at: new Date().toISOString()
    });
  }
  if (trail.length > MAX_TRAIL) trail = trail.slice(-MAX_TRAIL);

  try {
    sessionStorage.setItem(TRAIL_KEY, JSON.stringify(trail));
  } catch (e) { /* private browsing — carry on with the in-memory trail */ }

  // ---- derived values ----------------------------------------------------
  var seen = [];
  var mostRecentDestination = '';
  trail.forEach(function (t) {
    if (!t.destination) return;
    if (seen.indexOf(t.destination) === -1) seen.push(t.destination);
    mostRecentDestination = t.destination;
  });

  var firstSeen = trail[0] ? trail[0].at : new Date().toISOString();
  var minutesOnSite = Math.max(
    0,
    Math.round((Date.now() - new Date(firstSeen).getTime()) / 60000)
  );

  var entryParams = {
    // where they are right now
    currentPage: pageName,
    currentPath: path,
    currentUrl: window.location.href,
    destination: destination,                       // '' on the home page
    // where they've been
    destinationsViewed: seen.join(', '),
    lastDestination: mostRecentDestination,   // last destination page they opened
    browsingTrail: trail.map(function (t) { return t.path; }).join(' > '),
    pagesViewed: String(trail.length),
    minutesOnSite: String(minutesOnSite),
    // demo housekeeping
    siteSection: 'tropical-demo'
  };

  // ---- hand it to the ZCC web SDK ---------------------------------------
  // Global config is the reliable way to supply params — script-tag data-*
  // attributes can be missed when the tag is injected dynamically.
  window.zoomCampaignSdkConfig = Object.assign(
    {},
    window.zoomCampaignSdkConfig || {},
    { entryParams: entryParams }
  );

  // Some SDK builds read this name instead; harmless to set both.
  window.zoomSdkConfig = Object.assign(
    {},
    window.zoomSdkConfig || {},
    { entryParams: entryParams }
  );

  // Exposed for debugging and for the on-page "context" panel.
  window.tropicalContext = { trail: trail, entryParams: entryParams };

  console.log('[Tropical] ZCC entryParams', entryParams);

  function renderPanel() {
    var el = document.getElementById('zccContext');
    if (!el) return;
    var rows = Object.keys(entryParams).map(function (k) {
      return '<li><span>' + k + '</span><span>' +
        String(entryParams[k] || '—').replace(/</g, '&lt;') + '</span></li>';
    });
    el.innerHTML = '<ul class="facts">' + rows.join('') + '</ul>';
  }

  document.addEventListener('DOMContentLoaded', renderPanel);

  /* Merge extra params in at runtime — used by the enquiry form so the flow can
   * see what the customer had filled in before they asked for help.
   *
   * Caveat: the SDK reads the config when the chat session starts, so anything
   * added here only lands if the customer opens chat AFTER the update. Values
   * set before the widget is opened (the normal case) come through fine.
   */
  window.tropicalUpdate = function (extra) {
    if (!extra) return entryParams;
    Object.keys(extra).forEach(function (k) {
      entryParams[k] = extra[k] === undefined || extra[k] === null ? '' : String(extra[k]);
    });
    window.zoomCampaignSdkConfig.entryParams = entryParams;
    window.zoomSdkConfig.entryParams = entryParams;
    renderPanel();
    console.log('[Tropical] entryParams updated', extra);
    return entryParams;
  };

  // Clear the trail — handy between demo runs. Call tropicalReset() in console
  // or click the reset link in the footer.
  window.tropicalReset = function () {
    try { sessionStorage.removeItem(TRAIL_KEY); } catch (e) {}
    window.location.reload();
  };
})();
