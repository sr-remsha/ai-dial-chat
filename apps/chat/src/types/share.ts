export interface ShareInterface {
  isShared?: boolean;
  sharedWithMe?: boolean;
  isPublished?: boolean;
  publishedWithMe?: boolean;
  shareUniqueId?: string;
  originalId?: string;
  publishVersion?: string;
}

export enum SharingType {
  Conversation = 'conversation',
  ConversationFolder = 'conversations_folder',
  Prompt = 'prompt',
  PromptFolder = 'prompts_folder',
}

export interface UserGroup {
  id: string;
  name: string;
}

export interface TargetAudienceFilterItem {
  id: string;
  name: string;
}

export enum FiltersTypes {
  Contains = 'Contains',
  NotContains = 'Not contains',
  Equals = 'Equals',
  Regex = 'Regex',
}

export interface TargetAudienceFilter extends TargetAudienceFilterItem {
  filterType: FiltersTypes;
  filterParams: string[];
}

export interface PublishRequest {
  id: string;
  shareUniqueId: string;
  name: string;
  path: string;
  version: string;
  fileNameMapping: Map<string, string>;
  targetAudienceFilters?: {
    userGroups?: UserGroup[];
    other: TargetAudienceFilter[];
  };
}