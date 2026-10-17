import { flushSync } from 'react-dom';
import { useNavigate, type To } from 'react-router-dom';

const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useViewTransitionNavigate() {
    const navigate = useNavigate();

    return (to: To) => {
        if (!document.startViewTransition || prefersReducedMotion()) {
            navigate(to);
            return;
        }

        // The DOM must be updated inside the callback so the browser can snapshot the new page.
        document.startViewTransition(() => {
            flushSync(() => navigate(to));
        });
    };
}
