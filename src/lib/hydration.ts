import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * False while rendering on the server and during that component's hydration render,
 * true afterwards.
 *
 * Call this from the component that paints persisted UI, not from an ancestor. The app
 * shell hydrates behind a Suspense boundary, so a parent can already hold localStorage
 * state by the time a child hydrates. Gating in the child renders the server's markup
 * first and swaps in the persisted values on the next commit.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, onClient, onServer);
}
