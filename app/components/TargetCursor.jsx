"use client";
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';

const TargetCursor = ({ targetSelector = '.cursor-target', spinDuration = 2, hideDefaultCursor = false }) => {
  const cursorRef = useRef(null);
  const cornersRef = useRef(null);
  const spinTl = useRef(null);
  const dotRef = useRef(null);
  const constants = useMemo(
    () => ({
      borderWidth: 3,
      cornerSize: 12,
      parallaxStrength: 0.00005
    }),
    []
  );

  // Lightweight movement via requestAnimationFrame + lerp for smoothness
  const posRef = useRef({ x: window?.innerWidth / 2 || 0, y: window?.innerHeight / 2 || 0 });

  // Auto-disable on low-power devices, coarse pointers, or prefers-reduced-motion
  let tryDisable = false;
  if (typeof window !== 'undefined') {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const deviceMemory = navigator.deviceMemory || 0;
    const hwConcurrency = navigator.hardwareConcurrency || 0;
    if (prefersReduced || prefersCoarse || (deviceMemory && deviceMemory < 2) || (hwConcurrency && hwConcurrency <= 2)) {
      tryDisable = true;
    }
  }

  if (tryDisable) return null;

  useEffect(() => {
    if (!cursorRef.current) return;

    const originalCursor = document.body.style.cursor;
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Optionally hide the system cursor globally while this component is mounted
    if (hideDefaultCursor && !prefersReduced) {
      try {
        document.body.style.cursor = 'none';
      } catch (e) {}
    }

    const cursor = cursorRef.current;
    cornersRef.current = cursor.querySelectorAll('.target-cursor-corner');

  let activeTarget = null;
  let currentTargetMove = null;
  let currentLeaveHandler = null;
  let isAnimatingToTarget = false;
  let resumeTimeout = null;

    const cleanupTarget = target => {
      if (currentTargetMove) {
        target.removeEventListener('mousemove', currentTargetMove);
      }
      if (currentLeaveHandler) {
        target.removeEventListener('mouseleave', currentLeaveHandler);
      }
      currentTargetMove = null;
      currentLeaveHandler = null;
    };

  // Initialize position and place cursor; show by default (crosshair visible)
  posRef.current.x = window.innerWidth / 2;
  posRef.current.y = window.innerHeight / 2;
  cursor.style.left = posRef.current.x + 'px';
  cursor.style.top = posRef.current.y + 'px';
  cursor.style.opacity = '1';
  cursor.style.transition = 'opacity 120ms linear, transform 120ms linear';

    // Immediate follow for snappy feel; special behaviors still run for .cursor-target
    const onMouseMove = e => {
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;
      // Always update the DOM cursor position so the crosshair follows everywhere
      if (cursor) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const scrollHandler = () => {
      if (!activeTarget || !cursorRef.current) return;

      const mouseX = Math.round(posRef.current.x);
      const mouseY = Math.round(posRef.current.y);

      const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
      const isStillOverTarget =
        elementUnderMouse &&
        (elementUnderMouse === activeTarget || elementUnderMouse.closest(targetSelector) === activeTarget);

      if (!isStillOverTarget) {
        if (currentLeaveHandler) {
          currentLeaveHandler();
        }
      }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });

    const mouseDownHandler = () => {
      if (!dotRef.current) return;
      gsap.to(dotRef.current, { scale: 0.8, duration: 0.15, ease: 'power2.out' });
      gsap.to(cursorRef.current, { scale: 0.95, duration: 0.12, ease: 'power2.out' });
    };

    const mouseUpHandler = () => {
      if (!dotRef.current) return;
      gsap.to(dotRef.current, { scale: 1, duration: 0.18, ease: 'power2.out' });
      gsap.to(cursorRef.current, { scale: 1, duration: 0.12, ease: 'power2.out' });
    };

    window.addEventListener('mousedown', mouseDownHandler, { passive: true });
    window.addEventListener('mouseup', mouseUpHandler, { passive: true });

    const enterHandler = e => {
      const directTarget = e.target;

      const allTargets = [];
      let current = directTarget;
      while (current && current !== document.body) {
        if (current.matches && current.matches(targetSelector)) {
          allTargets.push(current);
        }
        current = current.parentElement;
      }

      const target = allTargets[0] || null;
  if (!target || !cursorRef.current || !cornersRef.current) return;

      if (activeTarget === target) return;

      if (activeTarget) {
        cleanupTarget(activeTarget);
      }

      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }

      activeTarget = target;
      // show custom cursor and hide system cursor while over targets
      try {
        if (hideDefaultCursor && !prefersReduced) document.body.style.cursor = 'none';
      } catch (e) {}
      if (cursor) {
        cursor.style.opacity = '1';
        // snap to current pointer position for immediate feedback
        cursor.style.left = (posRef.current.x || 0) + 'px';
        cursor.style.top = (posRef.current.y || 0) + 'px';
      }
      const corners = Array.from(cornersRef.current);
      corners.forEach(corner => {
        gsap.killTweensOf(corner);
      });

      const updateCorners = (mouseX, mouseY) => {
        const rect = target.getBoundingClientRect();
        const cursorRect = cursorRef.current.getBoundingClientRect();

        const cursorCenterX = cursorRect.left + cursorRect.width / 2;
        const cursorCenterY = cursorRect.top + cursorRect.height / 2;

        const [tlc, trc, brc, blc] = Array.from(cornersRef.current);

  const { borderWidth, cornerSize } = constants;
  // reduce parallax strength for snappier response
  const parallaxStrength = 0.01;

        let tlOffset = {
          x: rect.left - cursorCenterX - borderWidth,
          y: rect.top - cursorCenterY - borderWidth
        };
        let trOffset = {
          x: rect.right - cursorCenterX + borderWidth - cornerSize,
          y: rect.top - cursorCenterY - borderWidth
        };
        let brOffset = {
          x: rect.right - cursorCenterX + borderWidth - cornerSize,
          y: rect.bottom - cursorCenterY + borderWidth - cornerSize
        };
        let blOffset = {
          x: rect.left - cursorCenterX - borderWidth,
          y: rect.bottom - cursorCenterY + borderWidth - cornerSize
        };

        if (mouseX !== undefined && mouseY !== undefined) {
          const targetCenterX = rect.left + rect.width / 2;
          const targetCenterY = rect.top + rect.height / 2;
          const mouseOffsetX = (mouseX - targetCenterX) * parallaxStrength;
          const mouseOffsetY = (mouseY - targetCenterY) * parallaxStrength;

          tlOffset.x += mouseOffsetX;
          tlOffset.y += mouseOffsetY;
          trOffset.x += mouseOffsetX;
          trOffset.y += mouseOffsetY;
          brOffset.x += mouseOffsetX;
          brOffset.y += mouseOffsetY;
          blOffset.x += mouseOffsetX;
          blOffset.y += mouseOffsetY;
        }

        const tl = gsap.timeline();
        const corners = [tlc, trc, brc, blc];
        const offsets = [tlOffset, trOffset, brOffset, blOffset];

        corners.forEach((corner, index) => {
          tl.to(
            corner,
            {
              x: offsets[index].x,
              y: offsets[index].y,
              duration: 0.12,
              ease: 'power2.out'
            },
            0
          );
        });
      };

      isAnimatingToTarget = true;
      updateCorners();

      setTimeout(() => {
        isAnimatingToTarget = false;
      }, 1);

      let moveThrottle = null;
      const targetMove = ev => {
        if (moveThrottle || isAnimatingToTarget) return;
        moveThrottle = requestAnimationFrame(() => {
          const mouseEvent = ev;
          updateCorners(mouseEvent.clientX, mouseEvent.clientY);
          moveThrottle = null;
        });
      };

      const leaveHandler = () => {
        activeTarget = null;
        isAnimatingToTarget = false;

        if (cornersRef.current) {
          const corners = Array.from(cornersRef.current);
          gsap.killTweensOf(corners);

          const { cornerSize } = constants;
          const positions = [
            { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: cornerSize * 0.5 },
            { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
          ];

          const tl = gsap.timeline();
          corners.forEach((corner, index) => {
            tl.to(
              corner,
              {
                x: positions[index].x,
                y: positions[index].y,
                duration: 0.3,
                ease: 'power3.out'
              },
              0
            );
          });
        }

        // small resume timeout kept for symmetry; keep custom cursor visible
        resumeTimeout = setTimeout(() => {
          resumeTimeout = null;
        }, 50);

        cleanupTarget(target);
      };

      currentTargetMove = targetMove;
      currentLeaveHandler = leaveHandler;

      target.addEventListener('mousemove', targetMove);
      target.addEventListener('mouseleave', leaveHandler);
    };

    window.addEventListener('mouseover', enterHandler, { passive: true });

    return () => {
      // remove listeners we added
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', enterHandler);
      window.removeEventListener('scroll', scrollHandler);
      window.removeEventListener('mousedown', mouseDownHandler);
      window.removeEventListener('mouseup', mouseUpHandler);

      if (activeTarget) {
        cleanupTarget(activeTarget);
      }

      // restore cursor
      document.body.style.cursor = originalCursor;
    };
  }, [targetSelector, hideDefaultCursor]);

  // no-op: spinning removed to reduce CPU; keep component lightweight

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 w-0 h-0 pointer-events-none z-[9999] mix-blend-difference transform -translate-x-1/2 -translate-y-1/2"
      style={{ willChange: 'transform' }}
    >
      <div
        ref={dotRef}
        className="absolute left-1/2 top-1/2 w-1 h-1 bg-red-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"
        style={{ willChange: 'transform' }}
      />
      <div
        className="target-cursor-corner absolute left-1/2 top-1/2 w-3 h-3 border-[3px] border-red-400 transform -translate-x-[150%] -translate-y-[150%] border-r-0 border-b-0"
        style={{ willChange: 'transform' }}
      />
      <div
        className="target-cursor-corner absolute left-1/2 top-1/2 w-3 h-3 border-[3px] border-red-400 transform translate-x-1/2 -translate-y-[150%] border-l-0 border-b-0"
        style={{ willChange: 'transform' }}
      />
      <div
        className="target-cursor-corner absolute left-1/2 top-1/2 w-3 h-3 border-[3px] border-red-400 transform translate-x-1/2 translate-y-1/2 border-l-0 border-t-0"
        style={{ willChange: 'transform' }}
      />
      <div
        className="target-cursor-corner absolute left-1/2 top-1/2 w-3 h-3 border-[3px] border-red-400 transform -translate-x-[150%] translate-y-1/2 border-r-0 border-t-0"
        style={{ willChange: 'transform' }}
      />
    </div>
  );
};

export default TargetCursor;
