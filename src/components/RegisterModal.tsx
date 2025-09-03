import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRegisterSuccess?: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onRegisterSuccess }) => {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        userName: "",
        password: "",
        confirmPassword: "",
        fullName: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError("");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Lösenorden matchar inte");
            setIsLoading(false);
            return;
        }

        try {
            await register(formData.email, formData.userName, formData.password, formData.fullName);
            onRegisterSuccess?.();
            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Registrering misslyckades";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ email: "", userName: "", password: "", confirmPassword: "", fullName: "" });
        setError("");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-b from-purple-600 to-purple-800 rounded-lg shadow-2xl w-96 max-w-md mx-4 relative">
                <button
                    onClick={handleClose}
                    className="absolute top-2 right-4 text-white text-xl hover:text-gray-300 z-10"
                    type="button"
                >
                    ×
                </button>

                <div className="bg-purple-600 text-white text-center py-4 rounded-t-lg">
                    <h2 className="text-xl font-medium">Registrera dig</h2>
                </div>

                <div className="bg-slate-800 p-8 rounded-b-lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="bg-red-500 text-white p-3 rounded-lg text-sm">{error}</div>}

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Email"
                            required
                            className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />

                        <input
                            type="text"
                            name="userName"
                            value={formData.userName}
                            onChange={handleInputChange}
                            placeholder="Användarnamn"
                            required
                            className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />

                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            placeholder="Fullständigt namn"
                            className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />

                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Lösenord"
                            required
                            className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />

                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Upprepa lösenord"
                            required
                            className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 rounded-lg transition-colors"
                        >
                            {isLoading ? "Registrerar..." : "Registrera"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterModal;
