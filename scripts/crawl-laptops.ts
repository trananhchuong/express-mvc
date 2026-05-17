import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { prisma } from '../src/lib/prisma.js';

const BASE_URL = 'https://fptshop.com.vn';
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');
const TARGET = 50;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8',
};

const PAGES = [
  '/may-tinh-xach-tay',
  '/may-tinh-xach-tay/gaming-do-hoa',
  '/may-tinh-xach-tay/sinh-vien-van-phong',
];

interface RawProduct {
  name: string;
  price: number;
  imageUrl: string;
  shortDesc: string;
  href: string;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanName(name: string): string {
  return name.replace(/^Laptop\s+/i, '').trim();
}

function extractBrand(name: string): string {
  const clean = cleanName(name);
  const brands = ['Apple', 'Asus', 'Acer', 'Dell', 'HP', 'Lenovo', 'MSI', 'Samsung', 'LG', 'Microsoft', 'Gigabyte', 'Razer'];
  for (const brand of brands) {
    if (clean.toLowerCase().startsWith(brand.toLowerCase())) return brand;
  }
  return clean.split(' ')[0];
}

function parsePrice(text: string): number {
  return parseInt(text.replace(/[^\d]/g, ''), 10) || 0;
}

function extractTarget(name: string): string {
  const lower = cleanName(name).toLowerCase();
  if (lower.includes('gaming') || lower.includes('tuf') || lower.includes('nitro') || lower.includes('legion') || lower.includes('rog')) {
    return 'Gaming Laptop';
  }
  if (lower.includes('macbook') || lower.includes('thinkpad') || lower.includes('xps')) {
    return 'Premium Laptop';
  }
  return 'Laptop';
}

function originalCdnUrl(src: string): string {
  // https://cdn2.fptshop.com.vn/unsafe/360x0/filters:format(webp):quality(75)/filename.png
  // → https://cdn2.fptshop.com.vn/unsafe/filename.png
  const match = src.match(/cdn2\.fptshop\.com\.vn\/unsafe\/(?:[^/]+\/)?(?:filters:[^/]+\/)?(.+)/);
  if (match) return `https://cdn2.fptshop.com.vn/unsafe/${match[1]}`;
  return src;
}

async function downloadImage(url: string): Promise<string> {
  const response = await axios.get<Buffer>(url, {
    responseType: 'arraybuffer',
    headers: HEADERS,
    timeout: 15000,
  });

  const contentType = (response.headers['content-type'] as string) || '';
  let ext = '.jpg';
  if (contentType.includes('png')) ext = '.png';
  else if (contentType.includes('webp')) ext = '.webp';
  else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
  else {
    const urlExt = path.extname(url.split('?')[0]);
    if (urlExt) ext = urlExt;
  }

  const filename = `${crypto.randomUUID()}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), response.data);
  return filename;
}

async function scrapePage(pagePath: string): Promise<RawProduct[]> {
  const url = `${BASE_URL}${pagePath}`;
  console.log(`  Fetching ${url}`);
  const { data: html } = await axios.get<string>(url, { headers: HEADERS, timeout: 20000 });
  const $ = cheerio.load(html);
  const products: RawProduct[] = [];

  $('a[aria-label^="Laptop"]').each((_, el) => {
    const outerLink = $(el);
    const href = outerLink.attr('href') || '';
    if (!href.startsWith('/may-tinh-xach-tay/')) return;

    const img = outerLink.find('img').first();
    const rawSrc = img.attr('src') || '';
    if (!rawSrc) return;
    const imageUrl = originalCdnUrl(rawSrc);

    const cardInfo = outerLink.next();
    const name = cardInfo.find('h3').first().text().trim();
    const priceText = cardInfo.find('p').filter((_, p) => {
      const cls = $(p).attr('class') || '';
      return cls.includes('b1-semibold');
    }).first().text().trim();
    const innerLink = cardInfo.find(`a[href="${href}"]`).first();
    const titleAttr = innerLink.attr('title') || name;
    const shortDesc = titleAttr.replace(/^Laptop\s+/i, '').substring(0, 500);

    if (!name || !priceText) return;
    const price = parsePrice(priceText);
    if (!price) return;

    products.push({ name, price, imageUrl, shortDesc, href });
  });

  return products;
}

async function main() {
  console.log('Starting laptop crawl from FPT Shop...\n');

  const seen = new Set<string>();
  const raw: RawProduct[] = [];

  for (const page of PAGES) {
    if (raw.length >= TARGET) break;
    try {
      const items = await scrapePage(page);
      for (const item of items) {
        if (seen.has(item.href)) continue;
        seen.add(item.href);
        raw.push(item);
        if (raw.length >= TARGET) break;
      }
      console.log(`  → ${raw.length} unique products collected so far`);
    } catch (err) {
      console.error(`  Failed to fetch ${page}:`, (err as Error).message);
    }
    await sleep(500);
  }

  console.log(`\nCollected ${raw.length} products. Downloading images and saving to DB...\n`);

  const inserted: string[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    process.stdout.write(`[${i + 1}/${raw.length}] ${item.name.substring(0, 60)}... `);

    let imageFilename = 'placeholder.png';
    try {
      imageFilename = await downloadImage(item.imageUrl);
    } catch {
      process.stdout.write('(image failed) ');
    }

    try {
      await prisma.product.create({
        data: {
          name: cleanName(item.name).substring(0, 200),
          price: item.price,
          image: `/uploads/${imageFilename}`,
          shortDesc: item.shortDesc.substring(0, 500),
          detailDesc: item.shortDesc,
          factory: extractBrand(item.name).substring(0, 200),
          target: extractTarget(item.name).substring(0, 200),
          quantity: 10,
          sold: 0,
        },
      });
      inserted.push(item.name);
      process.stdout.write('✓\n');
    } catch (err) {
      process.stdout.write(`✗ ${(err as Error).message}\n`);
    }

    await sleep(300);
  }

  console.log(`\nDone. Inserted ${inserted.length} products into the database.`);
  await prisma.$disconnect();
}

main().catch(async err => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
