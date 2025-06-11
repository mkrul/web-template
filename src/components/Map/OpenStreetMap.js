export { default as DynamicMap } from './DynamicOpenStreetMap';
export { default as StaticMap } from './StaticOpenStreetMap';

export const isMapsLibLoaded = () => {
  return typeof window !== 'undefined' && window.L;
};
