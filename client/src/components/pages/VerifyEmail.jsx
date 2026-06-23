import { useNavigate } from 'react-router-dom';
import LogoGua from './../../LogoMD.svg';
import '../styles/Auth.css';

export default function VerifyEmail() {
  const navigate = useNavigate();

  return (
    <div className="auth-page fade-in">
      <main className="auth-main">
        <div className="auth-card">
          <img src={LogoGua} alt="DompetGua" className="auth-logo-img" />
          <h2>Cek Email Kamu!</h2>
          <p>Link konfirmasi sudah kami kirim ke emailmu. Silakan klik link tersebut untuk mengaktifkan akun <strong>DompetGua</strong>.</p>

          <div className="verify-icon-wrap">
            <div className="verify-icon-circle">
              <span className="material-symbols-outlined">mail</span>
            </div>
          </div>

          <div className="verify-footer">
            <p>Sudah konfirmasi? Coba login kembali.</p>
            <button onClick={() => navigate('/login')} className="btn-back-login">
              <span className="material-symbols-outlined">arrow_back</span>
              Kembali ke Login
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
