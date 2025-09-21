import React, {useEffect, useState} from "react";
import { fetchUserResult } from "../../Services/leaderboardServices";
import { UserResult } from "../../types/leaderboard";
import styles from "./UserCard.module.css";

type UserCardProps = {
    classId: string;
};

export const UserCard: React.FC<UserCardProps> = ({ classId }) => {
    const [userResult, setUserResult] = useState<UserResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const loadUserResult = async () => {
            try {
                const result = await fetchUserResult(classId);
                setUserResult(result);
            } catch (err) {
                setError("Failed to load user result.");
                console.error(err);
            }   finally {
                setLoading(false);
            }
        };

        loadUserResult();
}, [classId]);

    if (loading) return <div className="user-card">Loading...</div>;
    if (error) return <div className="user-card error">{error}</div>;
    if (!userResult) return null;

    return (
        <div className={styles.userCard}>
            <h1>MINA RESULTAT</h1>
            <img src={userResult.avatarUrl} alt="Avatar" className={styles.avatar} />
    <div className={styles.username}>{userResult.username}</div>
    <div className={styles.score}>Poäng: {userResult.score}</div>
    <div className={styles.placement}>Placering #{userResult.placement}</div>
            </div>
    );
};
