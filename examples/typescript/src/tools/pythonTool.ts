import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as util from 'util';
import { buildToolResponse } from '../utils/jupyter/notebookUtils';

const execAsync = util.promisify(exec);

/**
 * Executes Python code in a notebook.
 * @param args - The input arguments for executing the Python code.
 * @param args.input - The Python code to execute.
 * @returns A Promise that resolves to the tool response as a JSON string.
 */
export async function executePythonInNotebook(args: { input: string }): Promise<string> {
  const tmpDir = os.tmpdir();
  const notebookName = 'py';
  const notebookPath = path.join(tmpDir, `${notebookName}.ipynb`);
  const outputDir = path.join(tmpDir, 'output');
  const input = args.input;

  try {
    await createNotebook(notebookPath, input);
    await fs.promises.mkdir(outputDir, { recursive: true });

    const executionResult = await executeNotebookInDocker(tmpDir, notebookName, outputDir);
    console.log(`Execution result: ${executionResult}`);

    const toolResponse = await buildToolResponse(executionResult, outputDir);
    return JSON.stringify(toolResponse);
  } catch (error) {
    console.error(`Error executing python in notebook: ${error}`);
    return `Error executing python in notebook, fix and try again: ${error}`;
  } finally {
    await fs.promises.unlink(notebookPath);
    // Optionally, delete the output notebook to save space
  }
}

/**
 * Creates a notebook file at the specified path with the given input.
 * @param notebookPath - The path where the notebook file will be created.
 * @param input - The input code to be added to the notebook.
 * @returns A Promise that resolves when the notebook file is successfully created.
 */
async function createNotebook(notebookPath: string, input: string): Promise<void> {
  console.log(`\nCreating notebook at ${notebookPath}`);
  
  const basicNotebookContent = {
    "cells": [
      {
        "cell_type": "code",
        "execution_count": null,
        "metadata": {},
        "outputs": [],
        "source": [input]
      }
    ],
    "metadata": {},
    "nbformat": 4,
    "nbformat_minor": 4
  };
  await fs.promises.writeFile(notebookPath, JSON.stringify(basicNotebookContent));
}

/**
 * Executes a Jupyter notebook in a Docker container.
 * 
 * @param tmpDir - The temporary directory path.
 * @param notebookName - The name of the notebook to execute.
 * @param outputDir - The output directory path.
 * @returns A Promise that resolves to the stdout of the notebook execution.
 * @throws If there is an execution error, the function throws an Error with the error message.
 */
async function executeNotebookInDocker(tmpDir: string, notebookName: string, outputDir: string): Promise<string> {
  const imageName = 'jupyter-runtime';
  const executionPath = `/app/${notebookName}.ipynb`;
  const outputPath = `/app/${notebookName}_output.ipynb`;
  const dockerCommand = [
    "docker run --rm",
    `-v "${tmpDir}:/app"`,
    `-v "${outputDir}:/mnt/data"`,
    imageName,
    "/bin/bash -c",
    `"xvfb-run -a jupyter nbconvert --to notebook --execute ${executionPath} --output ${outputPath} && cat ${outputPath}"`
  ].join(" ");

  console.log(`Executing notebook ${notebookName} in Docker container ${imageName}`)

  // Jupyter notebook execution may return log output in stderr, throw for now
  // Might be beneficial to parse status at some point in case of "busy" or "idle",
  // though this is not necessary for this example
  const { stdout, stderr } = await execAsync(dockerCommand);
  if ((!stdout || stdout === '') && stderr) {
    throw new Error(`Execution error: ${stderr}`);
  }

  return stdout;
}