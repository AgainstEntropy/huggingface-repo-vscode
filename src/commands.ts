import {
    CancellationError,
    Disposable,
    Uri,
    commands,
    window,
    env,
} from 'vscode';

import { API } from './typings/git';
import {
    DisposableStore,
    repositoryHasHuggingFaceRemote,
    getHuggingFaceRepositoryIdFromUrl,
} from './utils';
import { HAS_HF_REPO_CONTEXT, HF_PREFIX, OPEN_REPO_COMMAND } from './constants';

export function setHuggingFaceContext(
    gitAPI: API,
    disposables: DisposableStore,
) {
    if (
        gitAPI.repositories.find((repo) => repositoryHasHuggingFaceRemote(repo))
    ) {
        commands.executeCommand('setContext', HAS_HF_REPO_CONTEXT, true);
    } else {
        const openRepoDisposable = gitAPI.onDidOpenRepository(async (e) => {
            await e.status();
            if (repositoryHasHuggingFaceRemote(e)) {
                commands.executeCommand(
                    'setContext',
                    HAS_HF_REPO_CONTEXT,
                    true,
                );
                openRepoDisposable.dispose();
            }
        });
        disposables.add(openRepoDisposable);
    }
}

export function registerCommands(gitAPI: API): Disposable {
    const disposables = new DisposableStore();

    disposables.add(
        commands.registerCommand(OPEN_REPO_COMMAND, async () => {
            return openRepo(gitAPI);
        }),
    );

    return disposables;
}

async function openRepo(gitAPI: API) {
    try {
        const headlink = await getLink(gitAPI);
        headlink && env.openExternal(Uri.parse(headlink));
    } catch (err: any) {
        if (!(err instanceof CancellationError)) {
            window.showErrorMessage(err.message);
        }
    }
}

export async function getLink(gitAPI: API): Promise<string | undefined> {
    // Use the first repository that has a HuggingFace remote
    const hfRepo = gitAPI.repositories.find((repo) =>
        repositoryHasHuggingFaceRemote(repo),
    );
    if (!hfRepo) {
        return;
    }

    let repo: { owner: string; repo: string } | undefined;
    hfRepo.state.remotes.find((remote) => {
        if (remote.fetchUrl) {
            const foundRepo = getHuggingFaceRepositoryIdFromUrl(
                remote.fetchUrl,
            );
            if (
                foundRepo &&
                remote.name === hfRepo.state.HEAD?.upstream?.remote
            ) {
                repo = foundRepo;
                return;
            } else if (foundRepo && !repo) {
                repo = foundRepo;
            }
        }
        return;
    });
    if (!repo) {
        return;
    }

    return `${HF_PREFIX}/${repo.owner}/${repo.repo}`;
}
