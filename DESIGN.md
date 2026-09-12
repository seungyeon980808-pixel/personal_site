# 박승연의 작업실

## Contract
Approved classroom entrance → photographic desktop → interactive windows. Apple-inspired Web, not an OS emulator. Actual program SVGs; no copied Apple wallpaper or system assets. Existing content remains reachable, with dated thoughts and development logs inside Calendar only.

## Tokens
System Korean sans. Type 12/14/16/20/28/36px, line-height 1.6; spacing 4/8/12/16/24/32/48. Ink #182433, muted #526478, blue #0869df, soft #edf3f8, border #dce3eb, paper #fffdf2, surface #ffffffed. Desktop labels white with dark outline. Window radius 20, widget 24, button 10. Shadow 0 24px 80px #10223d40. Frosted material uses translucent tint, bright inner edge, shadow, and limited blur on Dock/header only.

## Structure and personas
Visitors find programs, dated records, training files, recommendations, contact. Owner edits a private browser draft then explicitly publishes authenticated changes. New visitors get visible labels and search, keyboard users get native controls and Escape, mobile visitors get full-screen windows and stacked folders.

## Primitives and states
Desktop icon: rest/hover/focus, labeled; Dock: real logos and active underline. Window: open, closed, minimized, maximized, dragged, history back; sticky titlebar. Finder: category → folder → item preview, selection, empty, search. Forms: required, invalid, saving, error, saved. Calendar: today, selected, multiple records per day. Toast: polite live region. Empty states give a useful destination or editor action.

## Motion
beui.dev center-morph-modal source consulted 2026-09-12: focus restoration, center-origin reveal, reduced-motion branch. Adapted with native dialog, Web Animations/CSS, no React dependency. Tokens fast 160ms, window 240ms, entrance 650ms; ease cubic-bezier(.2,.8,.2,1). Entrance scales approved artwork toward its Mac screen before showing DOM desktop. Reduced motion removes transform transitions. Drag follows pointer directly, clamped to visible bounds; double-click title maximizes. No continuous background animation; physics animation runs only in its open window and cancels on close.

## Data and ownership
Current personal-site/main content is read through existing public Firestore REST; bundled public snapshot prevents blank first paint/offline loss. New editable workspace content uses personal-site/desktop-v1, existing admin-only server rules. Google auth SDK loads only when logging in; verified owner email required in client and server existing owner rule governs writes. Optimistic updateTime prevents overwrite conflicts. Local drafts explicitly labeled, export/import validated; public save only from administrator action. Existing main/detail editing retained at classic.html.

## Responsive and accessibility
375/768/1280px coverage. Below 700: full-screen dialog, readable single-column detail, horizontal category strip, horizontal Dock with scroll. Desktop uses left widgets, right icons. Native semantic labels, aria-live errors, clear focus, Escape, safe links, no HTML rendering from stored content. Touch targets >=40px except visible window dots with 36px hit area. Localized Korean text wrapping.

## Assets and quality boundaries
Classroom original PNG converted to responsive WebP (960/1920). Lake Richard Low Hong / Pexels https://www.pexels.com/photo/turquoise-lake-water-surrounded-by-mountains-7191677/ (Pexels license). Prototype retained under prototypes/desktop. No new videos or fabricated records. Training starts with the existing shared Google Drive; owner supplies particular workshop files. Actual Google popup/public write must be exercised by signed-in owner; automated tests isolate writes with mocks and verify local draft flows.

## Review repairs
Korean prose keeps words intact with word-break:keep-all and overflow fallback. Mobile entrance uses full-width contained classroom photo, with a separate readable CTA below; preserves the entire chalkboard instead of cropping text. K-마이파인 was explicitly hidden in original classic.html; preserve that setting. Seven public apps use their seven actual SVG logos. Hidden project remains accessible in legacy owner editing, not new public navigation/search.

## 2026-09-12 interaction revision
Keep approved classroom. Replace all visible entry CTA styling with a real focusable Mac-screen hit target, aligned in a 1536x1024 scene coordinate system (screen x448..1092/y422..776). A DOM lake desktop preview covers the baked-in screen/button. Hover gives slight glass reflection; keyboard focus provides an inset screen outline. The entire scene zooms from screen center. Text hint is separate and non-interactive.
Return-to-desk is a labeled menu control on all widths and available in window chrome. Shortcut creation uses a dashed outline/plus with '새 바로가기' and '추가하기', not an app-style tile.
Programs offer a launch chooser: local detail and web app execution open an in-desktop browser frame, with address, reload, separate-window fallback, and existing close/minimize/back controls. Only this site's relative detail URLs and known official web-app hosts are embedded; arbitrary shared links use a sized external window. Mobile frame retains an inset border rather than occupying the complete screen. Browser security policies may require opening some apps separately; fallback stays visible.
