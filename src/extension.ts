// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    const provider = new DocumentationViewProvider();
    let viewType = "reactdocs.documentation";
    let disposable = vscode.window.registerWebviewViewProvider(viewType, provider);
    context.subscriptions.push(disposable);
}

class DocumentationViewProvider implements vscode.WebviewViewProvider{
    private disposables: vscode.Disposable[] = [];
    private view?: vscode.WebviewView;
    private viewType: string = "reactdocs.documentation";

    constructor() {
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
                    const html = await this.indexServer(currentSelectedWords);
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
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>React Documentation</title>
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
    async indexServer(words: string) {
        const url = "https://reactdocs-server-1.vercel.app/api/";
        const body = {
            "name": words
        };
        const resp: { data: ReferenceResponse } = await axios.post(url, body);
        if (resp.data.success) {
            return this.buildHtml(resp.data.data.link, resp.data.data.docstring);
        }
        return "";
    }

    buildHtml(link: string, docstring: string) {
        docstring += `[Read More ...](${link})`;
        var showdown = require('showdown');
        var converter = new showdown.Converter();
        return converter.makeHtml(docstring);
    }
}


export function deactivate() {}
