/**
 * @fileoverview Estado global de la analítica: registra eventos y expone los
 * del usuario o invitado activo.
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode
} from 'react';

import {
    MAX_STORED_EVENTS,
    readStoredEvents,
    writeStoredEvents
} from '../analytics/analyticsStorage';
import type {
    AnalyticsEvent,
    AnalyticsEventPayloads,
    AnalyticsEventType,
    AnalyticsSubject
} from '../analytics/analyticsTypes';
import {
    createAnalyticsEvent,
    isSameSubject,
    toUserSubject
} from '../analytics/eventPayloads';
import { getGuestSessionId } from '../session/guestSession';
import { useSession } from './SessionContext';

/** Valor que expone el contexto de analítica. */
interface AnalyticsContextType {
    /** Usuario o invitado al que se asocian los eventos nuevos. */
    activeSubject: AnalyticsSubject;

    /** Eventos del sujeto activo, del más antiguo al más reciente. */
    events: AnalyticsEvent[];

    /**
     * Registra un evento. Por defecto se asocia al sujeto activo; cuando la
     * propia acción cambia de sujeto (por ejemplo, LOGIN), se indica el nuevo.
     */
    track: <T extends AnalyticsEventType>(
        type: T,
        payload: AnalyticsEventPayloads[T],
        subject?: AnalyticsSubject
    ) => void;
}

/** Contexto de analítica; es undefined fuera de AnalyticsProvider. */
const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

/** Propiedades de AnalyticsProvider. */
interface AnalyticsProviderProps {
    children: ReactNode;
}

/**
 * Proveedor que guarda los eventos en localStorage y los asocia al usuario
 * con sesión iniciada o, si no hay, al invitado de este navegador. Debe estar
 * dentro de SessionProvider.
 *
 * @param props Propiedades del componente.
 * @param props.children Componentes que tendrán acceso al contexto.
 * @return El proveedor del contexto envolviendo a sus hijos.
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
    const { currentUser } = useSession();
    const [guestSessionId] = useState(getGuestSessionId);
    const [allEvents, setAllEvents] = useState<AnalyticsEvent[]>(readStoredEvents);

    useEffect(() => {
        writeStoredEvents(allEvents);
    }, [allEvents]);

    const activeSubject = useMemo<AnalyticsSubject>(
        () => currentUser ? toUserSubject(currentUser) : { type: 'guest', id: guestSessionId },
        [currentUser, guestSessionId]
    );

    const track = useCallback(
        <T extends AnalyticsEventType>(
            type: T,
            payload: AnalyticsEventPayloads[T],
            subject: AnalyticsSubject = activeSubject
        ) => {
            const event = createAnalyticsEvent(type, payload, subject);
            setAllEvents((previousEvents) => [...previousEvents, event].slice(-MAX_STORED_EVENTS));
        },
        [activeSubject]
    );

    const events = useMemo(
        () => allEvents.filter((event) => isSameSubject(event.subject, activeSubject)),
        [allEvents, activeSubject]
    );

    const value = useMemo(
        () => ({ activeSubject, events, track }),
        [activeSubject, events, track]
    );

    return (
        <AnalyticsContext.Provider value={value}>
            {children}
        </AnalyticsContext.Provider>
    );
}

/**
 * Da acceso a los eventos del sujeto activo y a la función para registrar
 * eventos nuevos.
 *
 * @return El valor del contexto de analítica.
 * @throws {Error} Si se usa fuera de AnalyticsProvider.
 */
export function useAnalytics() {
    const context = useContext(AnalyticsContext);

    if (!context) {
        throw new Error('useAnalytics debe utilizarse dentro de AnalyticsProvider');
    }

    return context;
}
