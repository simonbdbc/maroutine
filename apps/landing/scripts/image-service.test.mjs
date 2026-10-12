import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import sharp from 'sharp';
import upstream from 'astro/assets/services/sharp';
import configured from '../src/services/sharp-compat.mjs';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const config = { service: { config: {} }, domains: [], remotePatterns: [] };
const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve('astro/package.json'));

test('configured service and corrected decoder are selected', async () => {
  const loader = await createServer({root:fileURLToPath(new URL('../',import.meta.url)),configFile:false,server:{middlewareMode:true,hmr:false,watch:null}});
  try {
    const {default:projectConfig} = await loader.ssrLoadModule('/astro.config.mjs');
    assert.equal(projectConfig.image.service.entrypoint, './src/services/sharp-compat.mjs');
  } finally { await loader.close(); }
  assert.equal(astroRequire('sharp').versions.sharp, '0.35.5');
  assert.equal(sharp.versions.sharp, '0.35.5');
  for (const method of ['validateOptions', 'getURL', 'parseURL', 'getHTMLAttributes', 'getSrcSet']) {
    assert.equal(configured[method], upstream[method]);
  }
});

test('transparent PNG resize and quality aliases retain valid behavior', async () => {
  const input = await sharp({create:{width:12,height:10,channels:4,background:{r:1,g:2,b:3,alpha:0.25}}}).png().toBuffer();
  const result = await configured.transform(input, {width:6,format:'png',quality:'high'}, config);
  const metadata = await sharp(result.data).metadata();
  assert.equal(result.format, 'png');
  assert.equal(metadata.width, 6);
  assert.equal(metadata.height, 5);
  assert.equal(metadata.hasAlpha, true);
});

test('decodable truncated JPEG keeps the existing best-effort contract', async () => {
  const jpeg = await sharp({create:{width:16,height:12,channels:3,background:'#aabbcc'}}).jpeg().toBuffer();
  const result = await configured.transform(jpeg.subarray(0,jpeg.length-2), {width:8,format:'jpeg'}, config);
  const metadata = await sharp(result.data).metadata();
  assert.equal(metadata.width, 8);
  assert.equal(metadata.height, 6);
});

test('AVIF decoding remains available with corrected native libraries', async () => {
  const avif = await sharp({create:{width:8,height:6,channels:3,background:'#abcdef'}}).avif().toBuffer();
  const result = await configured.transform(avif, {width:4,format:'webp',quality:'mid'}, config);
  const metadata = await sharp(result.data).metadata();
  assert.equal(result.format, 'webp');
  assert.equal(metadata.width, 4);
  assert.equal(metadata.height, 3);
  for (const input of [avif.subarray(0,12), Buffer.alloc(0), Buffer.from('synthetic non-image')]) {
    await assert.rejects(configured.transform(input, {format:'webp'}, config));
  }
});

test('pixel limit, fit and background behavior remain enforced', async () => {
  const input = await sharp({create:{width:8,height:6,channels:4,background:{r:0,g:0,b:0,alpha:0.2}}}).png().toBuffer();
  await assert.rejects(configured.transform(input, {format:'png'}, {service:{config:{limitInputPixels:2}}}));
  const result = await configured.transform(input, {width:16,height:16,fit:'contain',format:'jpeg',background:'#ffffff'}, config);
  const metadata = await sharp(result.data).metadata();
  assert.equal(metadata.width, 8);
  assert.equal(metadata.height, 6);
  assert.equal(metadata.hasAlpha, false);
});

test('SVG passthrough remains byte-identical', async () => {
  const input = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
  const result = await configured.transform(input, {format:'svg'}, config);
  assert.equal(result.format, 'svg');
  assert.deepEqual(result.data, input);
});
