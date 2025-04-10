// Simple test script to verify that the completion data is displayed in the message
// Run this script with Node.js to test the implementation

// Simulate a status API response with completion data
const statusResponse = {
  "requestId": "147871b1-27bf-4208-be7b-f6329f4e20a4",
  "status": "COMPLETED",
  "progress": 100,
  "message": "Analysis complete",
  "workflowType": "MULTI_ANALYSIS_PROMPT",
  "userId": "test-user",
  "sessionId": "session-1742640670258-lpu7f4p6",
  "chatId": "session-1742640670258-lpu7f4p6",
  "createdAt": "2025-04-10T19:06:00.116Z",
  "updatedAt": "2025-04-10T19:07:19.167Z",
  "promptId": "vendor-sow-comparison-analysis-v1",
  "completion": "## Bid Analysis Summary\n\n### 1. Price Comparison\n- **Acme Associates R2**: SGD 122,560\n- **Wah Loon**: SGD 140,240\n- **Difference**: SGD 17,680 (14.4% higher for Wah Loon)\n\n### 2. Technical Compliance\n**Key Components Comparison:**\n- **Design/Documentation**:\n  - Acme: More detailed breakdown of preparation work\n  - Wah Loon: Combined design and consultation costs\n- **Installation Work**:\n  - Acme: Includes detailed temporary hoarding and cable detection\n  - Wah Loon: More comprehensive gate installation scope\n\n### 3. Schedule Analysis\n- **Acme**: Provides clear end date (91/2024)\n- **Wah Loon**: Missing project end date (risk factor)\n- **Start Date Difference**: 165 days later for Wah Loon\n\n### 4. Risk Assessment\n**Advantages Acme:**\n- Lower price point\n- Clear project timeline\n- Detailed scope breakdown\n\n**Advantages Wah Loon:**\n- More comprehensive resource listing\n- Detailed construction material specifications\n\n## Recommendation\n**Recommended Vendor: Acme Associates R2**\n\nJustification:\n1. 14.4% more cost-effective\n2. Clear project timeline\n3. More detailed scope breakdown\n4. Includes additional services (cable detection, temporary hoarding)\n\n**Required Actions:**\n1. Verify Acme's resource allocation details\n2. Confirm material specifications match requirements\n3. Validate start date format (45505)",
  "aggregatedResults": {
    "status": "SUCCEEDED",
    "aggregatedResults": {
      "Document Analysis_summary": "Summary not available.",
      "VendorA_Bid_summary": "Summary not available.",
      "VendorA_Bid_price_breakdown": "{\"totalCost\":\"122560\",\"currency\":\"SGD\",\"lineItems\":[{\"description\":\"Preparation and Submission of Shop Drawings\",\"unitCost\":\"26000\",\"quantity\":\"1\",\"totalCost\":\"26000\"},{\"description\":\"To supply labour and material to install temporary hoarding\",\"unitCost\":\"2800\",\"quantity\":\"1\",\"totalCost\":\"3220\"},{\"description\":\"To provide cable detection\",\"unitCost\":\"2500\",\"quantity\":\"1\",\"totalCost\":\"2880\"},{\"description\":\"To supply labour and material to provide opening onto the existing fencing at SIN67 and modify existing fence to new single swing door c/w metal bracket for mounting security access badge\",\"unitCost\":\"7400\",\"quantity\":\"1\",\"totalCost\":\"8510\"},{\"description\":\"To supply labour and material to install new galvanised chequered steel platform and ramp complete with railing for both SIN60 and SIN67\",\"unitCost\":\"9000\",\"quantity\":\"2\",\"totalCost\":\"21600\"},{\"description\":\"To supply labour and material to install RC stump foundation for platform\",\"unitCost\":\"6000\",\"quantity\":\"1\",\"totalCost\":\"6900\"},{\"description\":\"To supply labour and material to make good surface of affected area including turfing\",\"unitCost\":\"3500\",\"quantity\":\"1\",\"totalCost\":\"4030\"},{\"description\":\"To supply labour and material to install mortise lock for single swing door\",\"unitCost\":\"6400\",\"quantity\":\"1\",\"totalCost\":\"7360\"},{\"description\":\"To supply labour and material to install 600mm(W) x 600mm(D) x 600mm(H) Pre Cast Pole foundation for streelight pole\\n- 1 set for SIN60\\n- 1 set for SIN67\",\"unitCost\":\"1300\",\"quantity\":\"2\",\"totalCost\":\"3000\"},{\"description\":\"To supply labour and material to install new LED streetlight with 60W LED lamp c/w 6m flange mounted hot dipped galvanized octagonal post top column and cabling workings\\n- 1 set for SIN60\\n- 1 set for SIN67\",\"unitCost\":\"1260\",\"quantity\":\"2\",\"totalCost\":\"2900\"}]}",
      "VendorA_Bid_deviations": "{\"summary\":\"No specific deviations or exceptions are mentioned in the provided document.\",\"items\":[]}",
      "VendorA_Bid_schedule": "{\"projectStartDate\":\"45505\",\"projectEndDate\":\"91/2024\",\"milestones\":[]}",
      "VendorA_Bid_resources": "{\"summary\":\"The document does not explicitly mention resources being offered, such as personnel or equipment details.\",\"items\":[]}",
      "sow_doc": "Information not available for sow_doc.",
      "bid_doc_1": "Information not available for bid_doc_1.",
      "bid_doc_2": "Information not available for bid_doc_2.",
      "BOM_SHEET_NAME": "Information not available for BOM_SHEET_NAME.",
      "SOW_summary": "No summary available.",
      "SOW_fileName": "Document name not available",
      "VendorA_Bid_fileName": "Bid Template - General - Acme Associates R2.xlsx",
      "VendorB_Bid_fileName": "Bid Template-Fixed Rates-Wah Loon-R2_SIN061 - Fencing Work.xlsx",
      "VendorB_Bid_price_breakdown": "{\"totalCost\":140240,\"currency\":\"SGD\",\"lineItems\":[{\"description\":\"Provision for project's consultant and authority submission\",\"unitCost\":20000,\"quantity\":1,\"totalCost\":23000},{\"description\":\"Design proposal and drawings preparation\",\"unitCost\":5000,\"quantity\":1,\"totalCost\":5750},{\"description\":\"Supply and install steel metal ramp c/w railing (appox 20 mtr)\",\"unitCost\":20000,\"quantity\":1,\"totalCost\":23000},{\"description\":\"Provision for access installation\",\"unitCost\":3000,\"quantity\":1,\"totalCost\":3450},{\"description\":\"Supply and install new gate , to match existing color\",\"unitCost\":10500,\"quantity\":1,\"totalCost\":12075}]}",
      "VendorB_Bid_deviations": "{\"summary\":\"The document does not explicitly mention any deviations or exceptions. However, there is a section for the supplier to list any inclusions, deviations, or exceptions.\",\"items\":[]}",
      "VendorB_Bid_schedule": "{\"projectStartDate\":\"45670\",\"projectEndDate\":null,\"milestones\":[]}",
      "VendorB_Bid_resources": "{\"summary\":\"The main resources required are materials, equipment, and labor for the various construction and installation tasks listed in the Bill of Materials.\",\"items\":[\"Construction materials (steel, concrete, electrical components, etc.)\",\"Equipment for demolition, installation, concrete work\",\"Labor for installation, electrical work, project management, etc.\"]}"
    },
    "errors": [
      {
        "inputName": "LSK_Bid",
        "errorInfo": {
          "Error": "Unknown Error",
          "Cause": "Analysis task failed without specific error details."
        }
      },
      {
        "inputName": "SOW",
        "errorInfo": {
          "Error": "Unknown Error",
          "Cause": "Analysis task failed without specific error details."
        }
      }
    ],
    "warningCount": 2
  },
  "finalPromptResult": {
    "completion": "## Bid Analysis Summary\n\n### 1. Price Comparison\n- **Acme Associates R2**: SGD 122,560\n- **Wah Loon**: SGD 140,240\n- **Difference**: SGD 17,680 (14.4% higher for Wah Loon)\n\n### 2. Technical Compliance\n**Key Components Comparison:**\n- **Design/Documentation**:\n  - Acme: More detailed breakdown of preparation work\n  - Wah Loon: Combined design and consultation costs\n- **Installation Work**:\n  - Acme: Includes detailed temporary hoarding and cable detection\n  - Wah Loon: More comprehensive gate installation scope\n\n### 3. Schedule Analysis\n- **Acme**: Provides clear end date (91/2024)\n- **Wah Loon**: Missing project end date (risk factor)\n- **Start Date Difference**: 165 days later for Wah Loon\n\n### 4. Risk Assessment\n**Advantages Acme:**\n- Lower price point\n- Clear project timeline\n- Detailed scope breakdown\n\n**Advantages Wah Loon:**\n- More comprehensive resource listing\n- Detailed construction material specifications\n\n## Recommendation\n**Recommended Vendor: Acme Associates R2**\n\nJustification:\n1. 14.4% more cost-effective\n2. Clear project timeline\n3. More detailed scope breakdown\n4. Includes additional services (cable detection, temporary hoarding)\n\n**Required Actions:**\n1. Verify Acme's resource allocation details\n2. Confirm material specifications match requirements\n3. Validate start date format (45505)",
    "sessionId": "session-1742640670258-lpu7f4p6"
  }
};

// Log the completion data
console.log('Completion data:');
console.log(statusResponse.completion);

// In a real application, this data would be processed by the useChatMessages hook
// and displayed in the message component.
console.log('\nIn the application, this completion data would be displayed in the message.');
