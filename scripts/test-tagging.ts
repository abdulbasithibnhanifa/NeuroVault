// scripts/test-tagging.ts
import { TaggingService } from '../services/ai/taggingService';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testTagging() {
  const taggingService = new TaggingService();
  const userId = "test-user-id";
  const sampleText = `
    Quantum computing is an emerging field of physics and computer science. 
    It leverages quantum mechanics to solve complex problems faster than classical computers. 
    Key concepts include qubits, superposition, and entanglement. 
    Companies like Google, IBM, and Rigetti are leading the race to build a fault-tolerant quantum computer.
    This technology could revolutionize cryptography, drug discovery, and materials science.
  `;

  console.log("--- TESTING AUTOMATIC TAGGING ---");
  console.log("Input Text Snippet: " + sampleText.substring(0, 100).trim() + "...");

  try {
    const analysis = await taggingService.generateAnalysis(sampleText, userId);
    
    console.log("\n--- RESULT ---");
    console.log("Summary: " + analysis.summary);
    console.log("Tags:", analysis.tags);
    console.log("Tag Count:", analysis.tags.length);

    if (analysis.tags.length >= 3 && analysis.tags.length <= 5) {
      console.log("\n✅ SUCCESS: Tag count is within the desired range (3-5).");
    } else {
      console.log("\n❌ FAILURE: Tag count is " + analysis.tags.length + " (Expected 3-5).");
    }

    if (analysis.summary.length > 20) {
      console.log("✅ SUCCESS: Summary generated correctly.");
    } else {
      console.log("❌ FAILURE: Summary is too short or empty.");
    }

  } catch (error: any) {
    console.error("❌ ERROR:", error.message);
  }
}

testTagging();
