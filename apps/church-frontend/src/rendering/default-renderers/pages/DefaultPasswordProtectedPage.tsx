import React from 'react';
import { DefaultPasswordState } from '../states/DefaultPasswordState';

export interface DefaultPasswordProtectedPageProps {
  onSubmitPassword?: (password: string) => void;
  incorrectAttempt?: boolean;
}

export const DefaultPasswordProtectedPage: React.FC<DefaultPasswordProtectedPageProps> = ({
  onSubmitPassword,
  incorrectAttempt
}) => {
  return React.createElement(
    'div',
    { className: 'min-h-[50vh] flex items-center justify-center font-sans' },
    React.createElement(DefaultPasswordState, {
      onSubmitPassword,
      incorrectAttempt
    })
  );
};
