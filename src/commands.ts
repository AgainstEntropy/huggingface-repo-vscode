import { CancellationError, Disposable, Uri, commands, window, env } from "vscode";

import { API } from "./typings/git";
import { DisposableStore, repositoryHasHuggingFaceRemote, getHuggingFaceRepositoryIdFromUrl } from "./utils";
import { HF_PREFIX } from "./constants";


export function registerCommands(gitAPI: API): Disposable {
	const disposables = new DisposableStore();

	disposables.add(commands.registerCommand('huggingface.openRepo', async () => {
		return openRepo(gitAPI);
	}));

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
	const hostPrefix = HF_PREFIX;

	// Use the first repository that has a HuggingFace remote
	const hfRepo = gitAPI.repositories.find(repo => repositoryHasHuggingFaceRemote(repo));
	if (!hfRepo) {
		return;
	}

	let repo: { owner: string; repo: string } | undefined;
	hfRepo.state.remotes.find(remote => {
		if (remote.fetchUrl) {
			const foundRepo = getHuggingFaceRepositoryIdFromUrl(remote.fetchUrl);
			if (foundRepo && (remote.name === hfRepo.state.HEAD?.upstream?.remote)) {
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

	const url = `${hostPrefix}/${repo.owner}/${repo.repo}`;
	return url;
}