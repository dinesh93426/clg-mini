const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

async function testSharp() {
  const width = 1200;
  const height = 800;
  const nameX = 600;
  const nameY = 400;
  
  const svgText = `
    <svg width="${width}" height="${height}">
      <style>
        .name { font: italic bold 50px serif; fill: #172033; text-anchor: middle; }
      </style>
      <text x="${nameX}" y="${nameY}" class="name">AI & Machine Learning</text>
    </svg>
  `;

  try {
    const templateBuffer = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    }).png().toBuffer();

    const certificateBuffer = await sharp(templateBuffer)
      .composite([{
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
      }])
      .jpeg({ quality: 90 })
      .toBuffer();

    console.log("Success, buffer size:", certificateBuffer.length);
  } catch (err) {
    console.error("Sharp failed:", err.message);
  }
}

testSharp();
