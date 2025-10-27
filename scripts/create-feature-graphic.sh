#!/bin/bash

# Script for å lage Feature Graphic for Google Play
# Krever ImageMagick installert: sudo apt-get install imagemagick

WIDTH=1024
HEIGHT=500
OUTPUT_LANDSCAPE="play-store/feature-graphic.png"
OUTPUT_PORTRAIT="play-store/feature-graphic-portrait.png"

# Sjekk om ImageMagick er installert
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick er ikke installert"
    echo "Installer med: sudo apt-get install imagemagick"
    exit 1
fi

# Opprett play-store katalog hvis den ikke finnes
mkdir -p play-store

echo "🎨 Lager Feature Graphics..."
echo ""

# === LANDSCAPE (1024x500) ===
echo "📐 Lager liggende versjon (1024x500 px)..."

# Lag en gradient bakgrunn (lilla til mørk lilla)
convert -size ${WIDTH}x${HEIGHT} \
    gradient:'#8B5CF6-#6D28D9' \
    -rotate 90 \
    temp_gradient_landscape.png

# Legg til tekst med margin
convert temp_gradient_landscape.png \
    -gravity Center \
    -font "DejaVu-Sans-Bold" \
    -pointsize 70 \
    -fill white \
    -annotate +0-40 "SkyteKlokke" \
    -pointsize 28 \
    -fill "#E9D5FF" \
    -annotate +0+45 "Timer for konkurranseskyttere" \
    "$OUTPUT_LANDSCAPE"

# Rydd opp
rm temp_gradient_landscape.png

if [ -f "$OUTPUT_LANDSCAPE" ]; then
    SIZE=$(du -h "$OUTPUT_LANDSCAPE" | cut -f1)
    echo "✅ Liggende versjon opprettet: $OUTPUT_LANDSCAPE ($SIZE)"
else
    echo "❌ Kunne ikke lage liggende versjon"
fi

echo ""

# === PORTRAIT (500x1024) ===
echo "📐 Lager stående versjon (500x1024 px)..."

# Lag en gradient bakgrunn (lilla til mørk lilla) - stående format
convert -size 500x1024 \
    gradient:'#8B5CF6-#6D28D9' \
    -rotate 90 \
    temp_gradient_portrait.png

# Legg til tekst - justert for stående format
convert temp_gradient_portrait.png \
    -gravity Center \
    -font "DejaVu-Sans-Bold" \
    -pointsize 56 \
    -fill white \
    -annotate +0-60 "SkyteKlokke" \
    -pointsize 22 \
    -fill "#E9D5FF" \
    -annotate +0+30 "Timer for" \
    -annotate +0+65 "konkurranseskyttere" \
    "$OUTPUT_PORTRAIT"

# Rydd opp
rm temp_gradient_portrait.png

if [ -f "$OUTPUT_PORTRAIT" ]; then
    SIZE=$(du -h "$OUTPUT_PORTRAIT" | cut -f1)
    echo "✅ Stående versjon opprettet: $OUTPUT_PORTRAIT ($SIZE)"
else
    echo "❌ Kunne ikke lage stående versjon"
fi

echo ""
echo "🔍 Åpne filene for å se resultatet, deretter last dem opp til Play Console"
