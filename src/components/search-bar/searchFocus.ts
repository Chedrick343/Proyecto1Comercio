interface SearchFocusState {
    focusSearch: true;
}

export const FOCUS_SEARCH_STATE: SearchFocusState = { focusSearch: true };

export const isSearchFocusRequested = (locationState: unknown): boolean =>
    typeof locationState === 'object' &&
    locationState !== null &&
    (locationState as Partial<SearchFocusState>).focusSearch === true;
