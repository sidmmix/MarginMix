import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BrandBrief {
  brand_name: string;
  industry_category: string;
  top_3_usps: string[];
  complexity_score: number;
  target_audience_persona: string;
  market_challenger_status: string;
  scraped_data?: {
    page_title: string;
    meta_description: string;
    headers: { h1: string[]; h2: string[]; h3: string[] };
    nav_items: string[];
    mega_menu_categories: string[];
    pricing_indicators: string[];
    about_us_text: string;
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
  mega_menu_categories: string[];
  pricing_indicators: string[];
  about_us_text: string;
  raw_text: string;
}

const GENERIC_BRIEF: BrandBrief = {
  brand_name: "Unknown Brand",
  industry_category: "General Business",
  top_3_usps: [
    "Strong market positioning",
    "Differentiated service offering",
    "Strategic operational focus"
  ],
  complexity_score: 5,
  target_audience_persona: "General consumers seeking reliable solutions",
  market_challenger_status: "Emerging player in competitive landscape"
};

const SCRAPE_TIMEOUT = 30000; // 30 seconds

const PRICING_KEYWORDS = [
  'luxury', 'premium', 'discount', 'value', 'bulk', 'wholesale',
  'affordable', 'budget', 'elite', 'exclusive', 'economy', 'savings',
  'deal', 'sale', 'clearance', 'low price', 'best price', 'everyday low',
  '$', '€', '£', '¥', '₹', 'free shipping', 'membership'
];

async function scrapeWebsite(url: string): Promise<ScrapedData> {
  let browser: Browser | null = null;
  
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page: Page = await context.newPage();
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: SCRAPE_TIMEOUT 
    });
    
    await page.waitForTimeout(2000);
    
    const html = await page.content();
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
    const megaMenuCategories = new Set<string>();
    
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
    
    // Extract Mega Menu / Product Category headers
    const megaMenuSelectors = [
      '.mega-menu',
      '.megamenu',
      '[class*="mega"]',
      '.dropdown-menu',
      '.submenu',
      '.sub-menu',
      '[class*="category"]',
      '[class*="product-category"]',
      '.nav-dropdown',
      '.department',
      '[class*="department"]'
    ];
    
    for (const selector of megaMenuSelectors) {
      $(selector).find('a, span, li').each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 2 && text.length < 80) {
          megaMenuCategories.add(text);
        }
      });
    }
    
    // Also check for category-like headers in nav
    $('nav').find('ul ul a, .dropdown a, [class*="sub"] a').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 2 && text.length < 80) {
        megaMenuCategories.add(text);
      }
    });
    
    // Extract Pricing Indicators from full page text
    const fullPageText = $('body').text().toLowerCase();
    const pricingIndicators: string[] = [];
    
    for (const keyword of PRICING_KEYWORDS) {
      if (fullPageText.includes(keyword.toLowerCase())) {
        pricingIndicators.push(keyword);
      }
    }
    
    // Try to find About Us / Our Mission page content
    let aboutUsText = '';
    
    // Look for about sections on current page
    const aboutSelectors = [
      '[class*="about"]',
      '[id*="about"]',
      '[class*="mission"]',
      '[id*="mission"]',
      '[class*="story"]',
      '[class*="who-we-are"]',
      '[class*="company"]'
    ];
    
    for (const selector of aboutSelectors) {
      const aboutSection = $(selector).first();
      if (aboutSection.length) {
        const text = aboutSection.text().trim();
        if (text.length > 50 && text.length < 2000) {
          aboutUsText = text;
          break;
        }
      }
    }
    
    // If no about section on homepage, try to navigate to About page
    if (!aboutUsText) {
      const aboutLinks = $('a').filter((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().toLowerCase();
        return text.includes('about') || text.includes('mission') || 
               href.includes('about') || href.includes('mission');
      });
      
      if (aboutLinks.length > 0) {
        const aboutHref = aboutLinks.first().attr('href');
        if (aboutHref) {
          try {
            const aboutUrl = new URL(aboutHref, url).toString();
            await page.goto(aboutUrl, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForTimeout(1000);
            const aboutHtml = await page.content();
            const $about = cheerio.load(aboutHtml);
            
            // Get main content from About page
            const mainContent = $about('main, article, [class*="content"], [class*="about"]').first().text().trim();
            if (mainContent.length > 50) {
              aboutUsText = mainContent.slice(0, 2000);
            } else {
              aboutUsText = $about('body').text().trim().slice(0, 2000);
            }
          } catch (aboutError) {
            console.log('[DNA_Scraper] Could not fetch About page:', aboutError);
          }
        }
      }
    }
    
    // Count subcategories for complexity analysis
    const subcategoryCount = megaMenuCategories.size;
    const navDepth = navItems.size;
    
    // Compile raw text for GPT analysis
    const raw_text = [
      `Page Title: ${page_title}`,
      `Meta Description: ${meta_description}`,
      `H1 Headers: ${h1.join(', ')}`,
      `H2 Headers: ${h2.slice(0, 15).join(', ')}`,
      `H3 Headers: ${h3.slice(0, 15).join(', ')}`,
      `Navigation Items (${navItems.size} total): ${Array.from(navItems).slice(0, 30).join(', ')}`,
      `Mega Menu / Product Categories (${megaMenuCategories.size} found): ${Array.from(megaMenuCategories).slice(0, 40).join(', ')}`,
      `Pricing Indicators Found: ${pricingIndicators.join(', ') || 'None detected'}`,
      `About Us / Mission Text: ${aboutUsText.slice(0, 1500) || 'Not found on homepage'}`
    ].join('\n\n');
    
    await browser.close();
    
    return {
      page_title,
      meta_description,
      headers: { h1: h1.slice(0, 5), h2: h2.slice(0, 15), h3: h3.slice(0, 15) },
      nav_items: Array.from(navItems).slice(0, 30),
      mega_menu_categories: Array.from(megaMenuCategories).slice(0, 40),
      pricing_indicators: pricingIndicators,
      about_us_text: aboutUsText.slice(0, 2000),
      raw_text
    };
    
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

async function generateBrandBrief(scrapedData: ScrapedData): Promise<BrandBrief> {
  const categoryCount = scrapedData.mega_menu_categories.length;
  const navCount = scrapedData.nav_items.length;
  
  const prompt = `You are a senior brand strategist and competitive intelligence analyst. Analyze the following website data and generate a nuanced Brand Insight Brief.

SCRAPED WEBSITE DATA:
${scrapedData.raw_text}

ANALYSIS REQUIREMENTS:

1. BRAND NAME: Extract the company/brand name from the data.

2. INDUSTRY CATEGORY (Be Specific):
   - Do NOT use generic terms like "Retail" or "E-commerce"
   - Define their specific niche (e.g., "Hypermarket Retail & Omnichannel Grocery", "Enterprise SaaS Payment Infrastructure", "DTC Luxury Fashion")
   - Consider their positioning: Are they discount-focused? Premium? Mass-market?

3. COMPLEXITY SCORE (1-10) - Based on Menu Depth:
   - Found ${categoryCount} product/service categories and ${navCount} navigation items
   - If they have >5 distinct sub-categories or departments, score MUST be 7-10
   - Simple single-product companies: 1-3
   - Multi-category retailers with departments (Pharmacy, Auto, Groceries, etc.): 9-10
   - This brand has ${categoryCount > 5 ? 'MANY categories - score should be HIGH (8-10)' : categoryCount > 2 ? 'moderate categories - score should be MEDIUM (5-7)' : 'few categories - score accordingly'}

4. TOP 3 USPs - NUANCED INSIGHTS ONLY:
   BANNED PHRASES (Never use these generic statements):
   - "Quality products"
   - "Customer-focused"
   - "Competitive pricing"
   - "Wide selection"
   - "Great customer service"
   - "Trusted brand"
   
   REQUIRED: Identify specific strategic moats like:
   - Pricing strategy moats: "Everyday Low Price (EDLP) logistics model", "Premium positioning with aspirational branding"
   - Operational moats: "Private Label Brand dominance", "Vertical integration in supply chain"
   - Customer moats: "High-Frequency Essentials Footfall strategy", "Subscription-first retention model"
   - Technology moats: "API-first developer ecosystem", "Proprietary matching algorithm"

5. TARGET AUDIENCE PERSONA:
   - Be specific: NOT "general consumers"
   - Examples: "Value-conscious suburban families with children", "Tech-forward SMB finance teams", "Affluent urban millennials seeking sustainable fashion"
   - Use pricing indicators found: ${scrapedData.pricing_indicators.join(', ') || 'None detected'}

6. MARKET CHALLENGER STATUS:
   - Define their competitive position
   - Examples: "Dominant incumbent defending against Amazon", "Challenger brand disrupting legacy players", "Niche specialist in fragmented market"

Return ONLY valid JSON with this exact structure:
{
  "brand_name": "string",
  "industry_category": "specific niche category",
  "top_3_usps": ["nuanced insight 1", "nuanced insight 2", "nuanced insight 3"],
  "complexity_score": number (1-10),
  "target_audience_persona": "specific audience description",
  "market_challenger_status": "competitive position statement"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a senior competitive intelligence analyst specializing in brand strategy. Your insights must be specific, nuanced, and actionable - never generic. You identify specific strategic moats, audience segments, and competitive dynamics. Always return valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.4
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
      brief.top_3_usps.push("Strategic operational advantage");
    }
    brief.top_3_usps = brief.top_3_usps.slice(0, 3);
    
    // Ensure complexity_score reflects category count if high
    if (scrapedData.mega_menu_categories.length > 5 && brief.complexity_score < 7) {
      brief.complexity_score = Math.min(10, 7 + Math.floor(scrapedData.mega_menu_categories.length / 10));
    }
    brief.complexity_score = Math.min(10, Math.max(1, Math.round(brief.complexity_score)));
    
    // Ensure new fields have defaults
    if (!brief.target_audience_persona) {
      brief.target_audience_persona = "Target consumers seeking reliable solutions in their category";
    }
    if (!brief.market_challenger_status) {
      brief.market_challenger_status = "Established player in competitive market";
    }
    
    // Attach scraped data for reference
    brief.scraped_data = {
      page_title: scrapedData.page_title,
      meta_description: scrapedData.meta_description,
      headers: scrapedData.headers,
      nav_items: scrapedData.nav_items,
      mega_menu_categories: scrapedData.mega_menu_categories,
      pricing_indicators: scrapedData.pricing_indicators,
      about_us_text: scrapedData.about_us_text.slice(0, 500)
    };
    
    return brief;
    
  } catch (error) {
    console.error("GPT Brand Brief generation failed:", error);
    throw error;
  }
}

export async function scrapeBrandDNA(url: string): Promise<BrandBrief> {
  console.log(`[Insight_Hunter] Starting deep analysis for: ${url}`);
  
  // Validate URL
  try {
    new URL(url);
  } catch {
    console.error(`[Insight_Hunter] Invalid URL: ${url}`);
    return { ...GENERIC_BRIEF, brand_name: "Invalid URL" };
  }
  
  try {
    // Scrape the website with timeout
    const scrapePromise = scrapeWebsite(url);
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Scrape timeout')), SCRAPE_TIMEOUT + 5000)
    );
    
    const scrapedData = await Promise.race([scrapePromise, timeoutPromise]);
    
    console.log(`[Insight_Hunter] Scraped successfully. Title: ${scrapedData.page_title}`);
    console.log(`[Insight_Hunter] Found ${scrapedData.mega_menu_categories.length} categories, ${scrapedData.nav_items.length} nav items`);
    console.log(`[Insight_Hunter] Pricing indicators: ${scrapedData.pricing_indicators.join(', ') || 'None'}`);
    
    // Generate Brand Brief with GPT
    const brandBrief = await generateBrandBrief(scrapedData);
    
    console.log(`[Insight_Hunter] Brand Brief generated: ${brandBrief.brand_name} | Complexity: ${brandBrief.complexity_score}/10`);
    
    return brandBrief;
    
  } catch (error) {
    console.error(`[Insight_Hunter] Analysis failed for ${url}:`, error);
    
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
