# Happy Birthday Website 🌸

A personalized, mobile-first birthday website for **Piyu**, created by **POobear**.
Built on the open-source [HappyBirthday template](https://github.com/notsointresting/HappyBirthday) and upgraded with a romantic "magical garden" atmosphere, a scrapbook photo collage and gentle motion.

## Live Demo

`https://<your-github-username>.github.io/<your-repo-name>/`

(Add `?birthday=1` to the address to preview the birthday screen before the big day.)

## Features

- **Countdown** to October 8 in India Standard Time. It always aims at the *next* October 8 (never negative) and switches to the birthday screen during October 8.
- **Four connected pages:** Home → Wishes → Timeline → Memories & letter.
- **Wishes** you reveal one at a time, with playful hover/tap overlays.
- **Scrapbook photo collage:** polaroid frames, tilts, tape and flower stickers, scroll-reveal, gentle parallax, tap-to-open **lightbox** (swipe, arrow keys, Esc).
- **Garden background on every page:** sunset sky, flower corners, a small flower meadow, a petal & flower shower, soft pink/rose hearts, sparkles, a few slow birds and celebratory flecks on the final section. Density changes by page/section.
- **Background music** with a mute/unmute button. It continues across pages and never blocks the site if the browser refuses autoplay.
- Confetti + share button on the final section.
- Accessible & light: reduced-motion support, keyboard-friendly, no extra libraries beyond the template's GSAP, fewer particles on phones.

## Personalization

| What | Where |
|---|---|
| Names, greeting, countdown date | `index.html`, `home.js` (`BIRTH_MONTH`, `BIRTH_DAY`, `CELEBRATION_DAYS`) |
| Wishes ("Because…") | `wishes.js` → `reasons` |
| Timeline & receipt | `timeline.html` |
| Photo captions, letter, closing wishes | `memories.html` |
| Effect density per page/section | `garden.js` → `PROFILES` |

## Project Structure

```
index.html · home.css · home.js        Home + countdown
wishes.html · wishes.css · wishes.js   Wishes
timeline.html                          Timeline + receipt (styles inline)
memories.html                          Photo collage + letter (styles inline)
gallery.css · gallery.js               Collage layout, reveal, parallax, lightbox
garden.css · garden.js                 Shared background effects (all pages)
music-sync.js                          Keeps the song playing across pages
photos/photo1.jpg … photo10.jpg        Photos
hbd.mp3                                Background music
gif1.gif · gif2.gif                    Hover stickers on the Wishes page
```

## Photos

Photos live in `photos/` as `photo1.jpg` … `photo10.jpg` (already resized for the web, location data removed). To replace one, keep the same file name (or update the `src` in `memories.html`). Photos are shown at their natural aspect ratio, so nothing is cropped.

## Music

`hbd.mp3` is the song used on every page. Browsers may block autoplay, in which case the 🎵 button starts it with one tap. To change the song, replace `hbd.mp3` (keep the name, and avoid `#`, `[`, `]` or spaces in file names).

## Deployment

1. Create a GitHub repository and upload **all files and folders** from this project (keep `index.html` at the top level).
2. Repository → **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After a minute, open the URL shown on that page.

## Troubleshooting

- **Only see the countdown?** That is intended before October 8 (IST). Use `?birthday=1` to preview.
- **No music?** Tap the 🎵 button once (autoplay rules). Check that `hbd.mp3` was uploaded.
- **Broken photos?** File names are case-sensitive on GitHub Pages: `photo9.jpg`, not `Photo9.JPG`.
- **Old version showing?** Hard-refresh (Ctrl/Cmd+Shift+R) or clear the site cache on the phone.
- **Animations look reduced?** The site respects the device's "reduce motion" setting on purpose.

## Credits

- Base template: [notsointresting/HappyBirthday](https://github.com/notsointresting/HappyBirthday).
- Animation library: [GSAP](https://gsap.com/) (loaded from cdnjs).
- Personalization, garden effects and photo collage: created for Piyu by POobear.

## License

A personal, non-commercial project. Photos, music and messages are private personal content and are not licensed for reuse. The underlying template belongs to its original author.
