import { RenderingState, UIStateContract } from '../core/state.types';

const defaultStates = new Map<RenderingState, UIStateContract>();

defaultStates.set('loading', { state: 'loading', message: 'Loading content, please wait...' });
defaultStates.set('empty', { state: 'empty', message: 'No content is currently available here.' });
defaultStates.set('error', { state: 'error', message: 'Something went wrong. Please try again later.' });
defaultStates.set('permission_denied', { state: 'permission_denied', message: 'This content is restricted to members only.' });
defaultStates.set('not_found', { state: 'not_found', message: 'The requested resource could not be found.' });
defaultStates.set('unpublished', { state: 'unpublished', message: 'This page is a draft and is not published yet.' });
defaultStates.set('draft_preview', { state: 'draft_preview', message: 'You are viewing a draft version preview.' });
defaultStates.set('public_ready', { state: 'public_ready', message: 'Ready to display content.' });

export function getDefaultState(state: RenderingState, customMessage?: string): UIStateContract {
  const base = defaultStates.get(state) || { state };
  return {
    ...base,
    message: customMessage || base.message
  };
}
