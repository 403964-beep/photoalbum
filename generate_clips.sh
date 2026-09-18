#!/bin/bash
set -e

mkdir -p public/videos

items=(
  "football-1.jpg:clip-1.mp4:GAME HIGHLIGHT:FIRST DOWN DRIVE"
  "arch-manning.jpg:clip-2.mp4:ARCH MANNING:TOUCHDOWN PASS"
  "football-3.jpg:clip-3.mp4:SPECTACULAR CATCH:RED ZONE TD"
  "row2-1.png:clip-4.mp4:UFL OFFICIAL:GAME RECAP"
  "row2-2.jpg:clip-5.mp4:DEFENSIVE STAND:4TH DOWN STOP"
  "row2-3.webp:clip-6.mp4:SIDELINE TOE-DRAG:35 YARD CATCH"
  "row3-1.jpg:clip-7.mp4:CBS SPORTS LIVE:OVERTIME WINNER"
  "row3-2.webp:clip-8.mp4:HOLLYWOOD SMOTHERS:SPIN MOVE TD"
  "row3-3.jpg:clip-9.mp4:GAME DAY RIVALRY:FIELD GOAL WALK-OFF"
)

for item in "${items[@]}"; do
  IFS=':' read -r img out tag sub <<< "$item"
  echo "Generating $out from images/$img..."

  # Generate 5-second dynamic highlight reel with slow zoom and pan and lower-third scoreboard overlay
  ffmpeg -y -loop 1 -i "images/$img" -f lavfi -i "sine=frequency=180:duration=5" \
    -filter_complex "
      [0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,
      zoompan=z='min(zoom+0.0015,1.2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=125:s=1280x720:fps=25,
      drawbox=x=0:y=ih-110:w=iw:h=110:color=black@0.75:t=fill,
      drawbox=x=0:y=ih-110:w=iw:h=6:color=#d97706@1.0:t=fill,
      drawbox=x=40:y=ih-85:w=120:h=40:color=#15803d@1.0:t=fill,
      drawbox=x=40:y=ih-85:w=120:h=40:color=#ffffff@1.0:t=2
      [v]" \
    -map "[v]" -c:v libx264 -pix_fmt yuv420p -t 5 -r 25 -movflags +faststart "public/videos/$out"
done

echo "Done generating clips!"
ls -lh public/videos/
