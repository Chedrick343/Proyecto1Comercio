import React from "react";
import {
    FaCog,
    FaUserShield,
    FaGem,
    FaPowerOff,
    FaQuestionCircle
} from "react-icons/fa";

import userImage from "../../assets/user-svgrepo-com.svg";
import styles from "./userSection.module.css";

export default function UserSection() {
    return (
        <section className={styles.userSection}>
            <header className={styles.header}>
                <h1>POST</h1>
            </header>

            <div className={styles.content}>
                <div className={styles.profile}>
                    <div className={styles.avatar}>
                        <img src={userImage} alt="User" />
                    </div>

                    <h2 className={styles.username}>
                        User12345678
                    </h2>
                </div>

                <nav className={styles.menu}>
                    <button className={styles.menuItem}>
                        <FaCog className={styles.icon} />
                        <span>Account configuration</span>
                    </button>

                    <button className={styles.menuItem}>
                        <FaUserShield className={styles.icon} />
                        <span>Privacy</span>
                    </button>

                    <button
                        className={`${styles.menuItem} ${styles.premium}`}
                    >
                        <FaGem className={styles.icon} />
                        <span>Try Post premium</span>
                    </button>

                    <button
                        className={`${styles.menuItem} ${styles.logout}`}
                    >
                        <FaPowerOff className={styles.icon} />
                        <span>Log out</span>
                    </button>

                    <button className={styles.menuItem}>
                        <FaQuestionCircle className={styles.icon} />
                        <span>Help center</span>
                    </button>
                </nav>
            </div>
        </section>
    );
}