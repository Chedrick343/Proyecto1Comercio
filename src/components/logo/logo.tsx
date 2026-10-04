import styles from './Logo.module.css';
import { Link } from 'react-router-dom';

export default function Logo() {
    return (
        <Link to="/" className={styles.logoContainer} aria-label="POST, inicio">
            <h1 className={styles.logo}>POST</h1>
        </Link>
    );
}