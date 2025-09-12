import React, {useEffect, useState} from "react";
import { fetchUserResult } from "../../Services/leaderboardServices";
import { UserResult } from "../../types/leaderboard";

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
        <div className="user-card">
            <h2>Mina resultat</h2>
            <img src={userResult.avatarUrl} alt="Avatar" className="avatar" />
            <p><strong>{userResult.username}</strong></p>
            <p>Poäng: <strong>{userResult.score}</strong></p>
            <p>Placering: <strong>{userResult.placement}</strong></p>
            </div>
    );
};
