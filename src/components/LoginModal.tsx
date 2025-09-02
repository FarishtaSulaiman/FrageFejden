import React, { useState } from 'react';
import { AuthApi } from '../Api';
import { tokenStorage } from '../lib/http';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess?: (token: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        emailOrUserName: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const token = await AuthApi.login(formData);

            tokenStorage.set(token);

            if (onLoginSuccess) {
                onLoginSuccess(token);
            }
            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Inloggning misslyckades';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ emailOrUserName: '', password: '' });
        setError('');
        setShowPassword(false);
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
                    <h2 className="text-xl font-medium">Logga in</h2>
                </div>


                <div className="bg-slate-800 p-8 rounded-b-lg">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {error && (
                            <div className="bg-red-500 text-white p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}


                        <input
                            type="text"
                            name="emailOrUserName"
                            value={formData.emailOrUserName}
                            onChange={handleInputChange}
                            placeholder="Användarnamn"
                            required
                            className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />


                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Lösenord"
                            required
                            className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-700 placeholder-gray-500 border-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />


                        <div className="flex items-center space-x-2 text-white">
                            <input
                                type="checkbox"
                                id="showPassword"
                                checked={showPassword}
                                onChange={(e) => setShowPassword(e.target.checked)}
                                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <label htmlFor="showPassword" className="text-sm">
                                Visa lösenord
                            </label>
                        </div>


                        <div className="text-left">
                            <a href="#" className="text-blue-400 text-sm hover:underline">
                                Glömt ditt lösenord?
                            </a>
                        </div>


                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 rounded-lg transition-colors"
                        >
                            {isLoading ? 'Loggar in...' : 'Logga in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;