import { ExtensionContext, Disposable, extensions } from 'vscode';

import { DisposableStore } from './utils';
import { GitExtension } from './typings/git';
import { setHuggingFaceContext, registerCommands } from './commands';

export async function activate(context: ExtensionContext) {
    console.log('Extension "HuggingFace repo" is now active!');

    const disposables: Disposable[] = [];
    context.subscriptions.push(
        new Disposable(() => Disposable.from(...disposables).dispose()),
    );

    disposables.push(initializeGitExtension());
}

function initializeGitExtension() {
    const disposables = new DisposableStore();

    let gitExtension = extensions.getExtension<GitExtension>('vscode.git');

    const initialize = () => {
        gitExtension!.activate().then((extension) => {
            const onDidChangeGitExtensionEnablement = (enabled: boolean) => {
                if (enabled) {
                    const gitAPI = extension.getAPI(1);

                    disposables.add(registerCommands(gitAPI));
                    setHuggingFaceContext(gitAPI, disposables);
                } else {
                    disposables.dispose();
                }
            };

            disposables.add(
                extension.onDidChangeEnablement(
                    onDidChangeGitExtensionEnablement,
                ),
            );
            onDidChangeGitExtensionEnablement(extension.enabled);
        });
    };

    if (gitExtension) {
        initialize();
    } else {
        const listener = extensions.onDidChange(() => {
            if (
                !gitExtension &&
                extensions.getExtension<GitExtension>('vscode.git')
            ) {
                gitExtension =
                    extensions.getExtension<GitExtension>('vscode.git');
                initialize();
                listener.dispose();
            }
        });
        disposables.add(listener);
    }

    return disposables;
}
