import { Cell, JupyterNotebook, Metadata } from "../types";

/**
 * Parses a Jupyter notebook JSON string into a structured `JupyterNotebook` object.
 */
export class NotebookParser {
  private notebook: JupyterNotebook;

  /**
   * Constructs an instance of `NotebookParser`.
   * @param notebookData The JSON string representing a Jupyter Notebook.
   */
  constructor(notebookData: string) {
    this.notebook = this.parseNotebook(notebookData);
  }

  /**
   * Parses the JSON string to a `JupyterNotebook` object.
   * @param notebookData The JSON string to parse.
   * @returns The parsed `JupyterNotebook` object.
   */
  private parseNotebook(notebookData: string): JupyterNotebook {
    return JSON.parse(notebookData);
  }

  /**
   * Retrieves the `JupyterNotebook` object.
   * @returns The `JupyterNotebook` object.
   */
  public getNotebook(): JupyterNotebook {
    return this.notebook;
  }

  /**
   * Retrieves the list of cells from the notebook.
   * @returns An array of `Cell` objects.
   */
  public getCells(): Cell[] {
    return this.notebook.cells;
  }

  /**
   * Retrieves the metadata of the notebook.
   * @returns The `Metadata` object of the notebook.
   */
  public getMetadata(): Metadata {
    return this.notebook.metadata;
  }

  /**
   * Retrieves the major version number of the notebook format.
   * @returns The major version number of the notebook format.
   */
  public getNbformat(): number {
    return this.notebook.nbformat;
  }

  /**
   * Retrieves the minor version number of the notebook format.
   * @returns The minor version number of the notebook format.
   */
  public getNbformatMinor(): number {
    return this.notebook.nbformat_minor;
  }
}