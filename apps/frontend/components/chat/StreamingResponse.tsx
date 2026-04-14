import React, { useEffect, useState } from 'react';

/**
 * Props for the StreamingResponse component
 */
interface StreamingResponseProps {
  stream: ReadableStream;
  onUpdate: (content: string) => void;
  onComplete: () => void;
}

/**
 * StreamingResponse Component - Reads from a ReadableStream and updates state token-by-token.
 */
const StreamingResponse: React.FC<StreamingResponseProps> = ({ stream, onUpdate, onComplete }) => {
  const [accumulatedContent, setAccumulatedContent] = useState('');

  useEffect(() => {
    let isMounted = true;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    const decoder = new TextDecoder();
    let lineBuffer = '';

    async function processStream() {
      try {
        // Prevent "locked reader" error if effect re-runs before cleanup
        if (stream.locked) return;
        
        reader = stream.getReader();

        while (isMounted) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          lineBuffer += chunk;
          
          const lines = lineBuffer.split('\n');
          // Keep the last partial line in the buffer
          lineBuffer = lines.pop() || '';

          let textBuffer = '';
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

            if (trimmedLine.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmedLine.slice(6));
                const content = json.choices[0]?.delta?.content || "";
                textBuffer += content;
              } catch (e) {
                // Partial JSON, though line buffering should prevent most cases
              }
            } else {
              textBuffer += trimmedLine;
            }
          }

          if (textBuffer && isMounted) {
            setAccumulatedContent(prev => {
              const next = prev + textBuffer;
              onUpdate(next);
              return next;
            });
          }
        }
      } catch (error: any) {
        if (isMounted && error.name !== 'AbortError') {
          console.error('Error reading stream:', error);
        }
      } finally {
        if (isMounted) {
          onComplete();
        }
        if (reader) {
          try {
            reader.releaseLock();
          } catch (e) {}
        }
      }
    }

    processStream();

    return () => {
      isMounted = false;
      if (reader) {
        reader.cancel().catch(() => {});
      }
    };
  }, [stream, onUpdate, onComplete]);

  return <span className="animate-pulse">...</span>;
};

export default StreamingResponse;
