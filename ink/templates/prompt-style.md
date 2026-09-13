# House Style Prompt — AutoEffortless Manga Studio (style TBD by Mr D)

Locked onto every art prompt. Change only when Mr D signs off a new style.

## Global style suffix
```
black and white manga panel, crisp clean ink linework, varied line weight,
screentone shading, strong blacks, high contrast, dutch angle optional,
no text, no watermark, no speech bubble, no caption box, no signature
```
**Why "no text" etc.:** AI lettering is garbage. All lettering happens in the
compositor (`tools/build-page.mjs`) so text is crisp, editable, and correct.

## Character block (paste verbatim for consistency)
```
CHARACTER: Thandi, 15-year-old South African girl, dark brown skin, short box
braids with a single gold bead on the left, worn grey school jersey over white
shirt collar, determined amber eyes, small scar on right eyebrow.
```
Character lock rules:
1. Same character block **word-for-word** in every prompt. Never paraphrase.
2. Same `seed` per character per chapter for the base look; vary seed only for pose.
3. Reference sheet first (`art/chars/<name>-sheet.jpg`), then use img2img /
   reference-conditioning for panels where the face must match.
4. Keep art on the *left/centre* of frame where a bubble will sit top-right.

## Negative prompt (where supported)
```
color, 3d render, cgi, photorealistic, text, letters, watermark, signature,
extra fingers, deformed hands, blurry, low contrast
```

## Panel prompt template
```
<shot type> of <CHARACTER block>, <action>, <location>, <time/light>,
<emotion>, <camera/effect cue>. <GLOBAL STYLE SUFFIX>
```

Shot types: extreme wide / wide / medium / medium close / close up / extreme close / over the shoulder / bird's eye / worm's eye.
Effect cues: speed lines, radial burst, sweat drop, screen tone gradient, silhouette, dutch angle.
