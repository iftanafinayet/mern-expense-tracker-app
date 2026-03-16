import { Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogoGua from './../../LogoMD.svg';
import '../styles/Auth.css';

export default function VerifyEmail() {
    const navigate = useNavigate();

    return (
        <div className="auth-container fade-in">
            <div className="auth-card verify-card">
                <div className="auth-header">
                    <img src={LogoGua} alt="DompetGua" className="loading-logo-bounce" style={{ width: '60px' }} />
                    <h2>Cek Email Kamu!</h2>
                    <p>Link konfirmasi sudah kami kirim ke emailmu. Silakan klik link tersebut untuk mengaktifkan akun <strong>DompetGua</strong>.</p>
                </div>

                <div className="verify-icon-wrapper">
                    <div className="icon-circle">
                        <Mail size={40} color="#3b82f6" />
                    </div>
                </div>

                <div className="verify-footer">
                    <p>Sudah konfirmasi? Coba login kembali.</p>
                    <button onClick={() => navigate('/login')} className="btn-back-login">
                        <ArrowLeft size={16} />
                        Kembali ke Login
                    </button>
                </div>
            </div>
        </div>
    );
}