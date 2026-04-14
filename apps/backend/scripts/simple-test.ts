async function simpleTest() {
  const videoId = 'dQw4w9WgXcQ';
  console.log(`Testing video: ${videoId}`);
  
  try {
    console.log('--- Testing yt-caption-kit ---');
    const { YtCaptionKit } = await import('yt-caption-kit');
    const kit = new YtCaptionKit();
    const result = await kit.fetch(videoId, { languages: ['en'] });
    console.log(`yt-caption-kit success: ${result.snippets.length} snippets`);
  } catch (e: any) {
    console.log(`yt-caption-kit failed: ${e.message}`);
  }

  try {
    console.log('--- Testing youtube-transcript ---');
    const { YoutubeTranscript } = await import('youtube-transcript');
    const result = await YoutubeTranscript.fetchTranscript(videoId);
    console.log(`youtube-transcript success: ${result.length} items`);
  } catch (e: any) {
    console.log(`youtube-transcript failed: ${e.message}`);
  }
}

simpleTest();
