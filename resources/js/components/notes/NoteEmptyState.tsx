import React from 'react';

/** Shown in the right panel when no note is selected */
const NoteEmptyState = (): React.ReactElement => (
    <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-[648px]">
            <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor" className="text-dark-primary opacity-40">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <h3 className="text-dark-primary font-bold text-h5 m-0">
                Your Private Space
            </h3>
            <p className="text-dark-primary opacity-60 text-normal m-0">
                This section is for your personal, private notes. You can keep track of private ideas 
                and feedback here. All contents here are private. Your personal notes will appear here 
                when you create them.
            </p>
        </div>
    </div>
);

export default NoteEmptyState;