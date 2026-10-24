# BabelBird local connection form

## Purpose and structure

A small Chinese/English connection form for novice users, following the user-approved one-field design. One document scroll owner, one main panel (maximum 480px), one primary action. No navigation, marketing panels, illustrations or external fonts. Product research and decorative concept generation would widen this explicitly simple setup task; the approved copy and existing BabelBird identity are the reference.

## Tokens

System sans-serif with PingFang SC / Microsoft YaHei fallback. Body 16px/1.6, title 28px/1.3 weight 650, label/button 16px weight 600, helper 14px/1.6. Spacing 4/8/12/16/24/32/48px. Input/button minimum 48px height; panel radius 16px; controls radius 8px.

Light: page #f5f7fa, panel #ffffff, ink #172b4d, muted #526278, line #d7dee8, accent #125cc9, accent-hover #084cae, success #176b43, error #a4262c. Dark: page #111822, panel #1b2532, ink #f0f4fa, muted #b5c2d2, line #4b5b70, accent #8ab8ff, accent-hover #b4d0ff, success #8eddb2, error #ffb0b4; dark accent buttons use #111822 text. Panel shadow 0 16px 48px #172b4d0d. Focus-visible 3px accent ring with 3px offset.

## Components and states

Heading, short introduction, labeled password field, full-width submit button, inline live status, small acquisition link. A compact language button uses the helper type size, existing spacing tokens and a 48px hit target; it changes text without changing the entered key. Browser language chooses the initial Chinese or English text. Host identity is read from the local server; the user does not choose technical configuration. Invalid, checking, saving, connected, unavailable and expired states use text; color never carries the only signal. The button disables while submitting. A failed request re-enables it and retains the field for retry; success clears the field and replaces the form with the result. No key is echoed in the result.

## Responsive and accessibility

Layout uses min-height:100dvh, panel width:min(100%,480px), 24px page gutter and 32px panel padding (24px on narrow screens). No horizontal scroll at 320px. Native form validation, visible labels, autocomplete off, no autocorrection, enter-to-submit, aria-live status and visible keyboard focus. Supports OS light/dark preference. No animation required; no reliance on motion.

## QA and accepted limits

Observe empty/error/loading/success in a real browser and capture desktop/narrow surfaces in both languages. No third-party network requests from the page. The page configures the selected supported host on the same computer; remote-headless sessions receive an explicit local-host limitation rather than a misleading success claim. Browser opening varies by host, so the agent always includes a clickable fallback link. Completion distinguishes a saved, checked connection from tools loaded by the host; WorkBuddy may require its native MCP permission confirmation.
