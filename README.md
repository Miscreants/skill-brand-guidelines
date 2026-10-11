# Brand Guidelines skill

A Claude Code plugin that builds agency-style brand guideline decks (1920×1080 slides) in Figma. It reads a brand's Figma variables, text/color styles and logo components, lets you pick a layout shell and modules, then builds the slides bound to the brand's tokens and checks them for overflow.

## Install

In Claude Code:

```
/plugin marketplace add Miscreants/skill-brand-guidelines
/plugin install brand-guidelines@miscreants
```

You need read access to this private repo, so make sure `gh auth login` or your git credentials work for GitHub.

## Requirements

- The **Figma plugin** for Claude Code (`/plugin install figma@claude-plugins-official`), logged in with an account that can edit the brand's Figma file.
- View access to the four reference decks listed in `skills/brand-guidelines/references/source-decks.md`. The skill screenshots them for layout ideas.
- Brand fonts available to Figma. If a font can't be loaded, the skill asks whether to use Inter as a stand-in.

## Use

```
/brand-guidelines <figma-file-url> [brand name]
```

The skill:

1. Extracts tokens from the file.
2. Asks for a shell (Editorial, Card Grid, Running Header or Sidebar), a preset (Lite, Core, Full or Custom) and the navigation pages.
3. Builds the deck on a new page in the file.

It never edits existing pages.

Progress is saved to `brand-guidelines/<brand>/brand-config.json` in the folder you run Claude Code from. Run the command again on the same file to resume or add modules.

## Updating

1. Edit the files under `skills/brand-guidelines/`.
2. Bump `version` in `.claude-plugin/plugin.json`.
3. Push.

Teammates then run `/plugin marketplace update miscreants`.
