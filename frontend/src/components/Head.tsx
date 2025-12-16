import { ReactNode } from 'react';

interface HeadProps {
  title?: string;
  children?: ReactNode;
}

export default function Head({ title = 'Cozy Kitchen', children }: HeadProps) {
  // This component is for meta tags, title, etc.
  return (
    <>
      <title>{title}</title>
      {children}
    </>
  );
}