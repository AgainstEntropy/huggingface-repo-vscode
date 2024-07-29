import { Disposable } from 'vscode';
import { Repository } from './typings/git';

export function repositoryHasHuggingFaceRemote(repository: Repository) {
    return !!repository.state.remotes.find((remote) =>
        remote.fetchUrl
            ? getHuggingFaceRepositoryIdFromUrl(remote.fetchUrl)
            : undefined,
    );
}

export function getHuggingFaceRepositoryIdFromUrl(
    url: string,
): { owner: string; repo: string } | undefined {
    const match =
        /^https:\/\/huggingface\.co\/([^/]+)\/([^/]+)$/i.exec(url) ||
        /^git@hf\.co:([^/]+)\/([^/]+)$/i.exec(url);
    return match ? { owner: match[1], repo: match[2] } : undefined;
}

export class DisposableStore {
    private disposables = new Set<Disposable>();

    add(disposable: Disposable): void {
        this.disposables.add(disposable);
    }

    dispose(): void {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }

        this.disposables.clear();
    }
}
