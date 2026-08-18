# demo — Prospect Demo Pages

Branded demo pages for individual prospects. Each HTML file embeds the Zoom Contact Centre Web SDK pre-configured with a specific customer's branding.

**Deployed at:** `demo.eno.solutions` (publicly accessible, no SSO)

Previously served from `eno.solutions` — moved to `demo.eno.solutions`. The apex domain `eno.solutions` intentionally serves nothing; the CNAME file has been removed to prevent GitHub Pages from activating it. Ensure the `eno.solutions` DNS A/AAAA record is removed in Cloudflare so the apex resolves to nothing.

## What it does

Each page loads custom CSS with the prospect's brand colours and background image, fetches the ZCC SDK API key at runtime from a Cloudflare Worker (`zoom-sdk-config`), and renders the Zoom Contact Centre chat/voice widget in the prospect's brand context.

## Landing page

`index.html` — searchable hub page at `demo.eno.solutions/`. Type a company name to filter and navigate to any demo page.

## Demo pages

| File | Prospect |
|------|----------|
| `OPP-005231702.html` | Lawcris |
| `OPP-005479673.html` | NHS |
| `OPP-005508584.html` | Biocare |
| `OPP-005518825.html` | Calor |
| `OPP-005529040.html` | NHS |
| `OPP-005555945.html` | myDentist |
| `OPP-005561323.html` | Flint Bishop |
| `OPP-005571806.html` | NHS |
| `OPP-005574438.html` | NHS KCHFT |
| `OPP-005574438B.html` | NHS KCHFT (B) |
| `OPP-005577377.html` | On The Beach |
| `OPP-005577543.html` | WBAH |
| `OPP-005583108.html` | Brymec |
| `OPP-005584906.html` | Hudgells |
| `OPP-005586634.html` | Selective Marketplace |
| `OPP-005597471.html` | TFP |
| `OPP-005607616.html` | Freightlink |
| `OPP-005607656.html` | TH White |
| `OPP-005609360.html` | Training at Work |
| `OPP-005635215.html` | Oak Tyres |
| `bakery.html` | Bakery demo |
| `bettys.html` | Bettys and Taylors |
| `boswell.html` | Alan Boswell |
| `cameron.html` | Tara Group |
| `csg.html` | CSG |
| `expat.html` | Expat |
| `gamcare.html` | GamCare |
| `f1.html` | F1 Arcade |
| `levi.html` | Levi's |
| `hayman.html` | Zoom & PJ Hayman |
| `hotel.html` | Hotel demo |
| `rolec.html` | Rolec |
| `spa.html` | Spa Breaks |
| `itsm.html` | NHS ITSM |
| `majesty.html` | Majesty Apartments |
| `nanopore.html` | Oxford Nanopore Technologies |
| `nrla.html` | NRLA |
| `payhawk.html` | Payhawk |
| `spencer.html` | Spencer |
| `tropical.html` | Tropical Sky |
| `vulcan.html` | Vulcan Two |

## Adding a new page

1. Duplicate an existing html file
2. Rename it to match the new opportunity
3. Update branding (background image, colours, title)
4. Set the correct `data-env` attribute (`us01` or `eu01`)
5. Add any prospect logo to the `img/` folder
6. Commit — a pre-commit hook (`update-pages.js`) automatically regenerates the `pages` array in `index.html` from every HTML file's `<title>` tag. Only pages whose title starts with "Zoom" or "ZM" are picked up, so **the `<title>` tag must be set correctly before committing** or the page won't appear in search.
7. Push, then run `npx wrangler deploy` — **pushing to GitHub does not deploy the site.** Cloudflare only serves what's been deployed via Wrangler, so a page won't go live (even if it's pushed and correct locally) until deploy is run.

> **Note:** The API key is fetched at runtime from `zoom-sdk-config` — do not hardcode it in the HTML.

## Tropical Sky — browsable demo site (`/tropical/`)

Unlike the single-page prospect demos, `tropical/` is a small multi-page site you can actually
click around, so a demo can show a customer browsing before they start a chat. Served at
`demo.eno.solutions/tropical/`.

| URL | File | Destination variable |
|-----|------|----------------------|
| `/tropical/` | `tropical/index.html` | *(empty — home page)* |
| `/tropical/maldives` | `tropical/maldives.html` | `Maldives` |
| `/tropical/mexico` | `tropical/mexico.html` | `Mexico` |
| `/tropical/bali` | `tropical/bali.html` | `Bali` |
| `/tropical/enquire` | `tropical/enquire.html` | *(from the form, see below)* |

Extensionless URLs work because Wrangler's asset handling defaults to `auto-trailing-slash`
(`/tropical/maldives` → `tropical/maldives.html`). Don't set `html_handling` to `none` in
`wrangler.jsonc` or these links break.

### Pushing browsing context into ZCC

`tropical/zcc.js` builds the variable object and **must load before the ZCC web tag**, so the data
is already on the page by the time ZCC scrapes it. Each page declares itself first:

```html
<script>window.TROPICAL_PAGE = { name: "Maldives", destination: "Maldives" };</script>
<script src="/tropical/zcc.js"></script>
<script data-apikey="..." data-env="us01" data-enable-zcb="true" data-enable-z-c-b="true"
        src="https://us01ccistatic.zoom.us/us01cci/web-sdk/zcc-sdk.js"></script>
<script src="/tropical/script.js"></script>
```

A rolling trail of visited pages is kept in `sessionStorage` (`tropicalTrail`, last 20 pages), so
the flow sees where the customer has been, not just where they are. Parameters sent:

| Variable | Example |
|----------|---------|
| `currentPage` | `Maldives` |
| `currentPath` | `/tropical/maldives` |
| `currentUrl` | `https://demo.eno.solutions/tropical/maldives` |
| `currentPageDestination` | `Maldives` (empty on the home and enquiry pages) |
| `destinationsViewed` | `Maldives, Mexico, Bali` |
| `lastDestination` | `Bali` |
| `browsingTrail` | `/tropical/ > /tropical/maldives > /tropical/mexico` |
| `pagesViewed` | `3` |
| `minutesOnSite` | `4` |
| `siteSection` | `tropical-demo` |

Everything is sent as a **string** — `zcc.js` coerces with `String()`. Create them all as type
`String` in ZCC, including the numeric-looking ones.

> Named `currentPageDestination`, not `destination`, to avoid colliding with an existing account
> variable of that name.

### How the values actually reach the flow

**The web tag does not accept arbitrary parameters.** An earlier version of this code passed an
`entryParams` object on `window.zoomCampaignSdkConfig`; it silently did nothing. Inspecting the
loaded SDK in the browser confirms its config object has no `entryParams` concept — the 41 keys on
`ZoomWebSDKDef__GlobalChatConfigs` are all things like `apikey`, `chatEntryId` and `windowPosition`.

ZCC pulls the data instead. Each custom variable is configured admin-side with
**Value → From website data**, then a **Source**, an **Item Key** and an **Object Path**.

`zcc.js` therefore publishes the whole variable object into all four places a Source can point at,
under the name **`tropical`**:

| Source in admin | Where `zcc.js` writes it |
|---|---|
| Global JavaScript variable | `window.tropical` |
| Local storage | `localStorage["tropical"]` (JSON string) |
| Session storage | `sessionStorage["tropical"]` (JSON string) |
| Cookie | cookie `tropical`, URL-encoded JSON, `path=/` |

Whichever Source you choose, the other two fields are the same every time:

```
Item Key    = tropical
Object Path = destinationsViewed      ← the variable name
```

All four verified working on `demo.eno.solutions`. The cookie payload is ~500 bytes, comfortably
inside the ~4KB limit — `browsingTrail` is the only field that grows and it's capped at 20 entries.

Variables live in the **`tropical`** group, so the flow path is `global_custom.tropical.<name>`.
Change `VAR_GROUP` at the top of `zcc.js` if you rename the group — it drives the object name, all
four storage keys, and nothing else.

Debugging: `window.tropicalContext.vars` in the console holds everything currently published, and
each page logs `[Tropical] website data published as "tropical"` on load.

> **The variables must exist in Contact Center Management → Preferences → Variables before the flow
> can read them.** Names are case-sensitive.

**Gotcha — newly created variables take a minute or two to go live.** If you create the variables
and immediately start a chat, some will come through and some won't, which looks alarmingly like a
config problem. It isn't. Wait a couple of minutes and start a *fresh* engagement before debugging
anything. Observed first-hand: `destinationsViewed` (created earlier) worked while a batch created
seconds before did not; both worked shortly after with no changes made.

If a variable still doesn't appear after that:

1. Check *Display in Zoom Contact Center client* is enabled with a Display Location (up to two of
   Inbound Notification / Profile Tab / Engagement Tab). On the Variables list you can tick several
   variables and click **Show in the client** to bulk apply.
2. Check the Object Path matches exactly — `pagesviewed` won't match `pagesViewed`.
3. To separate a data problem from a display problem, temporarily set the variable to Value =
   *Default Value* with a literal like `TEST123`. If the literal shows, display is fine and the
   Item Key / Object Path is wrong. If it doesn't, it's display config.

Debugging: every page logs `[Tropical] website data published` to the console, exposes
`window.tropicalContext`, and has a collapsed "Demo: what we're passing to Zoom" panel in the
footer. `tropicalReset()` clears the trail between demo runs.

### Enquiry form (`/tropical/enquire`)

A realistic tailor-made-holiday enquiry form, built for demoing CoBrowse form-filling. There's no
backend — submitting just reveals a thank-you panel. Behaviour lives in `tropical/enquire.js`:

- **Destination is pre-filled** from `lastDestination` in the browsing trail, with a visible "we
  pre-filled this because you were looking at Bali" hint. Good moment in a demo.
- **An enquiry reference** (`TS-######`) is generated per session and shown on the page, so the agent
  can "look it up". Stored in `sessionStorage` as `tropicalRef`.
- **Form state is pushed into ZCC on every change**, so the flow can see how far the customer got
  before they asked for help — including a `formStatus` of `in progress` or `submitted`.

Additional variables from this page:

| Variable | Example |
|----------|---------|
| `enquiryRef` | `TS-316225` |
| `formDestination` | `Bali` |
| `formTravelMonth` | `2027-02` |
| `formNights` | `10` |
| `formAirport` | `Manchester` |
| `formParty` | `2 adults, 0 children` |
| `formBudget` | `£2,500 – £4,000` |
| `formOccasion` | `Honeymoon` |
| `formExtras` | `Overwater villa, Adults only` |
| `formName` / `formEmail` / `formPhone` | `Steve Eno` / `steve@example.com` / … |
| `formFieldsCompleted` | `13` |
| `formStatus` | `in progress` \| `submitted` |

These are published exactly like the rest — same `tropical` object, same four sources, so Item Key
`tropical` / Object Path `formBudget`. They arrive via `window.tropicalUpdate()` in `zcc.js`, which
merges them in and re-publishes on every form change. **Caveat:** the SDK reads the config when the chat session starts, so values only reach the
flow if the customer opens chat *after* filling the field — which is the normal order of events, but
worth knowing if a demo goes off-script.

> Gotcha for anyone editing `enquire.js`: read fields with `document.getElementById(...)`, not
> `form.<name>`. Named form access collides with real DOM properties — `form.children` returns the
> child element list, not the input named `children`.

The bottom fieldset has fake card fields (`#cardNumber` carries `data-zcb-mask="true"`) purely so you
can demo CoBrowse field masking. Masking itself is configured in Contact Center Management — that
attribute is just a convenient selector to point it at. Nothing is submitted or stored anywhere.

### CoBrowse

All five pages carry `data-enable-zcb="true"` / `data-enable-z-c-b="true"` plus `tropical/script.js`,
which enables the **Share my screen** button (`#startCobrowseButton`) in the nav once the SDK fires
`ZoomZccCobrowseSDK:Ready`. The markup is deliberately plain HTML/CSS — no iframes, no canvas, no
client-side routing — so the DOM renders cleanly on the agent side.

> The API key is hardcoded in these pages (the campaign tag from Contact Center Management →
> Campaigns → Embed Web Tag) rather than fetched from `zoom-sdk-config`, because the runtime-fetch
> pattern used by the prospect pages doesn't carry the cobrowse attributes. Swap it if the campaign
> changes.

Pages under `tropical/` are **not** picked up by `update-pages.js` (it only scans the top-level
directory), so they won't appear in the `index.html` search hub. That's intentional — the standalone
`tropical.html` prospect page still does.

## DNS

In Cloudflare DNS:

- **`demo.eno.solutions`** — CNAME pointing to the Workers route, Proxy enabled. This is the only public entry point.
- **`eno.solutions` (apex)** — no A/AAAA/CNAME record. The apex domain should resolve to nothing; remove any record pointing it to a host. The CNAME file has been deleted from this repo so GitHub Pages cannot activate it.

## Structure

```
demo/
├── prospect.html        # One file per prospect
├── img/                 # Prospect logos and background images
├── tropical/            # Browsable Tropical Sky demo site (demo.eno.solutions/tropical/)
│   ├── index.html       #   home
│   ├── maldives.html    #   /tropical/maldives
│   ├── mexico.html      #   /tropical/mexico
│   ├── bali.html        #   /tropical/bali
│   ├── enquire.html     #   /tropical/enquire — form for cobrowse demos
│   ├── enquire.js       #   form prefill, reference number, param push
│   ├── site.css         #   shared styles
│   ├── zcc.js           #   publishes website data + browsing trail (load BEFORE the web tag)
│   └── script.js        #   cobrowse start button hook
├── mancave-snooker/     # Mancave Snooker app privacy policy (served at privacy.eno.solutions/)
├── wrangler.jsonc       # Worker config — routes demo.eno.solutions/*
└── scripts/             # Legacy SSO scripts (no longer needed)
```
