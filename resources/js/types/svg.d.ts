declare module '*.svg' {
  import type * as React from 'react';
  export default function ReactComponent(
    props: React.SVGProps<SVGSVGElement>,
  ): React.JSX.Element;
}
