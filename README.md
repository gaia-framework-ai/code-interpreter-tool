# GAIA Framework - Code Interpreter Tool

[![CI](https://github.com/gaia-framework-ai/code-interpreter-tool/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/gaia-framework-ai/code-interpreter-tool/actions/workflows/build.yml)

An open source version of the flow used to create a basic python code interpreter tool, used similarly within the currently unreleased `gaia-framework` and able to run and test with locally using Docker

This tool aims to act similarly with basic functionality to the `code interpreter` tool that ChatGPT uses to execute python code. In this example, it's ran as a non-stateful jupyter notebook environment that allows execution of python code including internet access and allows for persisting of files to local, blob, or other storage locations depending on the setup. Though, it can be easily extended to support stateful execution as needed and left as a non-stateful tool here for simplicity.

**Models tested**:

- `GPT` models that support tool execution but best with `gpt-4` models

- `claude-3` models that support tool execution using the new Tools Beta, though requires some additional prompting in the system instructions to get claude to perform similary to GPT

**Examples using the tool**:

- Currently only an example with `GPT` using the [OpenAI Node API](https://www.npmjs.com/package/openai)

- See the [Running Examples](#running-examples) section

**How the tool works**:

An LLM such as GPT or Claude decides to call the code-interpreter tool and passes either generated or user-provided code as an argument to the tool. The tool then executes it as a script in a docker container with a short-lived lifetime, only spun up to execute the script and is removed afterwards.

This script executed is written in python and saved to a temp directory, mounted to the conatainer on startup and to be executed in a jupyter notebook environment like below:

```typescript
const imageName = 'jupyter-runtime';
const executionPath = `/app/${notebookName}.ipynb`;
const outputPath = `/app/${notebookName}_output.ipynb`;
const dockerCommand = [
  "docker run --rm",
  `-v "${tmpDir}:/app"`,
  `-v "${outputDir}:/mnt/data"`, // Used to save and persist user files & output
  imageName,
  `/bin/bash -c "xvfb-run -a jupyter nbconvert --to notebook --execute ${executionPath} --output ${outputPath} && cat ${outputPath}"`
].join(" ");
```

- A Jupyter Notebook environment is used for executing the script because it provides a convenient and automated way to run Python code, retrieve outputs, and persist files using an LLM

  - Due to the nature of .ipynb files being in JSON and the way outputs are structured after execution, we can take advantage of that and use it as an execution environment, parsing its output to understand the results and post-execution processing

  - This allows use cases such as accessing persisted user files, image data, or other output data similar to ChatGPT's code interpreter and returning the results back to the LLM

    - Depending on the `output_type` of a notebook cell, we can access paths to the persisted files such as `/mnt/data/test.txt` or raw base64 image data directly, which can then be retrieved and uploaded to blob storage or other options

- Docker must already be running on the machine the code is executing on

  - Depending on the system/architecture where the tool is used and ran, options like Azure Container Instances (ACI) or others can be used in place of Docker
  
  - One approach would be to have some sort of orchestration service/tool to determine whether to use Docker, ACI, or some other provider depending on a parameter or local vs production environment

- Any files persisted to `/mnt/data/` are shared with the output directory and since this example is a non-stateful jupyter environment, that output directory is used to retrieve and upload persisted items to external storage (or access from the mounted output directory itself if accessible)

  - If its changed to run in a stateful environment, determining when and how files persisted to /mnt/data/ are uploaded to external storage can be updated depending on the preference

- **Security Considerations**:

  When implementing this tool in your own projects, consider the following security measures:

  - **Input Sanitization:** Ensure all user inputs are sanitized to prevent injection attacks

  - **Execution Environment:** Execute code within a secure, isolated sandbox environment

  - **Resource Limits:** Set strict limits on CPU, memory, and execution time to avoid system strain

  - **Feature Restrictions:** Disable unnecessary features to minimize potential attack surfaces

  - **Error Handling:** Configure error handling to avoid revealing sensitive information
 
- See the full implementation of the tool [here](https://github.com/gaia-framework-ai/code-interpreter-tool/blob/main/examples/typescript/src/tools/pythonTool.ts)

## Example flow

1. User prompts LLM to create a script and execute it

2. LLM decides to call tool

3. LLM executes tool with code as the input and result is created based on the notebook response

4. (Optional) Before sending results to LLM, parse the notebook output and upload any persisted files to local or external storage

    - Alternatively, an LLM can be prompted in its system instructions or user message to call another tool that uploads files persisted in the evironment to local/external storage

      - This could be done using the mounted output folder or if stateful, accessing whats in /mnt/data/ directly to upload

    - In this example, we parse the notebook output after execution and return the local output filePath

      - If we were to upload to blob storage instead of currently returning the output filePath, we'd return the blob url generated from the upload instead

5. LLM receives and processes results then returns response to user, or tries to fix errors with the tool call if any up to 3 retries

    - The *runTools(...)* method from the [OpenAI Node API](https://www.npmjs.com/package/openai) simplifies tool calling and feeding in errors to fix for us in the `example_openai.ts` code along with system instructions for GPT

    - At this time a custom feedback loop is needed when attempting this flow with Claude

6. User receives response, including the link to the path where files were persisted (if any) or the results of the execution in general

    - If files were generated during the execution but weren't uploaded to local/external storage in an intermediary step, the response will include the inaccessible file path within the environment, such as `/mnt/data/test.txt`, instead of a publicly accessible URL like `someblobstorageurl.com/path/to/file/test.txt`.

See [Example Run Outputs](#example-run-outputs)

## Running Examples

### Build the Image

For the tool to execute properly the docker image must be built first:

1. Start docker

2. Navigate to the `environments/jupyter` folder in terminal

3. Run the following comand:

      ```bash
      docker build -t jupyter-runtime .
      ```

### Run Typescript Console Example

1. Navigate to `examples/typescript/console` in terminal

2. Create a `.env` file based on the `.env.example` and add your value for the `OPENAI_API_KEY`

3. Run the following commands sequentially:

    ```bash
    yarn install
    yarn build
    yarn start
    ```

4. Enter a prompt that would make GPT choose the tool
   - e.g., `execute a python script to add two numbers together and show the result`

### Run Typescript Discord Bot Example

1. Setup a Bot on the Discord Developer Portal: <https://discord.com/developers/applications>

2. Navigate to `examples/typescript/discordbot` in terminal

3. Create a `.env` file based on the `.env.example` and add your value for the `OPENAI_API_KEY`

    - (Optional) To connect to Azure Blob storage, provide values for the additional following keys, assuming Azure Blob Storage is already configured in your Azure subscription (see [Microsofts Quickstart](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-portal))

      - `AZURE_STORAGE_CONNECTION_STRING` - The connection string to your Azure Storage resource

      - `AZURE_BLOB_CONTAINER_NAME` - The name of your blob container

      - `AZURE_STORAGE_ACCOUNT_NAME` - The name of the Azure Storage account

      - `AZURE_STORAGE_ACCOUNT_KEY` - The account key of the Azure Storage account

4. Run the following commands sequentially:

    ```bash
    yarn install
    yarn build
    yarn start
    ```

5. Start a chat with your bot using its username

6. Enter a prompt to your bot in Discord that would make GPT choose the tool
   - e.g., `execute a python script to do something cool and display it`

## Example Run Outputs

View [output examples](docs/output_examples.md) to see example run outputs using the tool with `.runTools(...)` from the [OpenAI Node API](https://www.npmjs.com/package/openai) for easy usage and handling tool errors

- If there's an error in the tool call, returning a string of the error back as the tool response can enable GPT to try and fix errors on its own

## Ethical Use Guidelines

This open-source tool is provided with the intent to foster innovation and aid in development, particularly in educational, research, and development contexts. Users are urged to utilize the tool responsibly and ethically. Here are some guidelines to consider:

- **Responsible Usage**: Ensure that the use of this tool does not harm individuals or groups. This includes avoiding the processing or analysis of data in ways that infringe on privacy or propagate bias.

- **Prohibited Uses**: Do not use this tool for:
  - Illegal activities
  - Creating or spreading malware
  - Conducting surveillance or gathering sensitive data without consent
  - Activities that could cause harm, such as cyberbullying or online harassment

- **Transparency**: Users should be transparent about how scripts are generated and used, particularly when the outputs are shared publicly or used in decision-making processes.

- **Data Privacy**: Be mindful of data privacy laws and regulations. Ensure that any data used with this tool complies with relevant legal standards, such as GDPR in Europe, CCPA in California, etc.

- **Intellectual Property**: Respect the intellectual property rights of others. Ensure that all content processed by or generated with this tool does not violate copyrights or other intellectual property laws.

- **Quality Control**: Regularly review and test the code executed by this tool to ensure its accuracy and reliability, especially when used in critical or production environments.

## Reporting Issues

If you encounter any issues or bugs while using this tool, please report them via [GitHub Issues](https://github.com/gaia-framework-ai/code-interpreter-tool/issues).

## License

This project is licensed under the MIT license, see the [LICENSE](LICENSE) file included with the project.

## Contributions

Coming soon
