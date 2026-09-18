## macOS-style menu strip — 2026-09-13
User screenshot guides a 30px translucent desktop menu strip, bold app label, working File/View/Help dropdowns and right-side search, device exit, local date/time. No fake battery/network indicators. Native details support keyboard opening, outside-click and Escape close; mobile keeps the compact 44px controls. These dimensions are project choices, not Apple requirements.

## Quiet menu bar — 2026-09-13
Remove redundant exit action inside content windows; traffic-light close returns to the desktop. The desktop menu bar has a short 작업실 label and two accessible icon buttons (search and device exit), 36px height, 32×28px controls; mobile retains 44px bar and 40px controls. Keep accessible labels, native tooltips and keyboard focus rings.

## Desktop Dock refinement — 2026-09-13
Retain the 44px Dock icon size and 6px item gaps. Calendar uses a red 14px month header and a large 26px current date on white paper; settings uses a silver gear. Desktop-only GitHub, Threads and Brunch links follow a 1px divider, sourced from existing channel data, with visible labels and the existing separate-window behavior. Mobile keeps its three-item Dock.

## Mobile phone entrance — 2026-09-12
At viewport≤700, use the approved upright phone photograph as a single continuous hardware layer, projected from48deg on the floor to0deg standing. Preserve desktop notebook above700. Phone width min(78vw,310px,38dvh), aspect399/787; subtle metal rim and contact shadow; phone front edge is transform origin. Hero copy uses exact “게으른 교사의 작업용 휴대폰”; subtitle margin12 and phone gap16. Phone z-layer above copy, copy persists through first35% of rise before fading so moving phone occludes it. Same actualdesktop DOM inside display then zoomhand-off; no second screenshotUI. Tap/Enter, Escape, reverse exit, reducedmotion and responsive mode switch retain existing behavior. Mobile preview also at /prototypes/mobile-phone.html through375px iframe, main adapts automatically.

## Compact interior windows — 2026-09-12
Preserve approved laptop entrance and desktop. Finder adapts to content: minimum360px content height, maximum512px/viewport; note minimum240px. Window default 920×560 max; width viewport−64, height viewport−88; existing maximize/browser behavior remains. Titlebar48; page/content inset24. Finder columns152/200/flexible; row36px minimum, file44px; spacing4/8/12/16/24. Resource header horizontal44px icon + path12px + title22px. Body14px line1.75, record reading15px; no blanket font shrinking, no content truncation. Narrow screens keep existing stacked navigation, controls44px, inset16 and full-height windows. Sidebar neutral pale blue, active selected blue unchanged. Acceptance: resource descriptions and actions stay close to header; long titles wrap; all records/files accessible with scrolling; no horizontal overflow at375/768/1280; window controls and browser/maximize work.

## Browser chrome and density polish — 2026-09-13
Browser windows use the 48px titlebar for traffic controls, back, title, reload, and external-open. Detail pages suppress their own home/breadcrumb only when embedded; standalone detail pages retain navigation. External launches show a clipped origin only while it fits, and all browser launches retain external-open. A failure message appears only on an actual iframe error event. The Dock glass becomes more transparent by changing its backdrop layers only, preserving icon and label opacity. The entrance slogan keeps its exact copy and font while tightening word spacing and giving its second line a subtle weight lift. Workflow Finder snippets clamp to two lines while the preview remains the full reading surface. Owner editor inputs use compact, legible field spacing.

Latest hinge correction: rear cover axis is fixed at frame y79.4%. Source rear y73.05% maps there with constant6.35% translation; hover changes only projected depth .5024→.4424 around that axis. Rear endpoints stay stationary; front rises. Refined photographic assets retain a common open chassis. This supersedes the2px whole-cover lift below.

# 박승연의 작업실

## Contract
Live-screen continuity: portal the actual #desktop DOM into the laptop's screen-content while outside (inert); never create duplicate IDs, screenshot content, or a second widget layout. Size its viewport to the real browser viewport and scale it into the physical display. At zoom completion move the SAME main element back to its body position. The final scale maps both screen axes exactly to the viewport so wallpaper and widget positions align at handoff. Registered photographic chassis stays unchanged. Desktop pointer hover or keyboard focus lifts only the opaque silver cover by 2px over 320ms; the display stays concealed; click continues from its currently rendered transform, not the closed endpoint. Reduced motion disables peek. Feather closed cover's front join into common chassis to soften its cut seam.
Registered-image motion revision: master open photograph and derived closed photograph share the same 1536×1024 camera registration. The visible chassis is ALWAYS the same base region from the open master (clip below y≈813); it never crossfades into another chassis. Closed cover is the derived silver surface mapped into that base's shallow deck plane. The open master's screen region rotates about its own bottom hinge from −94deg to 0, with 6000px perspective; no CSS-generated replacement notebook and no whole-photo crossfade. Lid opens over 1100ms, holds 320ms, camera flight 800ms. A shared camera translation centers the open product after the copy+closed product centered start. Copy fades in 240ms. Master photographs contain no external slogan or personal name; HTML provides exact slogan. This overrides the previous endpoint-switch implementation below.
Latest user override: use the exact approved closed/open raster references as the two stable endpoints. Extract their laptop regions into project assets, excluding surrounding text and personal name before serving. Only the brief intermediate hinge is DOM/CSS; its fidelity may be lower while scaling. Center the copy + 48/36px gap + complete closed photograph as one measured group. Fade between approved photo and moving hardware, hold the approved open photograph, then zoom into its display and hand off to the interactive HTML desktop. Raster screen content is intentionally a preview in this entrance only, explicitly requested by the user; the interactive desktop remains HTML. This supersedes the all-DOM endpoint and fixed-camera contracts below.
Centered hero correction: measure the complete copy + 48px gap (36px mobile) + projected closed hardware as one group and center its bounding box vertically and horizontally. Resting camera translation is derived from this group, not a viewport percentage. During opening, camera framing interpolates to the established open composition; the hinge geometry itself remains unchanged. Reverse exit returns to the measured centered rest position. New generated satin-aluminum lid material supplies micrograin and softbox reflections; physical seams/rims remain DOM/CSS. This supersedes the fixed-camera requirement and copy-only bottom anchoring below because those caused the user-rejected bottom-heavy hero.
Entrance spacing refinement: anchor copy above the stationary hinge instead of near viewport top. Subtitle-to-closed-lid gap approximately 64px desktop, 44px mobile, 32px short landscape. Keep the existing hinge geometry and animation unchanged.
Latest hinge refinement: fixed low frontal camera, 80deg deck tilt and 100deg lid travel produce a front-facing opened display. The hinge and chassis never translate between endpoints. Width min(82vw,1000px,112dvh), hinge at 80vh (mobile 68vh), perspective 8000px. Photographic generated keyboard-deck material is a hardware texture only; screen content stays DOM. Opening 960ms, fully open hold 400ms, flight 760ms. Copy fades 320ms. No hover lift. Neutral satin aluminum lid, slim dark seam, machined front edge and contact shadow. These values supersede earlier 62deg/110deg geometry and timing below. Match the supplied open-reference camera, retaining anonymous copy rather than its personal name.

White, symmetric closed-notebook entrance → photographic desktop → interactive windows. Apple-inspired Web, not an OS emulator. Actual program SVGs; existing content stays reachable, with dated thoughts and development logs inside Calendar only. The 2026-09-12 white-notebook revision below supersedes the classroom entrance rules.

## White notebook entrance (approved direction)
One anonymous headline: “교사가 한가해야, / 교육이 성장한다.” Small subtitle: “게으른 교사의 작업용 노트북”. Apple SD Gothic Neo first, system sans fallback; no bundled Apple font. White #fafafa, heading #1d1d1f, subtitle #737378. Heading 32–64px, weight 700, tracking -.065em, line-height 1.2. Subtitle 13–17px. Centered text above a silver notebook; no visible CTA or click instruction. Hardware is live layered CSS, with silver stops #f1f2f4/#d4d6da/#a7a9af/#73767d, black bezel #101215, keycaps #24262b, white rim, contact shadow. Width min(76vw,760px,108dvh); 1.52 device aspect ratio, 62deg resting perspective. This is a responsive interpretation of the approved closed-laptop concept, not a pixel clone of the generated raster.

Signature motion: one click fades the headline (220ms), opens the hinge from 0 to 110deg (680ms), then measures the visible screen and accelerates toward it (660ms) until the real desktop fills the view. A subtle glass reflection and cyan rim communicate screen power, with no infinite effects, particles, or video. Exit reverses spatial continuity then closes the lid. Native focusable notebook button; repeat clicks cannot queue; Escape cancels entry; reduced motion bypasses 3D travel; resized/tab-hidden animation settles safely. Mechanism is novel hinge geometry + measured screen zoom, informed by beui.dev center-morph-modal focus/center/reduced-motion handling (source revisited 2026-09-12). Timings are Web design choices, not Apple requirements.

Desktop density: left compact 248px Calendar with date dots and 3–5 visible lines of the existing note (full note on click); right two-column folders for training/shared resources/recommendations/about plus owner-configured shortcuts. Shared resources reuse existing training-area storage under the shared category; no data migration. Dock uses actual app icons, an all-programs launcher, and Calendar; project workflows and playground remain in the all-programs window. Center is intentionally empty. Desktop and browser titles use anonymous workspace copy. Mobile uses readable stacked widgets and folders with a scrolling Dock. Creation control is only in editing mode and retains its distinctive dashed appearance.

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

Mobile hardware depth: the phone face, 22px metallic bottom with charging port and speaker perforations, and rounded side surfaces share one 3D rotation. Keep the resting camera angle independent of physical thickness.

Mobile approved-image contract: rest state displays the untouched phone-original.png lying-phone crop (72,415,628,593); never substitute a projected front photo for this endpoint. Upright photo remains visible through the open hold, then crossfades to the actual workspace during zoom. Slogan remains live text.

Mobile transition alignment: animate the approved lying photo through a projective transform anchored to its four display corners; align with the upright display before the final 20% dissolve. Use 180ms upright hold. The source image remains unchanged at rest.

Phone depth: split the original image at its front glass edge (79.26% of crop height); keep both photographic layers identical at rest, reduce the lower metal face to24% of its projected height during lift. Programs live in one three-column mobile icon folder; Dock contains program folder, calendar and Settings. Settings retains existing administrator authentication/publication controls.

Mobile continuity supersedes earlier photo-swap behavior: keep the same original phone photograph opaque throughout all phases; do not swap hardware at the upright endpoint. Only the live display content overlays during camera flight. Feather the outer photo canvas to avoid moving rectangular background edges.

### Mobile screen continuity and paging (2026-09-13)
- The same live desktop is projected into the original phone photo at rest, during lifting/lowering, and during zoom. No delayed photo-to-UI crossfade.
- Mobile home has two native horizontal scroll-snap pages: calendar/memo, then folders/shortcuts. Dock stays fixed; page dots also support explicit navigation.
- Preserve the selected page when the desktop moves between the photo screen and the full viewport. Desktop layout is unchanged.
- Verified with touch-event regression, entry/exit continuity tests and local browser interaction. Physical iPhone performance remains a device check.

### Phone glass boundary correction (2026-09-13)
- Calibrated the live screen to the photo's complete inner glass boundary; both projective transforms share the same four corners and fractional CSS width.
- Applied explicit rounded clipping so transformed content cannot escape the curved upper rim.
- Fresh closed/opening/open/zoom/returning/returned captures passed independent edge review; original cyan edge strips are no longer visible.

### Upright phone hardware (2026-09-13)
- Standing hold uses the approved board's front-facing hardware ring, with its example screen cut away by an SVG mask. The live desktop stays in the existing projected viewport.
- Only hardware crossfades after the resting-photo projection reaches its upright target; the reverse completes before lowering. This replaces the stretched port-bearing base at the standing endpoint.
- Fresh six-state visual review passed for frame continuity and absence of duplicate edges. Existing intermediate screen softness remains a separate limitation.

### Continuous mobile angle transition (2026-09-13)
- Photo plane and upright hardware now use matched projective keyframes throughout lifting; hardware changes while in motion rather than after a frozen upright pose.
- Base disappears earlier to avoid a ghost charging-port strip. Lowering reverses the same geometry.
- Five sampled motion times verify glass/shell corner separation below one CSS pixel; eight related tests pass. Six fresh state captures passed independent geometry review; physical-device frame pacing is not measured.

### Experimental solid phone (separate preview)
- Keep checkpoint bcf488e and the default photo entrance. Opt-in ?entrance=solid uses a single rigid CSS 3D object: front glass, back, and rounded perimeter side faces, fixed thickness and no hardware image crossfade.
- Same actual desktop DOM in the glass before and after entry; preserve pages, folder/settings, Escape and reduced motion. White hero and approved Korean copy retained.
- Experiment tests mechanical rotation first; procedural metal is explicitly a prototype, not a claim to match the photo's material fidelity.

### Solid reference thickness correction
- Match the approved photo's substantial visible metal front, rather than a slim commercial-device ratio: fixed body depth is 12% of model width. Keep the 60° resting angle unchanged.
- Port and grille occupy the metal face. A rendered test bounds visible side height to 8–13% of projected front width and verifies unchanged depth throughout rotation and return.

### Return to photo endpoints; overlap the motion
- User clarified that intermediate physical fidelity is not required: preserve checkpoint photo endpoints and remove the stop between lift and zoom.
- Original photo entrance now uses one 1800ms camera timeline. Centering and enlargement overlap; the body finishes lifting at 1100ms while the camera keeps moving. Return runs the camera in reverse, with lowering beginning before zoom-out ends.
- Solid experiment remains separate and is not used by this path. Related tests: 9 pass, including ongoing camera movement at five samples spanning the lift/zoom join.

### Mobile checkpoint and next focus
- User accepts the current photo transition as a checkpoint. Unequal horizontal/vertical zoom scaling can visibly stretch the phone screen; aspect-preserving enlargement is deferred, not resolved.
- Continue next with desktop refinement. Keep the current photographic mobile entrance as the default; the solid version is only a comparison prototype.
# Desktop refinement additions

- Desktop windows close only from the native backdrop or window controls; title-bar dragging and content interaction remain inside the window.
- Dock labels share one icon/label baseline, keep a single truncated line, and expose the full label through `title`.
- Project, resource, archive, and workflow browsing follow the same category → folder → item → preview rhythm.
- Memos are public read-only cards. Owner actions begin or continue a local draft, then may edit text, checklist state, color, and normalized board position before publishing.
- Archive entries reuse the resource card vocabulary, while their link is optional so a future idea can exist without a destination.
- Community surfaces use a compact 560px panel, existing contact fields only, and red owner-only deletion controls.

## Device material and hover — 2026-09-14
Checkpoint 369ac87 preserves the previous entrance and switch prototype. Keep the same photographic chassis, camera registration, screen geometry and entry/exit animations. New satin lid image adds fine aluminum grain and softbox reflections; align its source 34px down in the 1024px frame with CSS before applying the existing cover projection. Rear hinge remains y79.4%; hover projected depth .5024 → .32 over320ms, with no rear translation. Chassis contrast1.06 and saturation.75 retain neutral metal. Phone idle display uses dark glass only within the live projected screen, wakes on pointer/focus/tap and remains lit while moving. Corner hover must never filter the full iframe/background.

Phone silhouette correction: remove the source photograph's opaque rectangular matte with a reusable SVG outline mask. Preserve photographic hardware pixels and existing projection. Cover the complete baked-in example display beneath the live screen so no blue rim survives screen-off. This underlay follows the same hardware fade during entry/return. Corner device panels and embedded entrance surfaces are transparent; the actual desktop, widgets and device highlights remain opaque. Keep a soft contact shadow without a rectangular backdrop.

## Precise device boundaries — 2026-09-14
Keep both devices’ existing photographs, dimensions and motion. Clip the phone live display with the photographed glass outline rather than independent percentage corner radii; remove the baked-in display from the photograph with a luminance cutout and place an overlapping black backing behind the photographic silhouette to avoid antialiasing seams. Preserve the four-corner motion registration. Notebook photo masks exclude opaque white canvas, with separate transparent contact/ambient shadows (RGB29,29,31 at .24/.10) aligned to photographed feet around source y915. Phone contact shadow stays unchanged.

## Restore photographic Mac and proportional zoom — 2026-09-14
Supersedes satin/flattened lid experiment: use original notebook-refined-closed.webp at scaleY(1), masked lid y747–851, base y849–916; hover rotates visually about rear y747 with .8 vertical projection and dark interior behind lid. Closed silhouette matches original photo without upper rear protrusions. Camera cover zoom uses one scale=max(viewport/screen), centered; excess device edges crop outside viewport. Live desktop uses uniform scaling with centered alignment; phone logical screen aspect matches upright glass before projective foreshortening. Unlock prototype phone shows numeric passcode on hover and auto entry on click. Subtitles: 게으른 교사의 노트북 / 게으른 교사의 휴대폰.

## Device continuity correction — 2026-09-14
- Keep the photographic phone bezel and its glass mask on the same projected parent throughout motion; do not crossfade a different upright chassis over it.
- Uniform cover scaling crops excess content rather than leaving differently registered background gutters.
- Hide the inactive device from opening through inside; restore only on closed. Move only the Mac shortcut inward when phone is primary; keep desktop-primary phone coordinates.
- Unlock demo uses 980808; prepare the phone lock surface before hover can expose it.
- Laptop material refinements must retain its source silhouette; use a shallow textured interior rather than a solid black slab. Phone ground shadow must not deform with the chassis.

## Approved Dock and brightness — 2026-09-14
Apply B wallpaper brightness1.62 saturation1.16 to the desktop background only. Desktop Dock surface alpha .10 with7px blur;46px icons, folder body .78 of width and tab .16, social SVG72%. Names appear in a floating tooltip on hover or keyboard focus, never permanently. Custom Dock programs belong to workspace.dockPrograms and use existing owner-authenticated draft/backup/publish validation. Only the Dock exposes their editor. Inactive corner devices wake on hover or keyboard focus, following the later owner approval; phone position stays unchanged, Mac is large and partially clipped to the right.

Commit messages must always be written in Korean, as requested by the owner.

## Playful desktop integration — 2026-09-14
Approved spring about uses k40 mass2, rounded coil, drag threshold5px; training folder moves at250/180px per second, reflecting within menu/Dock bounds and accepting throws capped1400px/s. Existing routes remain authoritative. Stop physics during windows, welcome, entrance and hammer mode; reduced motion starts paused. Hammer icon58px white, grip pivot85%93%, 3s charge, cancellable explosion notice and native exitDesktop return. Separate prototype files remain available. Notch shows6 actual logos at15% original dimensions, irregular reflected travel, black only during welcome and above its blur. Phone base approaches zero projected thickness upright, original resting photo unchanged.

## Fixed Tahoe wallpaper — 2026-09-15
Use coastal candidate 05, Tiffany Cade's Lake Tahoe photograph, as the fixed background. Shared `--wallpaper-image` points to `/assets/studio/tahoe-blue.webp`; `--wallpaper-filter: none` preserves the approved preview's original color. Desktop wallpaper, physical display fill, mobile display fill and both unlock overlays consume the same image token. Retain existing lock-screen readability overlays, geometry, hardware, motion and foreground UI. Serve one local optimized WebP; no random selection or extra candidate loading. Source: https://unsplash.com/photos/MBO7Pcludec (Unsplash License).

## Stabilization — 2026-09-15
Preserve approved device photographs, proportions, colors and movement. Keep the hammer's Dock space visible during previews and dialogs; disable interaction instead of removing it. Mobile menu actions use a second row at top40px, left12px to avoid the centered notch while preserving left placement. During owner draft editing, static about/training icons replace the physics layer so it cannot obstruct input controls. Restoring a minimized form preserves its existing DOM and unsaved values.

## Mobile rendering stability — 2026-09-16
Preserve all approved photographs, masks, proportions, motion duration and physics constants. Show embedded devices only once unlock styling is ready; touch pointer entry does not impersonate mouse hover. Render the spring using the same 201 coordinates, 1.5px stroke and white contact highlight on a device-pixel-ratio canvas, avoiding per-frame SVG layout. Cache notch dimensions through ResizeObserver; retain its free motion and interactions.

### iPhone workspace preview — 2026-09-16 (prototype only)
Scope: `prototypes/iphone-workspace.{html,css,js}`; existing approved ocean wallpaper and seven real program SVGs. Apple-inspired Web prototype, no production wiring. Visitor first sees compact two-column calendar/record widget then four-column labeled home icons; a translucent program folder contains miniature real logos. Dock holds the hammer, Calendar, resources and Settings. Opening Programs reveals a three-column folder; resources use a full-height view, Settings a short sheet with a working close button. No simulated system status or decorative resize handles. Native dialog supplies focus containment, Escape and focus restoration; every action uses an existing destination or a clearly labeled preview state. No persistent settings or auth simulation.
Tokens: existing system Korean sans; ink #182433, blue #0869df, white, muted #526478; ocean labels white with dark shadow; sheet #f2f4f7; translucent white 20/36/88 percent. Space 4/8/12/16/24/32; sizes 12/14/16/20/28/36, calendar date 48; icon 60, radius 16/24/32; desktop preview 390×min(844px, viewport minus 64px), mobile full viewport with safe-area insets. Touch controls at least 44px, focus outline blue, icon labels wrap. Motion 160ms opacity/scale, reduced motion none; static wallpaper, limited backdrop blur. Reusable primitives: labeled icon, logo folder, glass Dock, navigation row, native dialog surface. Test home, folder, program detail, resources, calendar, settings, Escape/focus, narrow and short viewports. No invented appointments; widget uses current date and actual bundled record.
Evidence: current Apple iOS overview and Sheets guidance retrieved by parent 2026-09-16: https://developer.apple.com/design/human-interface-guidelines/designing-for-ios ; https://developer.apple.com/design/human-interface-guidelines/sheets ; folder behavior reference https://support.apple.com/en-la/108307 . Values above are project heuristics, not Apple requirements. Accepted scope: visual/interaction preview, not operating-system simulation; physical-device and VoiceOver testing remain outside browser QA.
Prototype continuity refinement: four Dock controls with approved hammer at left, then Calendar, resources, Settings; two home rows retain training, archive, guestbook and contact. Hammer/archive/guestbook are explicitly explained preview states and link to the actual existing workspace without simulating saves or destructive actions. Hammer uses the existing assets/about/hammer.webp photograph inside a white tile. Dialog top-layer geometry is measured from the preview frame so desktop remains phone-sized; mobile remains viewport-sized.

### iPhone preview notch — 2026-09-17
Prototype only: centered black112×30 capsule at top8px (safe-area aware), same six14.256×11.016 logos and reflected free motion as approved notch. Reserve54px top space for home header; no device frame on mobile. Pause motion when document hidden or modal open; reduced motion static. Buttons retain keyboard labels and startled-dismiss feedback. Desktop preview frame remains presentation only.

### Sculpted mobile shortcut icons — 2026-09-17
Preview only. Preserve60px geometry, labels, behavior, logos, notch and wallpaper. Replace generic white outlines with layered filled vector illustrations: blue paper folder, amber compass, indigo profile card, teal bound notes, graphite archive, coral notebook, emerald message, machined silver settings. Shared warm-white tile #f8fafc/#e5eaf0, fine inner rim and restrained object shadow; each illustration uses48/64 optical bounds. Inline SVG remains crisp without bitmap loads or animation. Real program logos and hammer remain unchanged.

### Five icon directions — 2026-09-17
Separate review gallery only; no production integration. Five query-scoped alternatives on identical mobile content: ios (filled familiar symbols on color tiles), glass (translucent clear tiles), mono (ivory/charcoal cutouts), object (freestanding dimensional objects), color (bold two-tone geometric illustrations). Keep60px hit geometry and labels; real program marks/hammer/calendar/notch unchanged. Gallery provides all five independent live previews plus full-size links, numbered names and material descriptions; no persistent selection. Preview-only CSS/JS are loaded only for a valid iconStyle query. Compare actual icons on the approved ocean wallpaper rather than isolated mood boards. Keyboard-visible links and headings, lazy iframe loading, responsive1/2/3column gallery.

### Selected iOS preview — 2026-09-17
User selected ios as default mobile preview icon direction; comparison query variants remain available. Load variant stylesheet and module with normal page resources to avoid asynchronous restyling. Hammer photograph fills its existing60px tile with no padding and1.06 uniform scale; retain tile geometry and all other layout.

### Production mobile integration — 2026-09-18
Apply selected iOS symbol geometry and60px mobile Dock sizing to the existing live application. Keep pages.js horizontal paging, playful.js greeting spring/training throwing, device unlock, auth, private folders, search, calendar and all resource routes intact; no replacement static preview app. Program folder miniature icons consume actual public program assets. Desktop rendering unchanged. Hammer fills its60px white tile on mobile.

### 모바일 화면 높이 보정
모바일 작업실은 100dvh 안에서 상단 여백, 홈 페이지, 페이지 선택점, Dock 여백을 배분한다. 홈 페이지가 남은 높이를 사용하며 내용은 각 페이지 내부에서 스크롤한다. 기기 비율, 모션, Dock 아이콘 크기와 좌우 넘기기를 보존한다.
