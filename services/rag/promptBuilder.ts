import { RetrievalResult } from "./retrievalService";

/**
 * Service for constructing LLM prompts with retrieved document context.
 */
export class PromptBuilder {
  /**
   * Constructs a grounded prompt based on the user's question and retrieved chunks.
   * @param question The user's original question.
   * @param chunks Array of retrieved document chunks.
   * @returns A formatted prompt string.
   */
  buildPrompt(question: string, chunks: RetrievalResult[], strict: boolean = true): string {
    const context = chunks
      .map((chunk, index) => `<document_chunk id="${index + 1}">\n${chunk.text}\n</document_chunk>`)
      .join("\n");

    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const systemInfo = `Current Context: Today is ${currentDate}, and the local time is ${currentTime}. Use this information to resolve temporal terms like "today", "yesterday", or numerical dates.`;

    if (strict) {
      return `Instructions: Answer the user's question using ONLY the provided context blocks below. 
${systemInfo}

If the context does not contain relevant information to answer the question, say "I do not have enough information in my knowledge vault to answer this." 
Do NOT use outside knowledge for facts, but you may use common sense and temporal logic to connect the current date to the context.

<context>
${context}
</context>

<question>
${question}
</question>

Final Answer:`;
    } else {
      return `Instructions: You are a helpful AI assistant. Use the provided context blocks to ground your answer. 
${systemInfo}

You may supplement with your own knowledge if the context is insufficient, but prioritize the provided information.

<context>
${context}
</context>

<question>
${question}
</question>

Final Answer:`;
    }
  }

}
