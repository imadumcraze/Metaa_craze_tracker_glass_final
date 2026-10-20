import { ContentItem, ContentAssignee } from '../types';

/**
 * Returns item.assignees if present; otherwise, if the legacy assignedToId exists,
 * returns a one-element array built from the legacy fields; otherwise [].
 */
export function getItemAssignees(item?: Partial<ContentItem> | null): ContentAssignee[] {
  if (!item) return [];
  if (item.assignees && Array.isArray(item.assignees)) {
    return item.assignees;
  }
  if (item.assignedToId) {
    return [
      {
        uid: item.assignedToId,
        name: item.assignedToName || 'Assigned Member',
        roleTitle: item.assignedToRole,
        active: item.assignedToActive ?? true
      }
    ];
  }
  return [];
}

/**
 * Returns true if the item is assigned to the given member uid.
 */
export function isAssignedTo(item: Partial<ContentItem> | null | undefined, uid?: string): boolean {
  if (!uid) return false;
  return getItemAssignees(item).some((a) => a.uid === uid);
}

/**
 * Builds assignees and assigneeIds arrays and clears legacy assignedTo* fields.
 */
export function buildAssigneeFields(list: ContentAssignee[]) {
  return {
    assignees: list,
    assigneeIds: list.map((a) => a.uid),
    assignedToId: undefined,
    assignedToName: undefined,
    assignedToRole: undefined,
    assignedToActive: undefined
  };
}

/**
 * Formats assignees' first names joined by ", " (for example "Kasun, Nimesha").
 */
export function formatAssigneesShort(item?: Partial<ContentItem> | null): string {
  const assignees = getItemAssignees(item);
  if (assignees.length === 0) return '';
  return assignees
    .map((a) => a.name.trim().split(' ')[0] || a.name.trim())
    .filter(Boolean)
    .join(', ');
}
