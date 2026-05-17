# Monster Siren Karaoke — Feature Reference

## Browsing & Search

**Song catalog**
All songs from the Monster Siren Records catalog are loaded on startup directly from MSR's servers. The full list is held in memory, so all filtering and search is instant with no additional network calls.

**Text search**
The search box matches against song title, artist name, and album name simultaneously. Partial matches work (e.g. "don't" finds "Don't Miss It").

**Language filter**
Songs can be filtered by detected language: Chinese, English, Russian, Japanese. Detection is based on the character set of each song's lyrics file. Songs without lyrics are labelled "No Lyrics"; purely instrumental tracks are labelled "Instrumental".

**Year filter**
Songs can be filtered by approximate release year, derived from album release ordering. Select a year from the dropdown to show only that year's releases.

**Clear filters**
A "Clear filters" button appears whenever any filter is active, resetting all search and filter fields at once.

---

## Player

**Audio streaming**
Audio is streamed in full WAV quality directly from MSR's CDN. Nothing is downloaded or stored. Playback starts automatically when a song is opened.

**Synchronized lyrics**
Lyrics scroll automatically to keep the current line centred on screen. The active line is highlighted in the accent colour and enlarged. Lines already sung are dimmed darker than upcoming lines, so you can always tell where you are at a glance. The lyrics panel has its own independent scrollbar, keeping the navigation bar and playback controls always visible.

**Jump to any lyric line**
Clicking any lyric line immediately seeks the audio to the timestamp of that line. Useful for repeating a section to practice it.

**Seek controls**
The seek bar shows the current position and total duration. You can drag it to jump anywhere in the song.

**Skip forward / back 5 seconds**
The ⏮ 5s and 5s ⏭ buttons skip backward or forward by exactly 5 seconds. Useful for fine-tuning your position mid-song.

**Volume**
The volume slider on the right side of the controls adjusts playback volume.

**Instrumental track toggle**
For songs that have an official instrumental version on MSR (listed as a separate "(Instrumental)" entry), a toggle button switches between the vocal and instrumental track. The playback position is preserved when switching, so you can seamlessly go from singing with the vocal reference to singing over the instrumental.

**Fullscreen mode**
The ⛶ button (or pressing **F**) expands the player to fill the entire screen — useful in a karaoke setting where you want maximum lyric visibility.

**Blurred album art background**
The album cover is used as a blurred, darkened background behind the lyrics, giving each song a distinct visual feel without distracting from the text.

---

## Keyboard Shortcuts (Player)

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `←` | Skip back 5 seconds |
| `→` | Skip forward 5 seconds |
| `F` | Toggle fullscreen |

Shortcuts are disabled when the cursor is inside a text input.

---

## Technical Notes

**No audio or lyrics are hosted by this app.** Every byte of audio and lyrics is served in real time from Hypergryph's own CDN (`hycdn.cn`). The app is purely a client that reads publicly available MSR resources and presents them in a karaoke interface.

**CRLF handling:** MSR's LRC lyric files use Windows-style line endings (`\r\n`). The parser normalises these before processing so no lines are dropped.

**Unicode handling:** MSR lyrics use typographic punctuation (curly apostrophes `'`, fullwidth question marks `？`, etc.). These are preserved as-is in the display. Future search normalisation will treat fullwidth and halfwidth equivalents as the same character.

**LRC format:** Timestamps follow `[MM:SS.xx]` (centiseconds) or `[MM:SS.xxx]` (milliseconds) formats. Both are supported. Clicking a lyric line seeks to the exact timestamp stored in the file.
