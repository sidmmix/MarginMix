import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BrandBrief {
  brand_name: string;
  industry_category: string;
  top_3_usps: string[];
  complexity_score: number;
  scraped_data?: {
    page_title: string;
    meta_description: string;
    headers: { h1: string[]; h2: string[]; h3: string[] };
    nav_items: string[];
  };
}

export interface ScrapedData {
  page_title: string;
  meta_description: string;
  headers: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  nav_items: string[];
  raw_text: string;
}

const GENERIC_BRIEF: BrandBrief = {
  brand_name: "Unknown Brand",
  industry_category: "General Business",
  top_3_usps: [
    "Quality products/services",
    "Customer-focused approach",
    "Competitive pricing"
  ],
  complexity_score: 5
};

const SCRAPE_TIMEOUT = 30000; // 30 seconds

async function scrapeWebsite(url: string): Promise<ScrapedData> {
  let browser: Browser | null = null;
  
  try {
    // Launch browser with timeout
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page: Page = await context.newPage();
    
    // Set timeout for navigation
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: SCRAPE_TIMEOUT 
    });
    
    // Wait for JavaScript to render
    await page.waitForTimeout(2000);
    
    // Get the rendered HTML
    const html = await page.content();
    
    // Parse with Cheerio
    const $ = cheerio.load(html);
    
    // Extract Page Title
    const page_title = $('title').text().trim() || '';
    
    // Extract Meta Description
    const meta_description = $('meta[name="description"]').attr('content')?.trim() || 
                            $('meta[property="og:description"]').attr('content')?.trim() || '';
    
    // Extract H1-H3 headers
    const h1: string[] = [];
    const h2: string[] = [];
    const h3: string[] = [];
    
    $('h1').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 500) h1.push(text);
    });
    
    $('h2').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 500) h2.push(text);
    });
    
    $('h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 500) h3.push(text);
    });
    
    // Extract Nav Menu items (unique)
    const navItems = new Set<string>();
    
    // Common nav selectors
    const navSelectors = [
      'nav a',
      'header a',
      '[role="navigation"] a',
      '.nav a',
      '.navbar a',
      '.menu a',
      '#menu a',
      '.navigation a'
    ];
    
    for (const selector of navSelectors) {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 1 && text.length < 100) {
          navItems.add(text);
        }
      });
    }
    
    // Compile raw text for GPT analysis
    const raw_text = [
      `Page Title: ${page_title}`,
      `Meta Description: ${meta_description}`,
      `H1 Headers: ${h1.join(', ')}`,
      `H2 Headers: ${h2.slice(0, 10).join(', ')}`,
      `H3 Headers: ${h3.slice(0, 10).join(', ')}`,
      `Navigation Items: ${Array.from(navItems).slice(0, 20).join(', ')}`
    ].join('\n');
    
    await browser.close();
    
    return {
      page_title,
      meta_description,
      headers: { h1: h1.slice(0, 5), h2: h2.slice(0, 10), h3: h3.slice(0, 10) },
      nav_items: Array.from(navItems).slice(0, 20),
      raw_text
    };
    
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

async function generateBrandBrief(scrapedData: ScrapedData): Promise<BrandBrief> {
  const prompt = `Analyze the following website data and generate a Brand Brief JSON.

Website Data:
${scrapedData.raw_text}

Based on this information, generate a JSON object with:
1. brand_name: The company/brand name (extract from title or content)
2. industry_category: The industry/vertical (e.g., "E-commerce", "SaaS", "Healthcare", "Finance", "Retail")
3. top_3_usps: Array of exactly 3 unique selling propositions based on the content
4. complexity_score: A score from 1-10 based on the number of products/services found:
   - 1-3: Simple (1-3 products/services)
   - 4-6: Moderate (4-10 products/services)
   - 7-10: Complex (10+ products/services or enterprise offerings)

Return ONLY valid JSON, no markdown or explanation.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a brand analyst. Analyze website data and return a structured Brand Brief as JSON. Always return valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in GPT response");
    }

    const brief = JSON.parse(content) as BrandBrief;
    
    // Validate required fields
    if (!brief.brand_name || !brief.industry_category || !brief.top_3_usps || brief.complexity_score === undefined) {
      throw new Error("Missing required fields in Brand Brief");
    }
    
    // Ensure top_3_usps is an array with exactly 3 items
    if (!Array.isArray(brief.top_3_usps)) {
      brief.top_3_usps = [String(brief.top_3_usps)];
    }
    while (brief.top_3_usps.length < 3) {
      brief.top_3_usps.push("Quality service");
    }
    brief.top_3_usps = brief.top_3_usps.slice(0, 3);
    
    // Ensure complexity_score is within range
    brief.complexity_score = Math.min(10, Math.max(1, Math.round(brief.complexity_score)));
    
    // Attach scraped data for reference
    brief.scraped_data = {
      page_title: scrapedData.page_title,
      meta_description: scrapedData.meta_description,
      headers: scrapedData.headers,
      nav_items: scrapedData.nav_items
    };
    
    return brief;
    
  } catch (error) {
    console.error("GPT Brand Brief generation failed:", error);
    throw error;
  }
}

export async function scrapeBrandDNA(url: string): Promise<BrandBrief> {
  console.log(`[DNA_Scraper] Starting scrape for: ${url}`);
  
  // Validate URL
  try {
    new URL(url);
  } catch {
    console.error(`[DNA_Scraper] Invalid URL: ${url}`);
    return { ...GENERIC_BRIEF, brand_name: "Invalid URL" };
  }
  
  try {
    // Scrape the website with timeout
    const scrapePromise = scrapeWebsite(url);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Scrape timeout')), SCRAPE_TIMEOUT + 5000)
    );
    
    const scrapedData = await Promise.race([scrapePromise, timeoutPromise]);
    
    console.log(`[DNA_Scraper] Scraped successfully. Title: ${scrapedData.page_title}`);
    
    // Generate Brand Brief with GPT
    const brandBrief = await generateBrandBrief(scrapedData);
    
    console.log(`[DNA_Scraper] Brand Brief generated: ${brandBrief.brand_name}`);
    
    return brandBrief;
    
  } catch (error) {
    console.error(`[DNA_Scraper] Scrape/Analysis failed for ${url}:`, error);
    
    // Return Generic Brief on any failure
    const genericBrief = { ...GENERIC_BRIEF };
    
    // Try to extract brand name from URL
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      const brandFromUrl = hostname.split('.')[0];
      genericBrief.brand_name = brandFromUrl.charAt(0).toUpperCase() + brandFromUrl.slice(1);
    } catch {
      genericBrief.brand_name = "Unknown Brand";
    }
    
    return genericBrief;
  }
}

export { GENERIC_BRIEF };
