import { YoutubeProcessor } from '../services/documents/youtubeProcessor';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testYoutube() {
  const processor = new YoutubeProcessor();
  // Example video with English captions
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; 
  
  console.log('--- TESTING YOUTUBE TRANSCRIPTION ---');
  console.log(`Video URL: ${testUrl}`);
  
  try {
    const title = await processor.getVideoTitle(testUrl);
    console.log(`Title: ${title}`);
    
    const transcript = await processor.extractTranscript(testUrl);
    console.log(`Transcript Length: ${transcript.length}`);
    console.log(`Snippet: ${transcript.substring(0, 200)}...`);
    
    if (transcript.length > 0) {
      console.log('✅ SUCCESS: Transcript retrieved correctly.');
    } else {
      console.log('❌ FAILURE: Empty transcript retrieved.');
    }
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
  }
}

testYoutube();
