import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import readline from 'readline';
import { executePythonInNotebook } from './tools/pythonTool';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Runs an example using OpenAI.
 * This function executes Python code in a Jupyter notebook environment using OpenAI's GPT model.
 * It prompts the user for a query, sends the query to the GPT model along with previous chat history,
 * and displays the response from the GPT model.
 */
export async function runOpenAIExample() {
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

  const instructions = `You are a GPT that has a tool to execute Python code. Here are the instructions for the python tool: 
  -  When you send a message containing Python code to python, it will be executed in a non-stateful Jupyter notebook environment. Python will respond with the output of the execution and path to file if one exists. No timeout exists. The drive at '/mnt/data' can be used to save and persist user files. Internet access for this session is enabled, if needed or requested. Return all paths to output files in the response, including urls or paths from the tool response content that may be a local file path on a system, as well as the sandboxed environment. This includes any files saved to the '/mnt/data' directory as well as any other files created during the execution. The files in the tool response will be a blob url to the file, or a local file path on a system. You must return all paths to output files in the response.
  
  - On errors of tool calls, try 3 times to fix the error if the tool response results in an error. If an error persists, let the user know.`;

  const chatHistory: ChatCompletionMessageParam[] = [];

  const queryUser = async () => {
    rl.question('\nEnter your query or type "exit" to quit: ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

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
          model: 'gpt-4-0125-preview',
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
      console.log('\nGPT:\n', finalContent);

      queryUser();
    });
  };

  queryUser();
}