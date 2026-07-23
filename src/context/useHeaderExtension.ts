import { useContext } from "react";
import {
  HeaderExtensionSettersContext,
  HeaderExtensionStateContext,
  type HeaderExtensionSetters,
  type HeaderExtensionState,
} from "./HeaderExtensionContexts";

/** Returns stable setters without subscribing the consumer to header state. */
export function useHeaderExtensionSetters(): HeaderExtensionSetters {
  return useContext(HeaderExtensionSettersContext);
}

/** Subscribes a header consumer to the current back link and kebab content. */
export function useHeaderExtension(): HeaderExtensionState {
  return useContext(HeaderExtensionStateContext);
}
