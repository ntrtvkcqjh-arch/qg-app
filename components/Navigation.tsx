"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LIENS = [
  { href: "/", label: "Kiosque" },
  { href: "/bureau", label: "Bureau" },
  { href: "/todo", label: "To-do" },
  { href: "/decisions", label: "Décisions" },
  { href: "/idees", label: "Idées" },
];

export default function Navigation() {
  const path = usePathname();
  return (
    <nav className="onglets" aria-label="Navigation principale">
      {LIENS.map(({ href, label }) => {
        const actif = href === "/" ? path === "/" || path.startsWith("/rapports") : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={actif ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
