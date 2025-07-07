#!/usr/bin/env node
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('input', {
    alias: 'i',
    description: 'Input HTML file path',
    type: 'string',
    demandOption: true
  })
  .option('output', {
    alias: 'o',
    description: 'Output PDF file path',
    type: 'string',
    demandOption: true
  })
  .help()
  .alias('help', 'h')
  .argv;

(async () => {
  const inputFile = path.resolve(argv.input);
  const outputFile = path.resolve(argv.output);

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found at ${inputFile}`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const htmlContent = fs.readFileSync(inputFile, 'utf-8');
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  await page.addStyleTag({ content: `
    body, .presentation { overflow: visible !important; height: auto !important; }
    .controls, .progress-bar, .page-number, .bg-animation, .circuit-lines { display: none !important; }
    .slide {
      display: block !important;
      opacity: 1 !important;
      transform: none !important;
      position: relative !important;
      page-break-after: always;
      page-break-inside: avoid;
      height: 100vh;
    }
    .slide:last-of-type { page-break-after: auto; }
  `});

  await page.emulateMedia({ media: 'print' });

  await page.pdf({
    path: outputFile,
    format: 'A4',
    printBackground: true,
  });

  console.log(`Successfully converted ${inputFile} to ${outputFile}`);

  await browser.close();
})();
