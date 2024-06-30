// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { env, window, commands, ExtensionContext, Disposable, extensions } from 'vscode';

import { DisposableStore, getHuggingFaceRepository, repositoryHasHuggingFaceRemote } from './utils';
import { API, GitExtension } from './typings/git';
import { registerCommands } from './commands';

// This method is called when your extension is deactivated
export function deactivate() { }

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "HuggingFace repo" is now active!');

	const disposables: Disposable[] = [];
	context.subscriptions.push(new Disposable(() => Disposable.from(...disposables).dispose()));

	disposables.push(initializeGitExtension());

	// const uri = await getHuggingFaceRepository();

	// if (uri) {
	// 	console.log(`Hugging Face repository found: ${uri.toString()}`);
	// }

	// commands.executeCommand('setContext', 'isHuggingFaceRepo', !!uri);

	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// const disposable = commands.registerCommand('huggingface.openRepo', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user

	// 	if (uri) {
	// 		// window.showInformationMessage(`Opening Hugging Face repository: ${uri.toString()}`);
	// 		env.openExternal(uri);
	// 	}
	// });

	// context.subscriptions.push(disposable);
}

function initializeGitExtension() {
	const disposables = new DisposableStore();

	let gitExtension = extensions.getExtension<GitExtension>('vscode.git');

	const initialize = () => {
		gitExtension!.activate()
			.then(extension => {
				const onDidChangeGitExtensionEnablement = (enabled: boolean) => {
					if (enabled) {
						const gitAPI = extension.getAPI(1);

						disposables.add(registerCommands(gitAPI));
						// disposables.add(new GitHubCanonicalUriProvider(gitAPI));
						// disposables.add(new VscodeDevShareProvider(gitAPI));
						setHuggingFaceContext(gitAPI, disposables);

						// commands.executeCommand('setContext', 'git-base.gitEnabled', true);
					} else {
						disposables.dispose();
					}
				};

				disposables.add(extension.onDidChangeEnablement(onDidChangeGitExtensionEnablement));
				onDidChangeGitExtensionEnablement(extension.enabled);
			});
	};

	if (gitExtension) {
		initialize();
	} else {
		const listener = extensions.onDidChange(() => {
			if (!gitExtension && extensions.getExtension<GitExtension>('vscode.git')) {
				gitExtension = extensions.getExtension<GitExtension>('vscode.git');
				initialize();
				listener.dispose();
			}
		});
		disposables.add(listener);
	}

	return disposables;
}

function setHuggingFaceContext(gitAPI: API, disposables: DisposableStore) {
	if (gitAPI.repositories.find(repo => repositoryHasHuggingFaceRemote(repo))) {
		commands.executeCommand('setContext', 'huggingface.hasHuggingFaceRepo', true);
	} else {
		const openRepoDisposable = gitAPI.onDidOpenRepository(async e => {
			await e.status();
			if (repositoryHasHuggingFaceRemote(e)) {
				commands.executeCommand('setContext', 'huggingface.hasHuggingFaceRepo', true);
				openRepoDisposable.dispose();
			}
		});
		disposables.add(openRepoDisposable);
	}
}