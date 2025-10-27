# Assets Directory

This directory contains static assets used by the Twitter Video Generator API.

## Background Music

### Required File
- **Filename:** `background-music.mp3`
- **Duration:** 5 seconds (or seamlessly looping)
- **Format:** MP3 or AAC
- **Quality:** 128kbps minimum
- **Style:** Neutral, non-intrusive background track

### Adding Background Music

You need to add your own background music file to this directory:

```bash
# Option 1: Copy your file
cp /path/to/your/music.mp3 assets/background-music.mp3

# Option 2: Download from a URL
curl -o assets/background-music.mp3 https://example.com/music.mp3

# Option 3: Use wget
wget -O assets/background-music.mp3 https://example.com/music.mp3
```

### Recommended Sources for License-Free Music

1. **Uppbeat** - https://uppbeat.io
   - Free for non-commercial use
   - Large library of quality tracks

2. **Pixabay** - https://pixabay.com/music
   - Free for commercial use
   - No attribution required

3. **YouTube Audio Library** - https://studio.youtube.com/
   - Free music for creators
   - Filter by duration and mood

4. **Free Music Archive** - https://freemusicarchive.org
   - Various licenses available
   - Check individual track licenses

5. **Incompetech** - https://incompetech.com/music
   - Royalty-free music
   - Attribution required (free tier)

### Creating a Silent Audio File (Testing)

If you want to test without music, you can create a silent MP3:

```bash
# Using FFmpeg to create 5 seconds of silence
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 5 -q:a 9 -acodec libmp3lame assets/background-music.mp3
```

### Specifications

The video generator expects:
- Audio duration: Exactly 5 seconds (will be trimmed if longer)
- Sample rate: 44.1kHz recommended
- Channels: Stereo
- The audio will be:
  - Faded in over 0.5 seconds
  - Faded out over 0.5 seconds
  - Volume reduced to 30% of original

### Important Notes

⚠️ **Copyright Notice**: Ensure you have the proper license/rights to use any audio file in your videos. The creators of this API are not responsible for copyright violations.

⚠️ **File Not Included**: This repository does not include a default background music file due to licensing concerns. You must provide your own.

## Other Assets

You can add other assets to this directory as needed:
- Alternative audio tracks
- Watermark images
- Custom fonts
- etc.
