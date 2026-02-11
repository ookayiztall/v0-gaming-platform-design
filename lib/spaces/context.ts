'use client';

import { createContext, useContext } from 'react';

export interface Space {
  id: string;
  slug: string;
  name: string;
  description?: string;
  owner_id: string;
  plan_tier: 'free' | 'paid';
  invite_limit: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpaceContextType {
  currentSpace: Space | null;
  isPublic: boolean;
  setCurrentSpace: (space: Space | null) => void;
  userSpaces: Space[];
  setUserSpaces: (spaces: Space[]) => void;
}

export const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export const useSpace = () => {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpace must be used within SpaceProvider');
  }
  return context;
};

export const isPublicMode = (space: Space | null): boolean => {
  return space === null || space.is_public;
};
