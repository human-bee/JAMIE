Agentic RAG (with visuals)

Traditional RAG has many issues:

- It retrieves once and generates once. If the context isn't enough, it cannot dynamically search for more info.

- It cannot reason through complex queries.

- The system can't modify its strategy based on the problem.

Agentic RAG attempts to solve this by introducing intelligent agents that can make decisions, adapt strategies, and iterate until finding the best answer. Unlike traditional RAG's linear process, it creates a dynamic, self-correcting system that can:
- Rewrite and refine queries
- Choose the most appropriate data sources
- Verify answer quality
- Try different approaches if initial attempts fail

The following visual depicts how it differs from traditional RAG.

![Traditional RAG vs Agentic RAG: A comparison showing how Traditional RAG follows a simple linear process, while Agentic RAG introduces intelligent agents that can dynamically adapt, verify, and iterate through multiple data sources until finding the best answer. Traditional RAG (top) shows a 7-step linear workflow, while Agentic RAG (bottom) shows a 12-step intelligent system with feedback loops and decision points.](./assets/Traditional-RAG-vs-Agentic-RAG.png)

The core idea is to introduce agentic behaviors at each stage of RAG. 

Steps 1-2) An agent rewrites the query (removing spelling mistakes, etc.)

Step 3-8) An agent decides if it needs more context.

↳ If not, the rewritten query is sent to the LLM.
↳ If yes, an agent finds the best external source to fetch context, to pass it to the LLM.

Step 9) We get a response.

Step 10-12) An agent checks if the answer is relevant.

↳ If yes, return the response.
↳ If not, go back to Step 1.

This continues for a few iterations until we get a response or the system admits it cannot answer the query.
This makes RAG more robust since agents ensure individual outcomes are aligned with the goal.