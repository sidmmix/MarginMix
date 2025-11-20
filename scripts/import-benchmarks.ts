import XLSX from 'xlsx';
import OpenAI from 'openai';
import { db } from '../server/db';
import { cpmBenchmarks } from '../shared/schema';
import { sql } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function importBenchmarks() {
  try {
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile('attached_assets/CPM Benchmarks  INDIA_1763608588990.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} rows to import`);

    // Delete existing benchmarks
    console.log('Clearing existing benchmarks...');
    await db.delete(cpmBenchmarks);

    let importedCount = 0;
    const errors: string[] = [];
    let lastIndustry = '';  // Track last seen industry for merged cells

    for (let index = 0; index < data.length; index++) {
      try {
        const rowData = data[index] as any;
        
        // Trim whitespace from keys and get values
        let industry = (rowData['Industry '] || rowData['Industry'] || '').trim();
        const platform = (rowData['Platform '] || rowData['Platform'] || '').trim();
        const objective = (rowData['Objective '] || rowData['Objective'] || '').trim();
        const targeting = (rowData['India Targeting '] || rowData['India Targeting'] || rowData['Targeting'] || '').trim();
        const cpmCpaRaw = (rowData['CPM/CPA'] || '').trim();

        // Handle merged cells: if industry is empty, use the last seen industry
        if (!industry && lastIndustry) {
          industry = lastIndustry;
        } else if (industry) {
          lastIndustry = industry;
        }

        // Validate required fields
        if (!industry || !platform || !objective) {
          errors.push(`Row ${index + 2}: Missing required fields (Industry: ${industry}, Platform: ${platform}, Objective: ${objective})`);
          continue;
        }

        // Parse CPM/CPA value - format is like "65 - CPM" or "850 - CPA"
        let cpm = null;
        let cpa = null;
        
        if (cpmCpaRaw) {
          const match = cpmCpaRaw.match(/(\d+(?:\.\d+)?)\s*-\s*(CPM|CPA)/i);
          if (match) {
            const value = match[1];
            const type = match[2].toUpperCase();
            if (type === 'CPM') {
              cpm = `₹${value}`;
            } else if (type === 'CPA') {
              cpa = `₹${value}`;
            }
          }
        }

        // Create text for embedding
        const embeddingText = [industry, objective, targeting].filter(Boolean).join(' - ');

        console.log(`Processing row ${index + 1}/${data.length}: ${industry} | ${platform} | ${objective}`);

        // Generate embedding
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-large",
          input: embeddingText,
          dimensions: 3072
        });

        const embedding = embeddingResponse.data[0].embedding;

        // Insert into database
        await db.insert(cpmBenchmarks).values({
          industry,
          platform,
          objective,
          targeting: targeting || null,
          cpm,
          cpa,
          geo: 'India',
          embedding: sql`${JSON.stringify(embedding)}::vector`,
          metadata: {
            importDate: new Date().toISOString(),
            sourceFile: 'CPM Benchmarks INDIA_1763608588990.xlsx',
            rawCpmCpa: cpmCpaRaw
          }
        });

        importedCount++;
      } catch (rowError: any) {
        console.error(`Error processing row ${index + 2}:`, rowError.message);
        errors.push(`Row ${index + 2}: ${rowError.message}`);
      }
    }

    console.log('\n=== Import Complete ===');
    console.log(`Successfully imported: ${importedCount} benchmarks`);
    console.log(`Total rows: ${data.length}`);
    if (errors.length > 0) {
      console.log(`Errors: ${errors.length}`);
      errors.forEach(err => console.log(`  - ${err}`));
    }

    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importBenchmarks();
