import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconFrame({ children, ...props }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return <IconFrame {...props}><circle cx="10.8" cy="10.8" r="6.6" /><path d="m16 16 4.2 4.2" /></IconFrame>;
}

export function PinIcon(props: IconProps) {
  return <IconFrame {...props}><path d="M20 10c0 5.2-8 11-8 11S4 15.2 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.6" /></IconFrame>;
}

export function MapIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m3.5 6.5 5-2.5 7 2.5 5-2.5v14l-5 2.5-7-2.5-5 2.5Z" /><path d="M8.5 4v14M15.5 6.5v14" /></IconFrame>;
}

export function LayersIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m12 3 9 4.8-9 4.8-9-4.8Z" /><path d="m4 12 8 4.3 8-4.3M4 16.2l8 4.3 8-4.3" /></IconFrame>;
}

export function TerrainIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m2.5 19 6.2-9 3.1 4 3.7-6 6 11Z" /><path d="m6.5 15.2 2.2-1.4 2 2.2 2.8-1.2 2.3 1.5" /></IconFrame>;
}

export function LocateIcon(props: IconProps) {
  return <IconFrame {...props}><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></IconFrame>;
}

export function ArrowLeftIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m14.5 5-7 7 7 7" /></IconFrame>;
}

export function CheckIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m5 12.5 4.2 4.2L19.5 6.5" /></IconFrame>;
}

export function ChevronUpIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m6 14.5 6-6 6 6" /></IconFrame>;
}

export function ChevronDownIcon(props: IconProps) {
  return <IconFrame {...props}><path d="m6 9.5 6 6 6-6" /></IconFrame>;
}
