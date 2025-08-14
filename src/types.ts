export interface CommitOptions {
  apply?: boolean;
  copy?: boolean;
  edit?: boolean;
  type?: string;
  provider?: string;
  detailed?: boolean;
}

export interface PullRequestOptions {
  title?: string;
  body?: string;
  draft?: boolean;
  target?: string;
  source?: string;
  reviewers?: string[];
}

export interface PreviousCommitOptions {
  apply?: boolean;
  copy?: boolean;
  edit?: boolean;
  amend?: boolean;
}

export interface ConfigOptions {
  reset?: boolean;
  list?: boolean;
}

export interface BranchOptions {
  remote?: boolean;
  copy?: boolean;
  delete?: boolean;
  force?: boolean;
}

export interface StatsOptions {
  days?: string;
  author?: string;
}

export interface TemplateOptions {
  list?: boolean;
  add?: string;
  remove?: string;
  use?: string;
}

export interface LogOptions {
  number?: string;
  since?: string;
  author?: string;
  ai?: boolean;
}

export interface DiffOptions {
  staged?: boolean;
  last?: boolean;
  ai?: boolean;
  file?: string;
}

export interface ReviewOptions {
  file?: string;
  severity?: string;
  format?: string;
}

export interface SuggestOptions {
  type?: boolean;
  scope?: boolean;
  branch?: boolean;
}

export interface UndoOptions {
  commit?: boolean;
  hard?: boolean;
  staged?: boolean;
}

export interface HistoryOptions {
  number?: string;
  clear?: boolean;
  export?: string;
}

export interface AliasOptions {
  list?: boolean;
  add?: string;
  remove?: string;
}

export interface InitOptions {
  hooks?: boolean;
  templates?: boolean;
  config?: boolean;
  all?: boolean;
}

export interface FeedbackOptions {
  bug?: boolean;
  feature?: boolean;
  rating?: string;
}

export interface UpdateOptions {
  check?: boolean;
  force?: boolean;
}

export interface AIProvider {
  name: string;
  generateCommitMessage(diff: string, type?: string, detailed?: boolean): Promise<string>;
}

export interface CommitTemplate {
  name: string;
  pattern: string;
  description: string;
}

export interface GitStats {
  totalCommits: number;
  authors: { [author: string]: number };
  commitTypes: { [type: string]: number };
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
}
