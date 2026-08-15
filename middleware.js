import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Only pages that show account data are gated. Gameplay routes stay open so the
 * arena is playable without an account — /api/match handles guests itself and
 * simply does not persist their results.
 *
 * /settings is deliberately public: it holds device-local preferences (sound,
 * motion, editor size, bot difficulty) that guests need too.
 */
const isProtectedRoute = createRouteMatcher([
  '/profile(.*)',
  '/api/profile(.*)',
  '/api/weapons/equip(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
