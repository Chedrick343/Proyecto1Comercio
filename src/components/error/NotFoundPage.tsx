import { Link } from 'react-router-dom';
import { FaCompass } from 'react-icons/fa';

import Header from '../header/Header';
import NavBar from '../navBar/NavBar';
import ErrorState from './ErrorState';

import styles from './ErrorState.module.css';

export default function NotFoundPage() {
    return (
        <main className="app">
            <div className="top-bar">
                <Header />
            </div>

            <ErrorState
                icon={FaCompass}
                title="No encontramos esta página"
                description="Es posible que el enlace esté incompleto o que la página ya no exista."
                actions={
                    <Link to="/" className={styles.primaryAction}>
                        Ir al catálogo
                    </Link>
                }
            />

            <NavBar />
        </main>
    );
}
