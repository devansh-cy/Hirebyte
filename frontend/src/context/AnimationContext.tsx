import { createContext, useContext, ReactNode } from 'react';

interface AnimationContextType {
  loaded: boolean;
  showContent: boolean;
}

const AnimationContext = createContext<AnimationContextType>({
  loaded: false,
  showContent: false,
});

export const useAnimation = () => useContext(AnimationContext);

export const AnimationProvider = ({ 
  children, 
  value 
}: { 
  children: ReactNode; 
  value: AnimationContextType 
}) => {
  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};
