import type { ReactNode } from "react"
import ModernHeader from "./ModernHeader"
import ModernFooter from "./ModernFooter"

export default function ModernLayout({
  children,
  hideFooter = false,
}: {
  children: ReactNode
  hideFooter?: boolean
}) {
  return (
    <div className="gb-layout background-white">
      <ModernHeader />
      {children}
      {!hideFooter && <ModernFooter />}
    </div>
  )
}
