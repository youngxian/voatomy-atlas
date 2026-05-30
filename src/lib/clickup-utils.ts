import type { ClickUpSpaceDetails, ClickUpListInfo } from './api';

type Folder = NonNullable<ClickUpSpaceDetails['folders']>[number];

/**
 * Finds the folder that contains the given list ID.
 * Returns undefined if no folder contains it (e.g. folderless list).
 */
export function getFolderForList(
  folders: Folder[] | undefined,
  listId: string,
): Folder | undefined {
  if (!folders) return undefined;
  return folders.find((f) => f.list_ids?.includes(listId));
}

/**
 * Returns whether the folder containing the given list ID has sprint-enabled lists.
 * Returns false if the list isn't inside any folder or the folder has no sprints.
 */
export function folderHasSprint(
  folders: Folder[] | undefined,
  listId: string,
): boolean {
  const folder = getFolderForList(folders, listId);
  return folder?.has_sprint === true;
}

/**
 * Returns the full list details for a given folder ID.
 */
export function getListsForFolder(
  folders: Folder[] | undefined,
  folderId: string,
): ClickUpListInfo[] {
  if (!folders) return [];
  const folder = folders.find((f) => f.id === folderId);
  return folder?.lists ?? [];
}

/**
 * Filters a list of ClickUpListInfo to only those with sprints.
 */
export function getSprintLists(lists: ClickUpListInfo[]): ClickUpListInfo[] {
  return lists.filter((l) => l.has_sprint);
}

/**
 * Filters a list of ClickUpListInfo to only those without sprints.
 */
export function getNonSprintLists(lists: ClickUpListInfo[]): ClickUpListInfo[] {
  return lists.filter((l) => !l.has_sprint);
}
