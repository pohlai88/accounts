/* eslint-env node */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const INCLUDE_DIRS = ["apps", "packages"];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORE = ["node_modules", "dist", "build", ".next", "coverage"];

const args = new Set(process.argv.slice(2));
const WRITE = args.has("--write");
const FIX_ARIA = args.has("--fix-aria");

// —— SSOT scales (derived from your preset) ————————————————
// spacing: unit = 0.25rem = 4px  → class suffix is px/4
const ALLOWED_SPACING = new Set([0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20]);
// radii (px): 0, 2, 6, 8, 12, 16, 9999
const RADIUS_MAP_PX = new Map([
  [0, "none"],
  [2, "sm"], // 0.125rem
  [6, "md"], // 0.375rem
  [8, "lg"], // 0.5rem
  [12, "xl"], // 0.75rem
  [16, "2xl"], // 1rem
  [9999, "full"], // legacy "full"
]);
// text sizes (px) → tailwind names matching your token set
const TEXT_SIZE_MAP_PX = new Map([
  [12, "xs"],
  [14, "sm"],
  [16, "base"],
  [18, "lg"],
  [20, "xl"],
  [24, "2xl"],
  [30, "3xl"],
  [36, "4xl"],
]);
// border/ring widths (px) → tailwind names
const WIDTH_MAP_PX = new Set([0, 1, 2, 4, 8]); // we'll emit border-1 only if present; otherwise skip

const SPACING_PROPS = new Set([
  "p",
  "px",
  "py",
  "pt",
  "pr",
  "pb",
  "pl",
  "m",
  "mx",
  "my",
  "mt",
  "mr",
  "mb",
  "ml",
  "h",
  "w",
  "min-h",
  "min-w",
  "max-h",
  "max-w",
  "gap",
  "space-x",
  "space-y",
]);

const RB_SIDE = "(?:-(?:t|r|b|l|tl|tr|bl|br))?"; // rounded side variants

// ——— helpers ————————————————————————————————————————————————
function parseLengthToPx(raw) {
  const v = raw.trim().toLowerCase();
  if (v === "0") return 0;
  const mRem = v.match(/^(-?\d*\.?\d+)rem$/);
  if (mRem) return Math.round(parseFloat(mRem[1]) * 16);
  const mPx = v.match(/^(-?\d*\.?\d+)px$/);
  if (mPx) return Math.round(parseFloat(mPx[1]));
  // unsupported: %, vw, vh, calc(), ch… → return NaN (not fixable)
  return NaN;
}
function pxToSpacingScale(px) {
  const scale = px / 4; // 1 step = 4px
  if (!Number.isInteger(scale)) return null;
  return ALLOWED_SPACING.has(scale) ? scale : null;
}
function replaceAllMapped(text, regex, mapper) {
  return text.replace(regex, (m, prefix, prop, val) => {
    const out = mapper({ prefix, prop, val });
    return out || m;
  });
}

// ——— fixers ————————————————————————————————————————————————
function fixSpacingBrackets(text) {
  // e.g., sm:focus:h-[2rem] → sm:focus:h-8
  const re =
    /(^|\s)((?:[a-z-]+:)*)(h|w|min-h|min-w|max-h|max-w|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y)-\[(.*?)\]/g;
  return replaceAllMapped(text, re, ({ prefix, prop, val }) => {
    const px = parseLengthToPx(val);
    if (Number.isNaN(px)) return null;
    const scale = pxToSpacingScale(px);
    if (scale === null) return null;
    return `${prefix}${prop}-${scale}`;
  });
}

function fixViewportUnits(text) {
  // Handle viewport units that can't be converted to spacing scale
  // max-h-[90vh] → max-h-screen (approximate)
  const re = /(max-h|max-w|min-h|min-w)-\[(90vh|100vh|90vw|100vw)\]/g;
  return text.replace(re, (m, prop, val) => {
    if (val === "90vh" && prop === "max-h") return "max-h-screen";
    if (val === "100vh" && prop === "max-h") return "max-h-screen";
    if (val === "100vw" && prop === "max-w") return "max-w-screen";
    if (val === "90vw" && prop === "max-w") return "max-w-screen";
    return m; // Don't change if we don't have a mapping
  });
}

function fixRadiusBrackets(text) {
  // rounded-[8px], rounded-tl-[2px]
  const re = new RegExp(`(^|\\s)((?:[a-z-]+:)*)rounded${RB_SIDE}-\\[(.*?)\\]`, "g");
  return text.replace(re, (m, _space, prefixAnd, val) => {
    const px = parseLengthToPx(val);
    if (Number.isNaN(px)) return m;
    // normalize huge radii
    const norm = px >= 9999 ? 9999 : px;
    const token = RADIUS_MAP_PX.get(norm);
    if (!token) return m;
    // capture the side part from the original match
    const sideMatch = m.match(/rounded(-(?:t|r|b|l|tl|tr|bl|br))?-\[/);
    const side = sideMatch?.[1] || "";
    return `${prefixAnd}rounded${side}-${token}`;
  });
}

function fixBorderWidths(text) {
  // border-[2px], border-t-[4px], ring-[2px], outline-[2px]
  const families = [
    "border",
    "border-t",
    "border-r",
    "border-b",
    "border-l",
    "border-x",
    "border-y",
    "ring",
    "outline",
  ];
  const re = new RegExp(`(^|\\s)((?:[a-z-]+:)*)(${families.join("|")})-\\[(.*?)\\]`, "g");
  return replaceAllMapped(text, re, ({ prefix, prop, val }) => {
    const px = parseLengthToPx(val);
    if (Number.isNaN(px)) return null;
    if (!WIDTH_MAP_PX.has(px)) return null;
    return `${prefix}${prop}-${px}`;
  });
}

function fixTextSizes(text) {
  // text-[1.25rem] → text-xl (only exact map)
  const re = /(^|\s)((?:[a-z-]+:)*)text-\[(.*?)\]/g;
  return replaceAllMapped(text, re, ({ prefix, prop, val }) => {
    const px = parseLengthToPx(val);
    if (Number.isNaN(px)) return null;
    const token = TEXT_SIZE_MAP_PX.get(px);
    if (!token) return null;
    return `${prefix}text-${token}`;
  });
}

function collectUnfixables(text) {
  const problems = [];

  // 1) Arbitrary values that are NOT CSS variables (exclude var(--...))
  const ARBITRARY_RE = /(?:^|\s)((?:[a-z-]+:)*)([a-z-]+)-\[(?!var\(--)[^)]+\]/g;
  if (ARBITRARY_RE.test(text)) problems.push("bracket-class");

  // 2) Color literals like text-[#123456], bg-[#fff]
  const COLOR_LIT_RE =
    /(?:^|\s)((?:[a-z-]+:)*)((?:text|bg|border|ring|outline))-\[#([0-9a-f]{3}|[0-9a-f]{6})\]/gi;
  if (COLOR_LIT_RE.test(text)) problems.push("color-literal");

  // 3) Icon-only button a11y: naive heuristic (button with aria-hidden svg and no aria-label)
  const ICON_BUTTON_RE =
    /<button\b(?![^>]*aria-label=)[^>]*>\s*<[^>]+aria-hidden=["']?true["']?[^>]*>\s*<\/[^>]+>\s*<\/button>/g;
  if (ICON_BUTTON_RE.test(text)) problems.push("icon-button-aria");

  return problems;
}

// ——— ARIA auto-fixer (safe heuristics) ——————————————————————
function getAttr(attrs, name) {
  const re = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{["']([^"']+)["']\\})`, "i");
  const m = attrs.match(re);
  return m ? m[1] || m[2] || m[3] : null;
}

function inferKeywordFromText(s) {
  if (!s) return null;
  const lower = s.toLowerCase();
  const pairs = [
    [/close|xmark|times|x(?=[^a-z])/, "Close"],
    [/search/, "Search"],
    [/menu|hamburger/, "Menu"],
    [/edit|pencil/, "Edit"],
    [/delete|trash|remove/, "Delete"],
    [/settings|cog|gear/, "Settings"],
    [/filter/, "Filter"],
    [/download/, "Download"],
    [/upload/, "Upload"],
    [/print/, "Print"],
    [/(^|[^a-z])back|arrow-left|chevron-left/, "Back"],
    [/next|arrow-right|chevron-right/, "Next"],
    [/previous|prev/, "Previous"],
    [/info|information/, "Info"],
    [/help|question/, "Help"],
    [/calendar/, "Open calendar"],
    [/share/, "Share"],
    [/link/, "Link"],
    [/copy/, "Copy"],
    [/plus|add/, "Add"],
    [/minus/, "Remove"],
    [/expand/, "Expand"],
    [/collapse/, "Collapse"],
    [/play/, "Play"],
    [/pause/, "Pause"],
    [/stop/, "Stop"],
    [/refresh|reload/, "Refresh"],
  ];
  for (const [re, label] of pairs) if (re.test(lower)) return label;
  return null;
}

function fixIconButtonsAria(text) {
  let added = 0;
  // match <button ...>...</button> blocks
  const BUTTON_RE = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  return {
    text: text.replace(BUTTON_RE, (full, attrs, inner) => {
      // skip if already labeled
      if (/aria-label=|aria-labelledby=/.test(attrs)) return full;
      // skip if there is visible text besides SVG (rough heuristic)
      const innerNoTags = inner.replace(/<[^>]+>/g, "").trim();
      if (innerNoTags.length > 0) return full;
      // must contain an aria-hidden icon to qualify as "icon button"
      if (!/<svg[^>]*aria-hidden=["']?true["']?[^>]*>/i.test(inner)) return full;
      // skip if an sr-only label is already present
      if (/\bsr-only\b/i.test(inner)) return full;

      // derive label from safe sources
      const fromTitle = getAttr(attrs, "title");
      const fromDataLabel = getAttr(attrs, "data-label");
      // look inside inner for icon hints
      const iconDataAttr = (inner.match(/data-icon=["']([^"']+)["']/i) || [])[1];
      const iconClassAttr = (inner.match(
        /class(?:Name)?=["'][^"']*(close|search|menu|edit|delete|trash|remove|settings|cog|gear|filter|download|upload|print|back|previous|next|chevron-left|arrow-left|chevron-right|arrow-right|info|help|question|calendar|share|link|copy|plus|add|minus|expand|collapse|play|pause|stop|refresh)[^"']*["']/i,
      ) || [])[1];
      // or infer from component tag names like <CloseIcon .../>
      const compName = (inner.match(/<([A-Z][A-Za-z0-9]*)\b/) || [])[1];

      const inferred =
        fromTitle ||
        fromDataLabel ||
        inferKeywordFromText(iconDataAttr) ||
        inferKeywordFromText(iconClassAttr) ||
        inferKeywordFromText(compName);

      if (!inferred) return full; // not confident → report only

      // inject aria-label just before '>'
      const patched = `<button${attrs} aria-label="${inferred}">${inner}</button>`;
      added++;
      return patched;
    }),
    added,
  };
}

// ——— file walker ————————————————————————————————————————————
function shouldSkip(filePath) {
  const p = filePath.replaceAll("\\", "/");
  if (IGNORE.some(seg => p.includes(seg))) return true;
  const ext = path.extname(p);
  return !EXTS.has(ext);
}
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE.some(seg => full.includes(seg))) walk(full, out);
    } else {
      if (!shouldSkip(full)) out.push(full);
    }
  }
  return out;
}

// ——— main ————————————————————————————————————————————————
function processFile(file) {
  const original = fs.readFileSync(file, "utf8");
  let next = original;

  next = fixSpacingBrackets(next);
  next = fixViewportUnits(next);
  next = fixRadiusBrackets(next);
  next = fixBorderWidths(next);
  next = fixTextSizes(next);
  let ariaAdded = 0;
  if (FIX_ARIA) {
    const res = fixIconButtonsAria(next);
    next = res.text;
    ariaAdded = res.added || 0;
  }

  const unfixables = collectUnfixables(next);
  const changed = next !== original;

  if (changed && WRITE) fs.writeFileSync(file, next, "utf8");
  return { changed, unfixables, ariaAdded };
}

function run() {
  const targets = INCLUDE_DIRS.map(d => path.join(ROOT, d))
    .filter(p => fs.existsSync(p))
    .flatMap(d => walk(d));

  let filesChanged = 0;
  let edits = 0;
  let ariaAutoLabeled = 0;
  const outstanding = { "bracket-class": 0, "color-literal": 0, "icon-button-aria": 0 };

  for (const file of targets) {
    const { changed, unfixables, ariaAdded } = processFile(file);
    if (changed) {
      filesChanged++;
      edits++;
      console.log(`${WRITE ? "✏️  Fixed" : "🔎 Would fix"}: ${path.relative(ROOT, file)}`);
    }
    if (ariaAdded) {
      ariaAutoLabeled += ariaAdded;
      console.log(`   ↳ ✅ added ${ariaAdded} aria-label${ariaAdded > 1 ? "s" : ""}`);
    }
    if (unfixables.length > 0) {
      console.log(`⚠️  Unfixable items in ${path.relative(ROOT, file)}: ${unfixables.join(", ")}`);
    }
    for (const tag of unfixables) outstanding[tag] = (outstanding[tag] || 0) + 1;
  }

  console.log("\n— Safe Fix Summary —");
  console.log(`Files ${WRITE ? "edited" : "to edit"}: ${filesChanged}`);
  console.log(`Edits ${WRITE ? "applied" : "planned"}: ${edits}`);
  if (FIX_ARIA) console.log(`ARIA labels auto-added: ${ariaAutoLabeled}`);
  console.log("Still needs attention:");
  for (const [k, v] of Object.entries(outstanding)) {
    console.log(`  • ${k}: ${v}`);
  }

  // Non-zero exit if anything remains to fix (so CI can block)
  const remaining = Object.values(outstanding).some(n => n > 0);
  if (remaining) process.exit(2);
}

run();
