import puppeteer, { Browser } from "puppeteer";
let browser: Browser | null = null;
async function getBrowser() {
  if (browser) return browser;
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  return browser;
}
export interface PDFOptions { 
  html: string; 
  margin?: { top?: string; right?: string; bottom?: string; left?: string }; 
  headerHtml?: string; 
  footerHtml?: string 
}

export interface PdfInput extends PDFOptions {}
export async function renderPdf({ html, margin, headerHtml, footerHtml }: PdfInput): Promise<Buffer> {
  const b = await getBrowser();
  const page = await b.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({ printBackground: true, format: "A4", margin, displayHeaderFooter: Boolean(headerHtml||footerHtml), headerTemplate: headerHtml ?? "<span></span>", footerTemplate: footerHtml ?? "<span></span>" });
  await page.close();
  return pdf;
}
