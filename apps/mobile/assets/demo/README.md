# Demo media drop folders

Drop real photos (and videos for stories) in here. The demo app will use them
instead of emoji faces and placeholder story tiles.

After you add or replace files, run this from the repo root so the app picks
them up:

```bash
node apps/mobile/scripts/sync-demo-media.mjs
```

Then refresh the app (Expo may need a restart if Metro cached the old list).

## Profile pictures

Put one photo per person in `profile-pics/`. Use these exact filenames
(jpg, jpeg, png, or webp are all fine):

| File name | Who |
|---|---|
| `brant.jpg` | You (Brant Johnson) |
| `jade.jpg` | Jade Watkins (was Maya) |
| `kelton.jpg` | Kelton Burns (was Devon) |
| `janna.jpg` | Janna Allred (was Inès) |
| `levi.jpg` | Levi Williams (was Kit) |
| `ben.jpg` | Ben Chamberlin (was Theo) |
| `ceci.jpg` | Ceci Sumsion (was Nour) |
| `jordyn.jpg` | Jordyn Bristol |

Example: `profile-pics/brant.jpg`

## Stories

Put photos or videos in each person's story folder. Files are used in
alphabetical order (so `01.jpg`, `02.mp4` is a good naming habit).

| Folder | Who |
|---|---|
| `stories/brant/` | Your updates |
| `stories/jade/` | Jade Watkins |
| `stories/kelton/` | Kelton Burns |
| `stories/levi/` | Levi Williams |
| `stories/janna/` | Janna Allred |

Supported story file types: `.jpg` `.jpeg` `.png` `.webp` `.mp4` `.mov`

Optional captions: add a text file with the same base name, e.g. `01.jpg` +
`01.txt` (one short line of caption text).

## Recommended sizes (I'll crop for you if you drop screenshots)

### Profile pics — square (1:1)
Shown as a circle. Export at **1024 × 1024** (or any square). Face centered.
Keep the subject in the middle so the circular crop doesn't clip ears/chin.

### Story photos — tall portrait (~9:15.5)
Full phone width, from the top of the screen down to the top of Catch-Up
(Catch-Up peeks ~172pt; the photo never sits under it).

Best export size: **1080 × 1860** (about **9:15.5**).

Keep important stuff (faces, text) in the center-upper area — the top has the
progress bars + name, the bottom edge sits right above Catch-Up.
