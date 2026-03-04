"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type UserMenuProps = {
  signOutAction: () => Promise<void>;
  userInitial: string;
  userName: string;
  userEmail: string | null | undefined;
  userImage: string | null | undefined;
};

export function UserMenu({ signOutAction, userInitial, userName, userEmail, userImage }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!menuRef.current) return;
      const target = event.target as Node;
      if (!menuRef.current.contains(target)) {
        setOpen(false);
      }
    }

    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className={open ? "user-menu-row is-open" : "user-menu-row"}
        aria-label="Pouzivatelske menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {userImage ? (
          <img src={userImage} alt="Profilova fotka" className="user-avatar" />
        ) : (
          <span className="user-avatar user-avatar-fallback" aria-hidden="true">
            {userInitial}
          </span>
        )}
        <span className="user-menu-info">
          <span className="user-menu-name">{userName}</span>
          <span className="user-menu-email">{userEmail}</span>
        </span>
        <span className="user-menu-chevron" aria-hidden="true" />
      </button>

      {open ? (
        <div className="user-menu-dropdown user-menu-dropdown--right">
          <Link href="/historia" onClick={() => setOpen(false)}>
            História generovania
          </Link>
          <Link href="/nastavenia" onClick={() => setOpen(false)}>
            Nastavenia
          </Link>
          <form action={signOutAction}>
            <button type="submit">Odhlásiť</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
