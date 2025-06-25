import type { SVGProps } from 'react';

export function ShipShapeLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
      <path d="M14 9h7c.6 0 1 .4 1 1v9c0 .6-.4 1-1 1h-7c-.6 0-1-.4-1-1v-9c0-.6.4-1 1-1Z" />
      <path d="M10 6V5c0-.6-.4-1-1-1H6c-.6 0-1 .4-1 1v1" />
      <path d="M17 14h.01" />
      <path d="M17 17h.01" />
      <circle cx="7.5" cy="18.5" r=".5" fill="currentColor" />
      <circle cx="10.5" cy="18.5" r=".5" fill="currentColor" />
    </svg>
  );
}
