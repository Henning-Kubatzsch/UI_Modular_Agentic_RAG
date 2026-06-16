declare namespace JSX {
  interface IntrinsicElements {
    'el-dropdown': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    'el-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      anchor?: string;
      popover?: boolean | string;
    };
  }
}
