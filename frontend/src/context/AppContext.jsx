// This context previously held stale localStorage-based mock data that has
// been replaced by live backend API calls in all dashboard pages.
// It is retained (empty) so any residual imports don't break at runtime.

import React, { createContext, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  return (
    <AppContext.Provider value={{}}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
