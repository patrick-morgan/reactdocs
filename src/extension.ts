// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage('out here!');

	// Get words cursor is highlighting
	// NEED TO DO STUFF INSIDE HERE ASYNCHRONOUSLY
	vscode.window.onDidChangeTextEditorSelection(() => {
		// get current editor
		const editor = vscode.window.activeTextEditor;
		// check if there is a selection
		if(editor){
			if(!editor.selection.isEmpty){
				let currentSelectedWords = editor.document.getText(editor.selection);
				const timer = setTimeout(() => {
					const newEditor = vscode.window.activeTextEditor;
					if(newEditor){
						if(currentSelectedWords == newEditor.document.getText(newEditor.selection)){
							vscode.window.showInformationMessage(currentSelectedWords);
		
							// Create instance of Documentation Provider which overloads Documentation
							// Webview Provider
							const provider = new DocumentationViewProvider();
							let viewType = "reactdocs.documentation";
							let disposable = vscode.window.registerWebviewViewProvider(viewType, provider);
				
							context.subscriptions.push(disposable);
						}
					}
				}, 500);
				// timer();
			}
		}
	}, null, context.subscriptions)
}

class DocumentationViewProvider implements vscode.WebviewViewProvider{
	public resolveWebviewView(
		webviewView: vscode.WebviewView, 
		_context: vscode.WebviewViewResolveContext, 
		_token: vscode.CancellationToken
	){
		webviewView.webview.html = queryDatabase();
	}
}

// function queries database
function queryDatabase() {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cat Coding</title>
  </head>
  <body>
	  <p>hiiiiii</p>
  </body>
  </html>`;
  }

// this method is called when your extension is deactivated
export function deactivate() {}
