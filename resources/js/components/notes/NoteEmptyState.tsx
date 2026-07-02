import React from 'react';

/** Shown in the editor panel when no note is selected. */
const NoteEmptyState = (): React.ReactElement => (
  <div className="flex flex-1 items-center justify-center">
    <div className="flex max-w-[480px] flex-col items-center gap-4 text-center select-none">
      <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor" className="text-dark-primary opacity-40">
        <path
          fillRule="evenodd"
          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
          clipRule="evenodd"
        />
      </svg>

      <h3 className="m-0 font-sans text-h5 font-bold text-dark-primary">No note selected</h3>

      <p className="m-0 font-sans text-normal leading-[22.4px] text-dark-primary opacity-60">
        Pick a note from the sidebar, or create a new one. Press{' '}
        <span className="rounded bg-dark-surface-3 px-1.5 py-0.5 text-small">/</span> anywhere in a note to insert
        headings, lists, images, and embeds.
      </p>
    </div>
  </div>
);

export default NoteEmptyState;
