/* Tropical Sky demo — pushes browsing context into Zoom Contact Center.
 *
 * MUST be loaded BEFORE the ZCC web tag <script>, because the SDK reads
 * window.zoomCampaignSdkConfig when it initialises.
 *
 * Each page sets window.TROPICAL_PAGE = { name, destination } before this file
 * runs. We keep a rolling trail of visited pages in sessionStorage so the flow
 * can see not just where the customer is, but where they've been.
 *
 * The keys below must exist as Custom Variables in Contact Center Management >
 * Preferences > Variables, each with Value = "From website data". They live in
 * the "tropical" group, so the flow path is global_custom.tropical.<name>.
 *
 * See publish() below for how the data is exposed and what to enter for
 * Source / Item Key / Object Path.
 */
(function () {
  'use strict';

  var TRAIL_KEY = 'tropicalTrail';
  var MAX_TRAIL = 20;

  // ZCC custom-variable group. Flow path is global_custom.<VAR_GROUP>.<name>.
  var VAR_GROUP = 'tropical';

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
    currentPageDestination: destination,      // '' on the home and enquiry pages
    // where they've been
    destinationsViewed: seen.join(', '),
    lastDestination: mostRecentDestination,   // last destination page they opened
    browsingTrail: trail.map(function (t) { return t.path; }).join(' > '),
    pagesViewed: String(trail.length),
    minutesOnSite: String(minutesOnSite),
    // demo housekeeping
    siteSection: 'tropical-demo'
  };

  // ---- expose it where ZCC can scrape it --------------------------------
  /* ZCC does NOT accept arbitrary parameters from the web tag. Custom variables
   * are configured admin-side with Value = "From website data", then a Source,
   * an Item Key and an Object Path — ZCC reads the page itself.
   *
   * (Verified in the browser: the loaded SDK's config object has no entryParams
   * concept at all, which is why passing them did nothing.)
   *
   * So we publish the same object into all four places a Source can point at.
   * Whichever one you pick in admin, use:
   *     Item Key    = tropical
   *     Object Path = destinationsViewed   (the variable name)
   */
  function publish() {
    var json;
    try { json = JSON.stringify(entryParams); } catch (e) { json = '{}'; }

    // 1. Global JavaScript variable  →  window.tropical.destinationsViewed
    window[VAR_GROUP] = entryParams;

    // 2. Local storage               →  key "tropical"
    try { localStorage.setItem(VAR_GROUP, json); } catch (e) {}

    // 3. Session storage             →  key "tropical"
    try { sessionStorage.setItem(VAR_GROUP, json); } catch (e) {}

    // 4. Cookie                      →  name "tropical"
    // Cookies cap around 4KB; the trail is the only field that grows, and it's
    // capped at 20 entries, so we stay well inside that.
    try {
      document.cookie = VAR_GROUP + '=' + encodeURIComponent(json) +
        ';path=/;max-age=86400;SameSite=Lax';
    } catch (e) {}

    window.tropicalContext = { trail: trail, vars: entryParams, group: VAR_GROUP };
  }

  publish();

  console.log('[Tropical] website data published as "' + VAR_GROUP + '"', entryParams);

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

  /* Merge extra values in at runtime — used by the enquiry form so the flow can
   * see what the customer had filled in before they asked for help.
   *
   * Caveat: ZCC scrapes the page when the engagement starts, so anything added
   * here only lands if the customer opens chat AFTER the update. Filling a
   * field then asking for help — the normal order — works fine.
   */
  window.tropicalUpdate = function (extra) {
    if (!extra) return entryParams;
    Object.keys(extra).forEach(function (k) {
      entryParams[k] = extra[k] === undefined || extra[k] === null ? '' : String(extra[k]);
    });
    publish();
    renderPanel();
    return entryParams;
  };

  // Clear the trail — handy between demo runs. Call tropicalReset() in console
  // or click the reset link in the footer.
  window.tropicalReset = function () {
    try {
      sessionStorage.removeItem(TRAIL_KEY);
      sessionStorage.removeItem('tropicalRef');
      sessionStorage.removeItem(VAR_GROUP);
      localStorage.removeItem(VAR_GROUP);
      document.cookie = VAR_GROUP + '=;path=/;max-age=0';
    } catch (e) {}
    window.location.reload();
  };
})();
