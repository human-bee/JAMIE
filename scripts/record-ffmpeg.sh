#!/bin/bash

# Create temp directory if it doesn't exist
mkdir -p temp

# Record three 5-second segments
for i in {1..3}; do
  echo "Recording segment $i of 3..."
  echo "Press Enter to start recording..."
  read
  
  ffmpeg -f avfoundation -i ":0" -t 5 -ar 16000 -ac 1 -c:a pcm_s16le "temp/segment_${i}_$(date +%s).wav" -y
  
  if [ $i -lt 3 ]; then
    echo -e "\nPreparing for next segment..."
    sleep 2
  fi
done

echo -e "\nAll segments recorded successfully!" 