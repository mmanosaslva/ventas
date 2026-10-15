import type { ReactNode, SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width={20}
      height={20}
      {...props}
    >
      {children}
    </svg>
  )
}

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
)
export const EyeIcon = (p: IconProps) => (
  <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Icon>
)
export const EyeOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.5 6.5A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.5-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </Icon>
)
export const MailIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>
)
export const LockIcon = (p: IconProps) => (
  <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Icon>
)
export const UserIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>
)
export const BoxIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v8" />
  </Icon>
)
export const ComboIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="m4 12 8 4 8-4M4 17l8 4 8-4" />
  </Icon>
)
export const TagIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" /><circle cx="8" cy="8" r="1.2" />
  </Icon>
)
export const HashIcon = (p: IconProps) => (
  <Icon {...p}><path d="M5 9h14M5 15h14M10 3 8 21M16 3l-2 18" /></Icon>
)
export const DollarIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 2v20M17 6.5C16 5.3 14.2 5 12 5c-2.8 0-4.5 1.2-4.5 3s1.7 2.6 4.5 3 4.5 1.2 4.5 3-1.7 3-4.5 3c-2.2 0-4-.5-5-1.8" /></Icon>
)
export const CashIcon = (p: IconProps) => (
  <Icon {...p}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></Icon>
)
export const TransferIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 8h16M16 4l4 4-4 4M20 16H4M8 12l-4 4 4 4" /></Icon>
)
export const PlusIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
)
export const MenuIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>
)
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>
)
export const PencilIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></Icon>
)
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Icon>
)
export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>
)
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>
)
export const HomeIcon = (p: IconProps) => (
  <Icon {...p}><path d="m3 11 9-8 9 8M5 10v10h14V10" /></Icon>
)
export const ReceiptIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" />
  </Icon>
)
export const ShieldIcon = (p: IconProps) => (
  <Icon {...p}><path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></Icon>
)
export const LogoutIcon = (p: IconProps) => (
  <Icon {...p}><path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9" /></Icon>
)
export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>
)
export const SortIcon = (p: IconProps) => (
  <Icon {...p}><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" /></Icon>
)
