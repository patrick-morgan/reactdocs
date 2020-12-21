// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import axios from 'axios';

import { Remarkable } from 'remarkable';
import hljs = require('highlight.js');
import {existsSync} from 'fs';
import {promises as fsPromises} from 'fs'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const provider = new DocumentationViewProvider(context.extensionPath);
    let viewType = "reactdocs.documentation";
    let disposable = vscode.window.registerWebviewViewProvider(viewType, provider);
    context.subscriptions.push(disposable);
}

class DocumentationViewProvider implements vscode.WebviewViewProvider{
    private disposables: vscode.Disposable[] = [];
    private view?: vscode.WebviewView;
    private viewType: string = "reactdocs.documentation";
    private _extensionPath: string = "";

    constructor(extensionPath: string) {
        this._extensionPath = extensionPath;

        vscode.window.onDidChangeActiveTextEditor(() => {
            this.update();
        }, null, this.disposables);
        vscode.window.onDidChangeTextEditorSelection(() => {
            this.update();
        }, null, this.disposables);
    }

    // TODO: figure out if we need to implement
    dispose() {}

    // Called when a view first becomes visible
    // (happens when view is first loaded/user hides and then shows the view again)
    resolveWebviewView(
        webviewView: vscode.WebviewView, 
        context: vscode.WebviewViewResolveContext, 
        token: vscode.CancellationToken
    ){
        webviewView.webview.options = {
            enableScripts: true
        };
        this.view = webviewView;
        webviewView.webview.html = this.loadWebviewHtml();
        this.update();
    }

    async update() {
        if (!this.view) {
            return;
        }

        // Get words highlighted by cursor
        const editor = vscode.window.activeTextEditor;
        // check if there is a selection
        if (editor && !editor.selection.isEmpty) {
            let currentSelectedWords: string = editor.document.getText(editor.selection);
            const timer = setTimeout(async () => {
                const newEditor = vscode.window.activeTextEditor;
                if (newEditor && currentSelectedWords === newEditor.document.getText(newEditor.selection)) {
                    const html = await this.queryDocsData(currentSelectedWords);
                    // send messsage to webview
                    if (html.length > 0) {
                        this.view?.webview.postMessage({
                            body: html
                        });
                        this.view?.show(true);
                    } else {
                        this.view?.webview.postMessage({
                            body: "No documentation found"
                        });
                    }
                }
            }, 500);
        }

    }

    loadWebviewHtml() {
        const onDiskPath = vscode.Uri.file(
            path.join(this._extensionPath, 'node_modules', 'highlight.js', 'styles', 'vs2015.css')
        );
        const syntaxHighlightingStyles = this.view?.webview.asWebviewUri(onDiskPath);
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>React Documentation</title>
            <link href="${syntaxHighlightingStyles}" rel="stylesheet">
            <style>
                pre:first-child { font-size: 2em; font-weight: bold; }
                pre:not(:first-child) { background-color: #0F0F0F; padding: 10px; border-radius: 10px; overflow-x: auto; }
                blockquote { width: calc(100% - 20px); margin: 0; padding: 5px 10px; border-radius: 10px; }
            </style>
        </head>
        <body>
            <div id="doc">No documentation found</div>
            <script type="text/javascript">
                const doc = document.getElementById('doc');
                window.addEventListener('message', event => {
                    doc.innerHTML = event.data.body;
                });
            </script>
        </body>
        </html>`;
    }

    // function queries server, and returns html
    async queryDocsData(highlightedContent: string) {
        const url = "https://reactdocs-server-1.vercel.app/api/";

        var docFilePath = `${__dirname}/docs.json`;

        // Create file if doesn't exist
        if (!existsSync(docFilePath)) {
            const resp: { data: ReferenceResponse } = await axios.get(url);
            if (resp.data.success) {
                const file = await fsPromises.writeFile(docFilePath, JSON.stringify(resp.data.data), 'utf-8');
            } else {
                return "";
            }
        }
        const docData = await this.readFile(docFilePath, highlightedContent);

        if (docData.length) {
            return this.buildHtml(docData[0], docData[1]);
        }
        return "";
    }

    async readFile(docFilePath: string, highlightedContent: string) {
        const file = await fsPromises.readFile(docFilePath, 'utf-8');
        // file contains 'data', iterate through it and return
        const docs = await JSON.parse(file);
        
        if (docs[highlightedContent]) {
            return [docs[highlightedContent]["link"], docs[highlightedContent]["docstring"]];
        } 
        return [];
    }

    buildHtml(link: string, docstring: string) {
        docstring += `[Read More ...](${link})`;
        const md = new Remarkable({
            highlight: (str: string, lang: string) => {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(lang, str).value;
                    } catch (err) {}
                }
            
                try {
                    return hljs.highlightAuto(str).value;
                } catch (err) {}
            
                return ''; // use external default escaping
            }
        });
        console.log(md.render(docstring));
        return md.render(docstring);
    }
}


export function deactivate() {}
