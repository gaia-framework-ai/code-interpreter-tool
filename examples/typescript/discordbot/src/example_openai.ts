import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { executePythonInNotebook } from './tools/pythonTool';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const chatHistory: ChatCompletionMessageParam[] = [];

/**
 * Runs an example using OpenAI.
 * This function executes Python code in a Jupyter notebook environment using OpenAI's GPT model.
 * It prompts the user for a query, sends the query to the GPT model along with previous chat history,
 * and displays the response from the GPT model.
 */
export async function getBotResponse(input: string) {
  const executePythonSchema = {
    "description": "Execute python in a jupyter notebook environment",
    "parameters": {
      "type": "object",
      "properties": {
        "input": {
          "type": "string",
          "description": "The code content to execute in the runtime execution environment"
        }
      },
      "required": ["input"],
    }
  };

  const instructions = `You are a Discord Bot GPT that has a tool to execute Python code. Here are the instructions for the python tool: 
  -  When you send a message containing Python code to python, it will be executed in a non-stateful Jupyter notebook environment. Python will respond with the output of the execution and path to file if one exists. No timeout exists. The drive at '/mnt/data' can be used to save and persist user files. Internet access for this session is enabled, if needed or requested.
  
  - On errors of tool calls, try 3 times to fix the error if the tool response results in an error. If an error persists, let the user know.`;

  chatHistory.push({
    role: 'user',
    content: input
  });

  // Note: remove chat history if you want a clear chat history for each query
  // and just use instructions + user input as the query messages
  const queryMessages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: instructions
    },
    ...chatHistory
  ];

  const runner = await client.beta.chat.completions
    .runTools({
      model: 'gpt-4-turbo',
      messages: queryMessages,
      tools: [
        {
          type: 'function',
          function: {
            function: executePythonInNotebook,
            parse: JSON.parse,
            ...executePythonSchema,
          },
        }
      ],
    });

  runner.on('message', (message) => {
    console.log(message);
    chatHistory.push(message);
  });

  const finalContent = await runner.finalContent();
  return finalContent;
}