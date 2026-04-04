"use client";

import { useEffect } from "react";

let lockCount = 0;
let savedScrollY = 0;

function lockBody() {
  if (typeof window === "undefined") return;
  if (lockCount > 0) {
    lockCount += 1;
    return;
  }

  const body = document.body;
  const html = document.documentElement;

  savedScrollY = window.scrollY;
  const scrollbarWidth = window.innerWidth - html.clientWidth;

  body.dataset.scrollLock = "true";
  body.style.position = "fixed";
  body.style.top = `-${savedScrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  body.style.touchAction = "none";
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }

  lockCount = 1;
}

function unlockBody() {
  if (typeof window === "undefined") return;
  if (lockCount === 0) return;

  lockCount -= 1;
  if (lockCount > 0) return;

  const body = document.body;
  const y = savedScrollY;

  delete body.dataset.scrollLock;
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.overflow = "";
  body.style.touchAction = "";
  body.style.paddingRight = "";

  window.scrollTo(0, y);
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    lockBody();
    return () => unlockBody();
  }, [locked]);
}
