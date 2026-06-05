export type RenderingState =
  | 'loading'
  | 'empty'
  | 'error'
  | 'permission_denied'
  | 'not_found'
  | 'unpublished'
  | 'draft_preview'
  | 'public_ready';

export interface UIStateContract {
  state: RenderingState;
  message?: string;
  code?: string;
  retryAction?: string;
}
