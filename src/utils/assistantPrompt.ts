import { Message } from '../types/index';

// Define interfaces for type safety
interface Product {
  name: string;
  subtitle: string;
  price: string;
  specs?: Record<string, string>;
}

interface CatalogData {
  productName: string;
  description: string;
  features: string[];
  specs: string[];
}

// Utility to format product summary from fetched data
export const formatProductSummary = (products: Product[]): string => {
  try {
    if (!Array.isArray(products) || products.length === 0) {
      return 'No products available.';
    }

    return products
      .map((p) => {
        const keySpecs: string[] = [];
        if (p.specs?.['Sampling Depth']) keySpecs.push(`Depth: ${p.specs['Sampling Depth']}`);
        if (p.specs?.['Weight']) keySpecs.push(`Weight: ${p.specs['Weight']}`);
        if (p.specs?.['Horizons']) keySpecs.push(`Horizons: ${p.specs['Horizons']}`);
        return `${p.name} (${p.subtitle}) - ${p.price} - ${keySpecs.join(', ') || 'No specs available'}`;
      })
      .join('\n');
  } catch (err) {
    console.error('Error formatting product summary:', err);
    return 'Error formatting product summary.';
  }
};

// Utility to extract key info from catalog content
export const extractKeyInfo = (content: string): string => {
  if (!content || typeof content !== 'string') {
    console.error('Invalid catalog content: expected a non-empty string');
    return 'No catalog information available.';
  }

  try {
    let keyInfo = '';
    const sections = content.split('## ').filter((s) => s.trim());

    for (const section of sections) {
      const lines = section.split('\n').filter((l) => l.trim());
      if (lines.length === 0) continue;

      const title = lines[0].split(' - ')[0].trim();
      if (!title) continue;

      keyInfo += `${title}:\n`;
      let currentSection: 'Desc' | 'Features' | 'Specs' | null = null;

      for (const line of lines.slice(1)) {
        if (line.startsWith('Description:')) {
          currentSection = 'Desc';
        } else if (line.startsWith('Key Features:')) {
          currentSection = 'Features';
        } else if (line.startsWith('Technical Specifications:')) {
          currentSection = 'Specs';
        } else if (currentSection === 'Desc' && line.trim()) {
          const description = line.split('.')[0].trim();
          if (description) keyInfo += `Desc: ${description}.\n`;
        } else if (currentSection && line.startsWith('- ') && line.trim().length > 2) {
          keyInfo += `${line}\n`;
        }
      }
      keyInfo += '\n';
    }

    return keyInfo.trim() || 'No key information extracted from catalog.';
  } catch (err) {
    console.error('Error extracting key info from catalog:', err);
    return 'Error processing catalog content.';
  }
};

// System message template for reusability
const SYSTEM_MESSAGE_TEMPLATE = `You are a domain expert in soil sampling equipment. 
Always answer directly and decisively, without hedging.
Format your answers in Markdown with:
- **Bold** for key specs and conclusions
- Bullet points for comparisons
- Tables where relevant (use GitHub-style Markdown tables)

Context you can use:
{{sampleSection}}

Product catalog:
{{productSummary}}

If the user requests to create, edit, or delete product info, or if it makes sense based on the conversation, perform the action by outputting a JSON block at the END of your response, wrapped in \`\`\`json and \`\`\`. Do NOT explain the JSON in your main response—keep it conversational. The JSON must have this exact structure:

\`\`\`json
{
  "action": "create" | "update" | "delete",
  "target": "catalog" | "products",
  "data": {
    // For create/update in products.json: { "name": string, "subtitle": string, "price": string, "specs": object }
    // For create/update in catalog.txt: { "productName": string, "description": string, "features": array<string>, "specs": array<string> }
    // For delete: { "productName": string }
  }
}
\`\`\`

Example: To update a product spec, respond normally, then append the JSON block. Only output JSON for CRUD actions.`;

// Factory function to create system message with pre-fetched data
export const getSystemMessage = (productSummary: string, sampleSection: string): Message => {
  return {
    id: Date.now().toString(), // Add unique ID for Message type
    role: 'system',
    content: SYSTEM_MESSAGE_TEMPLATE.replace('{{sampleSection}}', sampleSection || 'No catalog context available.')
      .replace('{{productSummary}}', productSummary || 'No product catalog available.'),
    timestamp: new Date(),
  };
};

// Utility to fetch and format product section for a specific product
// ... (previous code remains the same)

export const fetchProductSection = async (productName: string): Promise<string> => {
  if (!productName?.trim()) {
    console.error('Invalid product name provided');
    return 'No product name provided.';
  }

  try {
    const res = await fetch('http://localhost:5000/api/catalog', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch catalog: ${res.status}`);
    }
    const data = await res.json();
    if (!data.success) {
      throw new Error(`Catalog fetch unsuccessful: ${data.error || 'Unknown error'}`);
    }
    if (typeof data.content !== 'string' || !data.content.includes(productName)) {
      return `No catalog information found for "${productName}".`;
    }
    return extractKeyInfo(data.content);
  } catch (err) {
    console.error(`Error fetching catalog for "${productName}":`, err);
    return 'Error fetching catalog data.';
  }
};

export const fetchProductSummary = async (): Promise<string> => {
  try {
    const res = await fetch('http://localhost:5000/api/products', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }
    const data = await res.json();
    if (!data.success) {
      throw new Error(`Products fetch unsuccessful: ${data.error || 'Unknown error'}`);
    }
    if (!Array.isArray(data.data)) {
      throw new Error('Invalid product data format');
    }
    return formatProductSummary(data.data);
  } catch (err) {
    console.error('Error fetching products:', err);
    return 'Error fetching product summary.';
  }
};