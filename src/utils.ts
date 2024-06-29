import { extensions, Uri } from "vscode";
import { API, GitExtension, Repository } from "./typings/git";

export async function getHuggingFaceRepository(): Promise<Uri | undefined> {
	const url = await getRemoteUrl();
	const result = getHuggingFaceRepositoryIdFromUrl(url);
	if (!result) {
		return undefined;
	}

	const {owner, repo} = result;
	return Uri.parse(`https://huggingface.co/${owner}/${repo}`);
}

function getHuggingFaceRepositoryIdFromUrl(url: string): { owner: string; repo: string } | undefined {
	const match = /^https:\/\/huggingface\.co\/([^/]+)\/([^/]+)$/i.exec(url)
		|| /^git@hf\.co:([^/]+)\/([^/]+)$/i.exec(url);
	return match ? { owner: match[1], repo: match[2] } : undefined;
}

export function getHuggingFaceRepositoryFromQuery(query: string): { owner: string; repo: string } | undefined {
	const match = /^([^/]+)\/([^/]+)$/i.exec(query);
	return match ? { owner: match[1], repo: match[2] } : undefined;
}

export function repositoryHasHuggingFaceRemote(repository: Repository) {
	return !!repository.state.remotes.find(remote => remote.fetchUrl ? getHuggingFaceRepositoryIdFromUrl(remote.fetchUrl) : undefined);
}

export function toHttpsHuggingFaceRemote(url: string) {
	const {owner, repo} = getHuggingFaceRepositoryIdFromUrl(url)!;
	return `https://huggingface.co/${owner}/${repo}`;
}

export async function getGitAPI(): Promise<API> {
	const gitExtension = extensions.getExtension<GitExtension>('vscode.git');
	if (!gitExtension) {
		throw new Error('Git extension not found');
	} else {
		console.log('getGitAPI: Git extension found');
	}
	const extension = await gitExtension.activate();
	return extension.getAPI(1);
}

export async function getRemoteUrl(): Promise<string> {
	const gitAPI = await getGitAPI();
	console.log('getRemoteUrl: Git API found, state: ' + gitAPI.state);
	// wait for the gitAPI to initialize
	while (gitAPI.state === "uninitialized") {
		await new Promise(resolve => setTimeout(resolve, 500));
	}

	// wait for the repositories to load
	while (gitAPI.repositories.length === 0) {
		await new Promise(resolve => setTimeout(resolve, 500));
	}
	console.log('getRemoteUrl: repositories found');
	const repositories = gitAPI.repositories;

	// wait for the remotes to load
	while (repositories[0].state.remotes.length === 0) {
		await new Promise(resolve => setTimeout(resolve, 500));
	}
	const remotes = repositories[0].state.remotes;
	console.log('getRemoteUrl: remotes found');

	const remoteUrl = remotes[0].fetchUrl!;
	console.log(remoteUrl);

	return remoteUrl;
}