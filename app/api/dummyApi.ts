import { MessageType } from '../components/chat/ChatInterface';
import { QuickLink } from '../types';

export const quickLinks: QuickLink[] = [
    {
        title: 'Document Analysis', description: 'Analyze bid documents for procurement.', message: 'Perform Bid Document Analysis',
        id: '',
        text: ''
    },
    {
        title: 'Search Suppliers', description: 'Find top suppliers.', message: 'Search suppliers',
        id: '',
        text: ''
    },
    {
        title: 'Query Database', description: 'Retrieve procurement data via Redshift.', message: 'Query database',
        id: '',
        text: ''
    },
    {
        title: 'Knowledge Base', description: 'Procurement FAQs and policies.', message: 'What is the procurement process?',
        id: '',
        text: ''
    },
    {
        title: 'Create a Ticket', description: 'Generate a ticket.', message: 'Create a ticket',
        id: '',
        text: ''
    },
    {
        title: 'Compare Suppliers', description: 'Compare supplier metrics.', message: 'Compare suppliers',
        id: '',
        text: ''
    }
];

// Utility functions
import { simulateDelay } from '../utils/apiUtils';

/**
 * Fetches a response from the bot based on user message and conversation history
 * @param userMessage - The message sent by the user
 * @param history - The conversation history
 * @param files - Optional files uploaded by the user
 * @returns A promise that resolves to a bot message
 */
export async function fetchBotResponse(userMessage: string, history: MessageType[], files?: File[]): Promise<MessageType> {
    await simulateDelay(500); // Simulate network latency

    const lastBotMessage = history.filter((m) => m.sender === 'bot').pop()?.text;
    const msg = userMessage.toLowerCase();

    // Bid Document Analysis
    if (lastBotMessage === 'Which project would you like to analyze?') {
        return {
            sender: 'bot',
            text: `Analyzing bid documents for ${userMessage} using RAG with Amazon Bedrock Knowledge Base...`,
            report: {
                title: `Bid Analysis Report for ${userMessage}`,
                content: `
**Overview**: This report summarizes the bid analysis using retrieved data from the knowledge base.

- **Total Cost**: $750,000
- **Timeline**: 90 days
- **Supplier**: TechCorp
- **Risk Assessment**: Low risk, stable supplier with proven track record

| Item            | Quantity | Unit Cost | Total Cost |
|-----------------|----------|-----------|------------|
| Server Racks    | 50       | $5,000    | $250,000   |
| Cooling Systems | 20       | $10,000   | $200,000   |
| Cabling         | 1000m    | $50/m     | $50,000    |

**Recommendations**:
- Negotiate bulk discounts on cabling.
- Request expedited delivery for cooling systems to meet project deadlines.

**Analysis Method**: Retrieval-Augmented Generation with Bedrock Knowledge Base.
                `,
                citations: ['https://quip-amazon.com/qSO9A69KUBMo', 'AseekBot Knowledge Base - Bid Docs'],
            },
            multimedia: {
                type: 'graph',
                data: {
                    items: [
                        { name: 'Cost', value: 750000 },
                        { name: 'Time', value: 90 }
                    ]
                }
            },
            timestamp: new Date().toISOString(),
        };
    }
    if (msg.includes('perform bid document analysis')) {
        return {
            sender: 'bot',
            text: 'Which project would you like to analyze?',
            suggestions: ['Project Alpha', 'Project Beta', 'Project Gamma'],
            timestamp: new Date().toISOString(),
        };
    }

    // Supplier Search
    if (lastBotMessage === 'What product are you looking for?') {
        return {
            sender: 'bot',
            text: `Searching suppliers for ${userMessage} via Knowledge Agent...`,
            report: {
                title: `Supplier Report for ${userMessage}`,
                content: `
**Top Suppliers**:
- **Supplier A**: Rating: 4.8/5, Lead Time: 10 days, Contact: sales@suppliera.com
- **Supplier B**: Rating: 4.5/5, Lead Time: 12 days, Contact: info@supplierb.com

| Supplier   | Product         | Price  | Availability |
|------------|-----------------|--------|--------------|
| Supplier A | ${userMessage}  | $5,000 | In Stock     |
| Supplier B | ${userMessage}  | $4,800 | 2 Weeks      |

**Recommendation**: Supplier A for immediate delivery. Consider Supplier B if cost is a priority.
                `,
                citations: ['AseekBot Knowledge Base - Vendor Data', 'https://w.amazon.com/bin/view/BSFT-Ember/Amo-Bot/Design/'],
            },
            multimedia: {
                type: 'video',
                data: {
                    url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
                }
            },
            timestamp: new Date().toISOString(),
        };
    }
    if (msg.includes('search suppliers')) {
        return {
            sender: 'bot',
            text: 'What product are you looking for?',
            suggestions: ['Server Racks', 'Cooling Systems', 'Power Units'],
            timestamp: new Date().toISOString(),
        };
    }

    // Database Query
    if (lastBotMessage === 'What would you like to know from the database?') {
        return {
            sender: 'bot',
            text: `Querying Redshift database for "${userMessage}"...`,
            report: {
                title: `Redshift Query Result: ${userMessage}`,
                content: `
**Summary**:
- **Period**: Q1 2025
- **Total Spend**: $1,500,000
- **Top Categories**: Hardware, Services

| Category       | Amount Spent | Vendors |
|----------------|--------------|---------|
| Hardware       | $900,000     | 5       |
| Services       | $600,000     | 3       |

**Insights**:
- Hardware spending dominates; consider consolidating vendors.
- Services spending is stable, but explore competitive bids for cost savings.

**Query Method**: SQL generated by Redshift Query Agent.
                `,
                citations: ['AseekBot Redshift Data Warehouse', 'https://docs.aws.amazon.com/redshift/latest/mgmt/querying-data.html'],
            },
            multimedia: {
                type: 'graph',
                data: {
                    items: [
                        { name: 'Hardware', value: 900000 },
                        { name: 'Services', value: 600000 }
                    ]
                }
            },
            timestamp: new Date().toISOString(),
        };
    }
    if (msg.includes('query database')) {
        return {
            sender: 'bot',
            text: 'What would you like to know from the database?',
            suggestions: ['Total spend Q1 2025', 'Vendor count', 'Category breakdown'],
            timestamp: new Date().toISOString(),
        };
    }

    // Knowledge Base
    if (msg.includes('show me procurement diagram')) {
        return {
            sender: 'bot',
            text: 'Here is the detailed procurement process diagram.',
            multimedia: {
                type: 'image',
                data: {
                    url: 'https://via.placeholder.com/1200x800?text=Detailed+Procurement+Process+Diagram'
                }
            },
            timestamp: new Date().toISOString(),
        };
    }
    if (msg.includes('procurement process')) {
        return {
            sender: 'bot',
            text: 'Heres an overview from the Knowledge Base: ![Procurement Process Diagram](https://via.placeholder.com/600x400?text=Procurement+Process)',
            report: {
                title: 'Procurement Process Overview',
                content: `
**Steps**:
1. **Identify Needs**: Define requirements for data center components.
2. **Source Suppliers**: Research and shortlist vendors.
3. **Evaluate Bids**: Compare proposals based on cost, timeline, and quality.
4. **Finalize Contracts**: Negotiate and sign agreements.

**Best Practices**:
- Maintain transparency in vendor selection.
- Use data-driven insights for decision-making.
- Establish clear communication channels with suppliers.
                `,
                citations: ['AseekBot Knowledge Base - Proc Policies', 'https://quip-amazon.com/x4hTAVoyLqJQ'],
            },
            timestamp: new Date().toISOString(),
        };
    }
    if (msg.includes('test image')) {
        return {
            sender: 'bot',
            text: 'Here is a test image loaded automatically.',
            multimedia: {
                type: 'image',
                data: {
                    url: 'https://via.placeholder.com/800x600?text=Test+Image'
                }
            },
            timestamp: new Date().toISOString(),
        };
    }

    // Ticket Creation
    if (msg.includes('create a ticket')) {
        return {
            sender: 'bot',
            text: 'Please provide ticket details via the Create Ticket button.',
            suggestions: [],
            timestamp: new Date().toISOString(),
        };
    }

    // File Upload Analysis
    if (msg.includes('perform bid document analysis') && files) {
        const fileNames = files.map(f => f.name).join(', ');
        return {
            sender: 'bot',
            text: `Performing Bid Document Analysis on ${fileNames} using RAG...`,
            report: {
                title: 'Bid Document Analysis Report',
                content: `
**Uploaded Documents**: ${fileNames}

**Summary**:
- **Total Cost Estimate**: $2,000,000
- **Key Items**: Server Racks, Cooling Units
- **Risk Factors**: Potential delays in delivery for cooling units

| File Name       | Item Count | Estimated Cost |
|-----------------|------------|----------------|
| ${files[0]?.name || 'File 1'} | 75         | $1,200,000     |
| ${files[1]?.name || 'File 2'} | 30         | $800,000       |

**Insights**:
- High cost in server racks; explore bulk discounts.
- Ensure supplier reliability for cooling units to mitigate delays.

**Analysis Method**: RAG with Bedrock Knowledge Base.
                `,
                citations: ['AseekBot Knowledge Base - Bid Analysis', 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html'],
            },
            multimedia: {
                type: 'graph',
                data: {
                    items: files.map((f, i) => ({ name: f.name, value: 800000 + i * 400000 }))
                }
            },
            timestamp: new Date().toISOString(),
        };
    }

    // Compare Suppliers
    if (lastBotMessage === 'Which product would you like to compare suppliers for?') {
        return {
            sender: 'bot',
            text: `Comparing suppliers for ${userMessage}...`,
            report: {
                title: `Supplier Comparison for ${userMessage}`,
                content: `
**Comparison Overview**:
- **Product**: ${userMessage}
- **Criteria**: Price, Lead Time, Rating

| Supplier   | Price  | Lead Time | Rating |
|------------|--------|-----------|--------|
| Supplier A | $5,000 | 10 days   | 4.8/5  |
| Supplier B | $4,800 | 12 days   | 4.5/5  |
| Supplier C | $5,200 | 8 days    | 4.7/5  |

**Analysis**:
- **Supplier A**: Best rating, balanced price and lead time.
- **Supplier B**: Lowest price, but longer lead time.
- **Supplier C**: Fastest delivery, but highest price.

**Recommendation**: Choose Supplier A for a balanced approach, or Supplier C if delivery speed is critical.
                `,
                citations: ['AseekBot Knowledge Base - Vendor Metrics', 'https://w.amazon.com/bin/view/BSFT-Ember/Amo-Bot/Design/'],
            },
            multimedia: {
                type: 'graph',
                data: {
                    items: [
                        { name: 'Supplier A', price: 5000, leadTime: 10 },
                        { name: 'Supplier B', price: 4800, leadTime: 12 },
                        { name: 'Supplier C', price: 5200, leadTime: 8 }
                    ]
                }
            },
            timestamp: new Date().toISOString(),
        };
    }
    if (msg.includes('compare suppliers')) {
        return {
            sender: 'bot',
            text: 'Which product would you like to compare suppliers for?',
            suggestions: ['Server Racks', 'Cooling Systems', 'Power Units'],
            timestamp: new Date().toISOString(),
        };
    }

    // Fallback response with ticket trigger properties
    return {
        sender: 'bot',
        text: "I didn't quite catch that. Try a quick link or clarify your request! Alternatively, I can create a ticket for further assistance.",
        timestamp: new Date().toISOString(),
        triggerTicket: true
    };
}