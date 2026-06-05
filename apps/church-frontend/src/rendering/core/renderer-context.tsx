import React, { createContext, useContext } from 'react';
import { RendererContextValue } from './renderer.types';

const RendererContext = createContext<RendererContextValue | null>(null);

export const RendererProvider: React.FC<{
  value: RendererContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return React.createElement(RendererContext.Provider, { value }, children);
};

export const useRendererContext = (): RendererContextValue => {
  const context = useContext(RendererContext);
  if (!context) {
    throw new Error('useRendererContext must be used within a RendererProvider');
  }
  return context;
};
