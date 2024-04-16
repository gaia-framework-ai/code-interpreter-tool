<!-- markdownlint-disable MD033 -->

# Example Run Output

Below are sample outputs from running the `example_openai.ts` code

## Example 1 - A simple script

GPT uses the tool to make a numerical calculation

<details>
  <summary>View example</summary>

```typescript
Enter your query or type "exit" to quit: execute script to add two numbers together

{
  role: 'system',
  content: 'You are a GPT that has a tool to execute Python code. Here are the instructions for the python tool: \n' +
    "  -  When you send a message containing Python code to python, it will be executed in a non-stateful Jupyter notebook environment. Python will respond with the output of the execution and path to file if one exists. No timeout exists. The drive at '/mnt/data' can be used to save and persist user files. Internet access for this session is enabled, if needed or requested."
}
{ role: 'user', content: 'execute script to add two numbers together' }
{
  role: 'assistant',
  content: null,
  tool_calls: [
    {
      id: '{tool_call_id}',
      type: 'function',
      function: [Object]
    }
  ]
}

Creating notebook at C:\Users\{username}\AppData\Local\Temp\py.ipynb
Executing notebook py in Docker container jupyter-runtime
Execution result: {
 "cells": [
  {
   "cell_type": "code",
   "execution_count": 1,
   "metadata": {
    "execution": {
     "iopub.execute_input": "2024-04-14T04:43:41.191877Z",
     "iopub.status.busy": "2024-04-14T04:43:41.191137Z",
     "iopub.status.idle": "2024-04-14T04:43:41.199479Z",
     "shell.execute_reply": "2024-04-14T04:43:41.198656Z"
    }
   },
   "outputs": [
    {
     "name": "stdout",
     "output_type": "stream",
     "text": [
      "The sum of 5 and 3 is 8\n"
     ]
    }
   ],
   "source": [
    "# This Python script adds two numbers together\n",
    "\n",
    "# Define the numbers to add\n",
    "number1 = 5\n",
    "number2 = 3\n",
    "\n",
    "# Calculate the sum\n",
    "sum = number1 + number2\n",
    "\n",
    "# Print the result\n",
    "print(f'The sum of {number1} and {number2} is {sum}')"
   ]
  }
 ],
 "metadata": {
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.9.19"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 4
}

{
  role: 'tool',
  tool_call_id: '{tool_call_id}',
  content: '{"textOutputs":["The sum of 5 and 3 is 8\\n"],"plainTextOutputs":[""]}'
}
{ role: 'assistant', content: 'The sum of 5 and 3 is 8.' }

GPT Response:
 The sum of 5 and 3 is 8.
```

</details>

## Example 2 - A script to write to a file

In this example, the `sandbox:/mnt/data/random_text.txt` is returned as the path since there was no intermediary step to upload the content to external storage. Feeding the blob or local url back to GPT in `toolResponse` instead of the local file path, GPT will return the correct downloadable url to the user in most cases.

- Typically it won't return the local file path such as C:\\\\users\\\\... without being asked or prompted in its system instructions (see *Example 3*)

<details>
  <summary>View example</summary>

```typescript
Enter your query or type "exit" to quit: Execute a python script to write something random to a text file and return the text file to the user

{
  role: 'system',
  content: 'You are a GPT that has a tool to execute Python code. Here are the instructions for the python tool: \n' +
    "  -  When you send a message containing Python code to python, it will be executed in a non-stateful Jupyter notebook environment. Python will respond with the output of the execution and path to file if one exists. No timeout currently exists. The drive at '/mnt/data' can be used to save and persist user files. Internet access for this session is enabled, if needed or requested."
}
{
  role: 'user',
  content: 'Execute a python script to write something random to a text file and return the text file to the user'
}
 {
  role: 'assistant',
  content: null,
  tool_calls: [
    {
      id: '{tool_call_id}',
      type: 'function',
      function: [Object]
    }
  ]
}

Creating notebook at C:\Users\{username}\AppData\Local\Temp\py.ipynb
Executing notebook py in Docker container jupyter-runtime
Execution result: {
 "cells": [
  {
   "cell_type": "code",
   "execution_count": 1,
   "metadata": {
    "execution": {
     "iopub.execute_input": "2024-04-14T06:14:39.337445Z",
     "iopub.status.busy": "2024-04-14T06:14:39.337239Z",
     "iopub.status.idle": "2024-04-14T06:14:39.351338Z",
     "shell.execute_reply": "2024-04-14T06:14:39.350597Z"
    }
   },
   "outputs": [
    {
     "data": {
      "text/plain": [
       "'/mnt/data/random_number.txt'"
      ]
     },
     "execution_count": 1,
     "metadata": {},
     "output_type": "execute_result"
    }
   ],
   "source": [
    "import random\n",
    "\n",
    "# Generate a random number between 1 and 100\n",
    "random_number = random.randint(1, 100)\n",
    "\n",
    "# Path to save the text file\n",
    "filename = '/mnt/data/random_number.txt'\n",
    "\n",
    "# Write the random number to a text file\n",
    "with open(filename, 'w') as file:\n",
    "    file.write(f'The random number is: {random_number}')\n",
    "\n",
    "filename"
   ]
  }
 ],
 "metadata": {
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.9.19"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 4
}

{
  role: 'tool',
  tool_call_id: '{tool_call_id}',
  content: '{"textOutputs":[],"plainTextOutputs":[["C:\\\\Users\\\\{username}\\\\AppData\\\\Local\\\\Temp\\\\output\\\\random_number.txt"]]}'
}
{
  role: 'assistant',
  content: "I've generated a random number and saved it to a text file. You can download the text file from the following link:\n" +
    '\n' +
    '[Download Random Number Text File](sandbox:/mnt/data/random_number.txt)'
}

GPT:
 Ive generated a random number and saved it to a text file. You can download the text file from the following link:

[Download Random Number Text File](sandbox:/mnt/data/random_number.txt)
```

</details>

## Example 3 - Return local path output on users machine

In this example the prompt is updated so GPT will ideally return the local path on the users machine to the output instead of just the sandboxed location. Since this example runs locally we can access the mounted 'output' folder contents directly. In advanced cases, uploading to blob storage and returning the url in the tool response will allow GPT to return the URL to that instead.

<details>
<summary>View example</summary>

```typescript
Enter your query or type "exit" to quit: execute a python script to show something cool
{
  role: 'system',
  content: 'You are a GPT that has a tool to execute Python code. Here are the instructions for the python tool: \n' +
    "  -  When you send a message containing Python code to python, it will be executed in a non-stateful Jupyter notebook environment. Python will respond with the output of the execution and path to file if one exists. No timeout exists. The drive at '/mnt/data' can be used to save and persist user files. Internet access for this session is enabled, if needed or requested. Return all paths to output files in the response, including urls or paths from the tool response content that may be a local file path on a system, as well as the sandboxed environment. This includes any files saved to the '/mnt/data' directory as well as any other files created during the execution. The files in the tool response will be a blob url to the file, or a local file path on a system. You must return all paths to output files in the response.\n" +
    '  \n' +
    '  - On errors of tool calls, try 3 times to fix the error if the tool response results in an error. If an error persists, let the user know.\n' +
    '  \n' +
    '  - If the tool response '
}
{
  role: 'user',
  content: 'execute a python script to show something cool'
}
{
  role: 'assistant',
  content: null,
  tool_calls: [
    {
      id: '{tool_call_id}',
      type: 'function',
      function: [Object]
    }
  ]
}

Creating notebook at C:\Users\{username}\AppData\Local\Temp\py.ipynb
Executing notebook py in Docker container jupyter-runtime
Execution result: {
 "cells": [
  {
   "cell_type": "code",
   "execution_count": 1,
   "metadata": {
    "execution": {
     "iopub.execute_input": "2024-04-14T16:10:08.137402Z",
     "iopub.status.busy": "2024-04-14T16:10:08.137006Z",
     "iopub.status.idle": "2024-04-14T16:10:09.239110Z",
     "shell.execute_reply": "2024-04-14T16:10:09.238200Z"
    }
   },
   "outputs": [
    {
     "data": {
      "image/png": "{generatedBase64ImageData}",
      "text/plain": [
       "<Figure size 1000x500 with 1 Axes>"
      ]
     },
     "metadata": {},
     "output_type": "display_data"
    }
   ],
   "source": [
    "# Importing required libraries\n",
    "import matplotlib.pyplot as plt\n",
    "import numpy as np\n",
    "\n",
    "# Generating data\n",
    "x = np.linspace(0, 20, 100)\n",
    "y = np.sin(x)\n",
    "\n",
    "# Plotting\n",
    "plt.figure(figsize=(10, 5))\n",
    "plt.plot(x, y, '-b', label='Sine Wave')\n",
    "plt.title('Cool Sine Wave')\n",
    "plt.xlabel('X axis')\n",
    "plt.ylabel('Y axis')\n",
    "plt.legend(loc='upper right')\n",
    "plt.grid(True)\n",
    "plt.show()"
   ]
  }
 ],
 "metadata": {
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.9.19"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 4
}

{
  role: 'tool',
  tool_call_id: '{tool_call_id}',
  content: '{"imageUrls":["C:\\\\Users\\\\{username}\\\\AppData\\\\Local\\\\Temp\\\\output\\\\image_0.png"],"textOutputs":[],"plainTextOutputs":[""]}'
}
{
  role: 'assistant',
  content: "I've created a cool visualization of a sine wave for you. Check out the plot below:\n" +
    '\n' +
    '![Cool Sine Wave](sandbox:C:\\Users\\{username}\\AppData\\Local\\Temp\\output\\image_0.png)\n' +
    '\n' +
    'This plot showcases a simple, yet elegant, sine wave which is a fundamental concept in various fields of science and engineering.'
}

GPT:
 I've created a cool visualization of a sine wave for you. Check out the plot below:

![Cool Sine Wave](sandbox:C:\Users\{username}\AppData\Local\Temp\output\image_0.png)

This plot showcases a simple, yet elegant, sine wave which is a fundamental concept in various fields of science and engineering.
```

</details>

## Example 4 - Utilizing the tool with a Discord Bot

In this example, a discord bot setup with GPT is configured to use the tool. After GPT responds with a url similarly to the examples above, it displays the message including a link to download the file if one is created. Which this case it returns a downloadable link to a blob storage where the file is uploaded to. Since discord supports displaying markdown, its shown nicely to the user compared to the standard CLI output.

<details>
<summary>View example</summary>

![image](https://github.com/gaia-framework-ai/code-interpreter-tool/assets/167034090/5f72ba9a-0be8-4531-aa5b-6f38c0c66d26)
</details>
