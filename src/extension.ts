// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { env, window, commands, ExtensionContext } from 'vscode';

import { getHuggingFaceRepository } from './utils';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "HuggingFace repo" is now active!');

	const uri = await getHuggingFaceRepository();

	if (uri) {
		console.log(`Hugging Face repository found: ${uri.toString()}`);
	}

	commands.executeCommand('setContext', 'isHuggingFaceRepo', !!uri);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = commands.registerCommand('huggingface.openRepo', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		if (uri) {
			// window.showInformationMessage(`Opening Hugging Face repository: ${uri.toString()}`);
			env.openExternal(uri);
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
